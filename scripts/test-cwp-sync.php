<?php
require __DIR__ . '/arcane-auto-update.php';
function check($ok, $message) { if (!$ok) { throw new Exception('TEST FAILED: ' . $message); } }
function fixture($extra = array()) {
    return array_merge(array('index.html' => '<html><header>New navbar</header>office</html>',
        'arcane.css' => 'body{color:green}', 'arcane.js' => '/* current */',
        'gallery.html' => '<html>gallery</html>', 'gallery/index.html' => '<html>gallery</html>',
        'scripts/cpanel.htaccess' => 'DirectoryIndex index.html',
        'assets/image.webp' => "RIFF\0binary"), $extra);
}
function transport($files, $sha, &$calls, $corrupt = false, $advance = false) {
    $refs = 0;
    return function($url) use ($files, $sha, &$calls, $corrupt, $advance, &$refs) {
        $calls[] = $url;
        if (strpos($url, '/git/ref/') !== false) {
            $refs++; return json_encode(array('object' => array('sha' => $advance && $refs > 1 ? str_repeat('b',40) : $sha)));
        }
        if (strpos($url, '/git/trees/') !== false) {
            $tree = array();
            foreach ($files as $path => $bytes) { $tree[] = array('path' => $path,'type' => 'blob','mode' => '100644','sha' => arcane_blob($bytes)); }
            return json_encode(array('truncated' => false, 'tree' => $tree));
        }
        $prefix = 'https://raw.githubusercontent.com/dangerous83/arcane/' . $sha . '/';
        check(strpos($url, $prefix) === 0, 'blob download is pinned to one commit');
        $path = rawurldecode(substr($url, strlen($prefix)));
        check(isset($files[$path]), 'only known fixture downloads');
        return $corrupt ? 'corrupted download' : $files[$path];
    };
}
function setup_case() {
    $base = sys_get_temp_dir() . '/arcane-cwp-' . uniqid(); mkdir($base,0700);
    mkdir($base . '/public'); file_put_contents($base . '/public/index.html', '<html>old</html>');
    return array($base, $base . '/public', $base . '/state');
}
function expected_failure($call) { try { $call(); } catch (Exception $e) { return $e->getMessage(); } throw new Exception('Expected failure'); }
$sha = str_repeat('a',40); $passed = 0;

list($base,$root,$state) = setup_case(); $calls = array(); $files = fixture(array('api/private.php'=>'secret','templates/site.html'=>'private','../escape.html'=>'bad'));
$fetch = transport($files,$sha,$calls);
$result = arcane_sync($root,$state,$fetch);
check(strpos($result,'Published') === 0,'initial complete publication');
check(file_get_contents($root.'/assets/image.webp') === "RIFF\0binary",'binary asset survives');
check(!file_exists($root.'/api/private.php') && !file_exists($root.'/templates/site.html') && !file_exists($base.'/escape.html'),'private and traversal paths excluded');
check(file_get_contents($state.'/previous/0') === '<html>old</html>','previous homepage backed up');
$calls = array(); check(strpos(arcane_sync($root,$state,$fetch),'Up to date') === 0,'unchanged release is skipped');
check(count($calls) === 1,'unchanged sync only checks branch, no blob downloads');
file_put_contents($root.'/index.html','accidental old upload');
arcane_sync($root,$state,$fetch); check(file_get_contents($root.'/index.html') === $files['index.html'],'overwritten page repaired');
$passed += 3; arcane_clear($base);

list($base,$root,$state) = setup_case(); $calls = array(); $fetch = transport(fixture(),$sha,$calls,true);
expected_failure(function() use($root,$state,$fetch){arcane_sync($root,$state,$fetch);});
check(file_get_contents($root.'/index.html') === '<html>old</html>' && !file_exists($state.'/current.json'),'bad checksum leaves live site and state untouched');
$passed++; arcane_clear($base);

list($base,$root,$state) = setup_case(); $calls = array(); $fetch = transport(fixture(),$sha,$calls,false,true);
expected_failure(function() use($root,$state,$fetch){arcane_sync($root,$state,$fetch);});
check(file_get_contents($root.'/index.html') === '<html>old</html>','branch advance during staging stops publication');
$passed++; arcane_clear($base);

list($base,$root,$state) = setup_case(); file_put_contents($root.'/company','unrelated hosting file');
file_put_contents($root.'/arcane.css','old CSS'); $calls=array(); $fetch=transport(fixture(array('company/index.html'=>'<html>company</html>')),$sha,$calls);
expected_failure(function() use($root,$state,$fetch){arcane_sync($root,$state,$fetch);});
check(file_get_contents($root.'/index.html')==='<html>old</html>' && file_get_contents($root.'/arcane.css')==='old CSS','failed publication rolls back changed files');
check(!file_exists($root.'/arcane.js') && !file_exists($state.'/journal.json'),'rollback removes newly introduced files and completes journal');
check(file_get_contents($root.'/company')==='unrelated hosting file','rollback preserves unrelated hosting files');
$passed++; arcane_clear($base);

list($base,$root,$state) = setup_case(); $calls=array(); $fetch=transport(fixture(array('projects/retired/index.html'=>'<html>retired</html>')),$sha,$calls);
arcane_sync($root,$state,$fetch); mkdir($root.'/api'); file_put_contents($root.'/api/server.php','private existing API');
$calls=array(); $fetch=transport(fixture(),str_repeat('c',40),$calls); arcane_sync($root,$state,$fetch);
check(!file_exists($root.'/projects/retired/index.html'),'previously managed deleted page retired');
check(file_get_contents($root.'/api/server.php')==='private existing API','existing server files preserved');
$passed++; arcane_clear($base);

list($base,$root,$state) = setup_case(); mkdir($base.'/outside'); symlink($base.'/outside',$root.'/assets');
$calls=array();$fetch=transport(fixture(),$sha,$calls);
expected_failure(function() use($root,$state,$fetch){arcane_sync($root,$state,$fetch);});
check(!file_exists($base.'/outside/image.webp') && file_get_contents($root.'/index.html')==='<html>old</html>','symlink cannot redirect publication');
$passed++; arcane_clear($base);

list($base,$root,$state) = setup_case(); mkdir($state,0700); mkdir($state.'/pending',0700);
file_put_contents($state.'/pending/0','<html>old</html>'); file_put_contents($root.'/index.html','interrupted page');
file_put_contents($state.'/journal.json',json_encode(array(array('path'=>'index.html','existed'=>true,'backup'=>0,'sha'=>arcane_blob('<html>old</html>'),'mode'=>0644))));
$fetch=function($url){throw new Exception('network unavailable');};
expected_failure(function() use($root,$state,$fetch){arcane_sync($root,$state,$fetch);});
check(file_get_contents($root.'/index.html')==='<html>old</html>' && !file_exists($state.'/journal.json'),'next run recovers interrupted publication before fetching');
$passed++; arcane_clear($base);

list($base,$root,$state) = setup_case(); $files=fixture();
foreach($files as $source=>$bytes){$path=arcane_public_path($source);if(!is_dir(dirname($root.'/'.$path))){mkdir(dirname($root.'/'.$path),0755,true);}file_put_contents($root.'/'.$path,$bytes);}
$calls=array();$fetch=transport($files,$sha,$calls);$result=arcane_sync($root,$state,$fetch);
check(strpos($result,'Up to date')===0,'manual ZIP publication can be enrolled without rewriting the site');
check(count($calls)===2 && !is_dir($state.'/previous'),'enrollment needs no blob downloads or full backup');
$passed++; arcane_clear($base);
echo 'PASS: '.$passed." CWP deployment scenarios\n";
