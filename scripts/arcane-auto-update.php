<?php
/* Arcane CWP static website sync. PHP 5.6+. Install OUTSIDE public_html. */
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }

function arcane_write($path, $bytes) {
    $dir = dirname($path);
    if (!is_dir($dir) && !mkdir($dir, 0700, true)) { throw new Exception('Cannot create private deployment directory'); }
    $tmp = $path . '.tmp';
    if (file_put_contents($tmp, $bytes) !== strlen($bytes) || !rename($tmp, $path)) {
        @unlink($tmp); throw new Exception('Cannot save deployment state');
    }
}
function arcane_json($bytes) {
    $value = json_decode($bytes, true);
    if (!is_array($value)) { throw new Exception('Invalid GitHub or deployment JSON'); }
    return $value;
}
function arcane_blob($bytes) { return sha1('blob ' . strlen($bytes) . "\0" . $bytes); }
function arcane_file_sha($path) {
    if (!is_file($path)) { return null; }
    $context = hash_init('sha1');
    hash_update($context, 'blob ' . filesize($path) . "\0");
    if (!hash_update_file($context, $path)) { throw new Exception('Cannot read published file'); }
    return hash_final($context);
}
function arcane_public_path($path) {
    if ($path === 'scripts/cpanel.htaccess') { return '.htaccess'; }
    if (!is_string($path) || strpos($path, "\0") !== false || strpos($path, '\\') !== false) { return null; }
    foreach (explode('/', $path) as $part) {
        if ($part === '' || $part[0] === '.' || $part === '..') { return null; }
    }
    $parts = explode('/', $path);
    if (count($parts) > 1 && !in_array($parts[0], array('assets','company','approach','careers','expertise','projects','gallery'), true)) { return null; }
    if (in_array($path, array('robots.txt', 'sitemap.xml'), true) || preg_match('/\.(html?|css|js|png|jpe?g|webp|svg|ico|mp3|mp4|webm|ogg|pdf|woff2?|ttf|otf)$/i', $path)) { return $path; }
    return null;
}
function arcane_target($root, $path) {
    if ($path !== '.htaccess' && arcane_public_path($path) !== $path) { throw new Exception('Unsafe published path'); }
    $target = $root . '/' . $path;
    $probe = $target;
    while ($probe !== $root) {
        if (is_link($probe)) { throw new Exception('Deployment will not follow symbolic links'); }
        $probe = dirname($probe);
    }
    return $target;
}
function arcane_clear($path) {
    if (!is_dir($path)) { return; }
    foreach (scandir($path) as $name) {
        if ($name === '.' || $name === '..') { continue; }
        $p = $path . '/' . $name;
        if (is_dir($p) && !is_link($p)) { arcane_clear($p); }
        elseif (!unlink($p)) { throw new Exception('Cannot clear private staging file'); }
    }
    if (!rmdir($path)) { throw new Exception('Cannot clear private staging directory'); }
}
function arcane_restore($root, $state, $journal) {
    foreach (array_reverse($journal) as $entry) {
        $target = arcane_target($root, $entry['path']);
        if ($entry['existed']) {
            $bytes = file_get_contents($state . '/pending/' . $entry['backup']);
            if ($bytes === false || arcane_blob($bytes) !== $entry['sha']) { throw new Exception('Backup verification failed; retain journal for recovery'); }
            $tmp = $target . '.arcane-restore';
            if (file_put_contents($tmp, $bytes) !== strlen($bytes) || !chmod($tmp, $entry['mode']) || !rename($tmp, $target)) { throw new Exception('Rollback incomplete; retain journal for recovery'); }
        } elseif (is_file($target) && !unlink($target)) { throw new Exception('Rollback incomplete'); }
    }
    if (is_file($state . '/pending/old-state.json')) {
        arcane_write($state . '/current.json', file_get_contents($state . '/pending/old-state.json'));
    } elseif (is_file($state . '/current.json')) { unlink($state . '/current.json'); }
    unlink($state . '/journal.json');
}
function arcane_sync($root, $state, $fetch) {
    if (!is_dir($root) || is_link($root) || !is_file($root . '/index.html')) { throw new Exception('Website directory not found'); }
    if (!is_dir($state) && !mkdir($state, 0700, true)) { throw new Exception('Cannot create sync state'); }
    chmod($state, 0700);
    $lock = fopen($state . '/lock', 'c');
    if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) { return 'Another sync is running'; }
    try {
        if (is_file($state . '/journal.json')) { arcane_restore($root, $state, arcane_json(file_get_contents($state . '/journal.json'))); }
        arcane_clear($state . '/pending');
        arcane_clear($state . '/stage');
        $ref = arcane_json(call_user_func($fetch, 'https://api.github.com/repos/dangerous83/arcane/git/ref/heads/main'));
        $sha = isset($ref['object']['sha']) ? $ref['object']['sha'] : '';
        if (!preg_match('/^[0-9a-f]{40}$/D', $sha)) { throw new Exception('Invalid release commit'); }
        $old = is_file($state . '/current.json') ? arcane_json(file_get_contents($state . '/current.json')) : array('files' => array());
        if (isset($old['commit']) && $old['commit'] === $sha) { $files = $old['files']; }
        else {
            $tree = arcane_json(call_user_func($fetch, 'https://api.github.com/repos/dangerous83/arcane/git/trees/' . $sha . '?recursive=1'));
            if (!isset($tree['tree']) || !empty($tree['truncated'])) { throw new Exception('Incomplete GitHub file list'); }
            $files = array();
            foreach ($tree['tree'] as $entry) {
                if ($entry['type'] !== 'blob') { continue; }
                $path = arcane_public_path($entry['path']);
                if ($path === null) { continue; }
                if (!in_array($entry['mode'], array('100644','100755'), true) || !preg_match('/^[0-9a-f]{40}$/D', $entry['sha'])) { throw new Exception('Unsupported release file'); }
                $files[$path] = array('source' => $entry['path'], 'sha' => $entry['sha']);
            }
        }
        foreach (array('index.html','arcane.css','arcane.js','gallery.html','gallery/index.html','.htaccess') as $required) {
            if (!isset($files[$required])) { throw new Exception('Release is incomplete: ' . $required); }
        }
        $changes = array();
        foreach ($files as $path => $entry) {
            $target = arcane_target($root, $path);
            if (is_dir($target)) { throw new Exception('A directory conflicts with a release file'); }
            if (arcane_file_sha($target) === $entry['sha']) { continue; }
            $urlPath = implode('/', array_map('rawurlencode', explode('/', $entry['source'])));
            $bytes = call_user_func($fetch, 'https://raw.githubusercontent.com/dangerous83/arcane/' . $sha . '/' . $urlPath);
            if (arcane_blob($bytes) !== $entry['sha']) { throw new Exception('Downloaded file checksum mismatch: ' . $path); }
            if (preg_match('/\.html?$/i', $path) && stripos($bytes, '</html>') === false) { throw new Exception('Incomplete HTML file'); }
            arcane_write($state . '/stage/' . count($changes), $bytes);
            $changes[] = array('path' => $path, 'stage' => count($changes), 'delete' => false);
        }
        foreach ($old['files'] as $path => $entry) {
            if (!isset($files[$path]) && is_file(arcane_target($root, $path))) { $changes[] = array('path' => $path, 'delete' => true); }
        }
        if (!$changes) {
            arcane_write($state . '/current.json', json_encode(array('commit' => $sha, 'files' => $files)));
            return 'Up to date: ' . $sha;
        }
        // Recheck the branch before publishing a staged release.
        $latest = arcane_json(call_user_func($fetch, 'https://api.github.com/repos/dangerous83/arcane/git/ref/heads/main'));
        if ($latest['object']['sha'] !== $sha) { throw new Exception('GitHub changed during staging; next run will retry'); }
        // Back up every changed file before changing any published file.
        mkdir($state . '/pending', 0700);
        if (is_file($state . '/current.json') && !copy($state . '/current.json', $state . '/pending/old-state.json')) { throw new Exception('Cannot back up release state'); }
        $journal = array();
        foreach ($changes as $i => $change) {
            $target = arcane_target($root, $change['path']); $exists = is_file($target);
            if ($exists && !copy($target, $state . '/pending/' . $i)) { throw new Exception('Cannot back up published file'); }
            $journal[] = array('path' => $change['path'], 'existed' => $exists, 'backup' => $i, 'sha' => $exists ? arcane_file_sha($target) : null, 'mode' => $exists ? fileperms($target) & 0777 : 0644);
        }
        arcane_write($state . '/journal.json', json_encode($journal));
        try {
            // Publish resources first, then HTML, so pages never reference missing new assets.
            usort($changes, function($a, $b) {
                $rankA = $a['delete'] ? 2 : (int)(bool)preg_match('/\.html?$/i', $a['path']);
                $rankB = $b['delete'] ? 2 : (int)(bool)preg_match('/\.html?$/i', $b['path']);
                return $rankA - $rankB;
            });
            foreach ($changes as $change) {
                $target = arcane_target($root, $change['path']);
                if ($change['delete']) { if (!unlink($target)) { throw new Exception('Cannot remove retired page'); } continue; }
                if (!is_dir(dirname($target)) && !@mkdir(dirname($target), 0755, true)) { throw new Exception('Cannot create website directory'); }
                $source = $state . '/stage/' . $change['stage'];
                if (!chmod($source, 0644) || !rename($source, $target)) { throw new Exception('Cannot publish website file'); }
            }
            arcane_write($state . '/current.json', json_encode(array('commit' => $sha, 'files' => $files)));
            if (!unlink($state . '/journal.json')) { throw new Exception('Cannot finish release journal'); }
        } catch (Exception $e) { arcane_restore($root, $state, $journal); throw $e; }
        // Retain just the previous changed files, rather than full copies of the website.
        arcane_clear($state . '/previous');
        rename($state . '/pending', $state . '/previous');
        arcane_clear($state . '/stage');
        return 'Published ' . $sha . ' (' . count($changes) . ' changed files)';
    } finally { flock($lock, LOCK_UN); fclose($lock); }
}
function arcane_https($url) {
    if (!function_exists('curl_init')) { throw new Exception('PHP cURL is required'); }
    $handle = curl_init($url);
    curl_setopt_array($handle, array(CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 15, CURLOPT_TIMEOUT => 120, CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2, CURLOPT_USERAGENT => 'Arcane-CWP-Website-Sync/1.0',
        CURLOPT_HTTPHEADER => array('Accept: application/vnd.github+json')));
    $body = curl_exec($handle); $status = curl_getinfo($handle, CURLINFO_HTTP_CODE);
    curl_close($handle);
    if ($body === false || $status !== 200) { throw new Exception('GitHub download failed (HTTP ' . $status . '); published website preserved'); }
    return $body;
}
if (realpath(isset($_SERVER['SCRIPT_FILENAME']) ? $_SERVER['SCRIPT_FILENAME'] : '') === __FILE__) {
    umask(0077); set_time_limit(0);
    try { echo gmdate('c') . ' ' . arcane_sync('/home/arcane/public_html', '/home/arcane/.arcane-live-sync', 'arcane_https') . "\n"; }
    catch (Exception $e) { fwrite(STDERR, gmdate('c') . ' ERROR: ' . $e->getMessage() . "\n"); exit(1); }
}
