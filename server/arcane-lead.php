<?php
/* Install this file as /home/arcane/public_html/arcane-lead.php. PHP 5.6+. */
function arcane_lead_random($length) {
    if (function_exists('random_bytes')) { return bin2hex(random_bytes($length)); }
    if (function_exists('openssl_random_pseudo_bytes')) {
        $strong = false; $bytes = openssl_random_pseudo_bytes($length, $strong);
        if ($bytes !== false && $strong) { return bin2hex($bytes); }
    }
    throw new Exception('Secure randomness is unavailable');
}
function arcane_lead_write($path, $data) {
    $bytes = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    if ($bytes === false) { throw new Exception('Invalid enquiry encoding'); }
    $temp = $path . '.' . arcane_lead_random(6) . '.tmp';
    if (file_put_contents($temp, $bytes, LOCK_EX) !== strlen($bytes) || !chmod($temp, 0600) || !rename($temp, $path)) {
        @unlink($temp); throw new Exception('Cannot retain enquiry');
    }
}
function arcane_lead_validate($input) {
    if (!is_array($input)) { return array('error' => 'Please complete the enquiry form.'); }
    $limits = array('name' => 100, 'email' => 200, 'phone' => 40, 'company' => 160, 'message' => 3000, 'service' => 60, 'source' => 100, 'website' => 200, 'request_id' => 32, 'consent' => 3);
    $clean = array();
    foreach ($limits as $field => $limit) {
        $value = isset($input[$field]) ? $input[$field] : '';
        if (!is_string($value) || strlen($value) > $limit * 4 || preg_match('//u', $value) !== 1) { return array('error' => 'Please check the information entered.'); }
        $count = function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : preg_match_all('/./us', $value, $unused);
        if ($count > $limit || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value)) { return array('error' => 'Please check the information entered.'); }
        $clean[$field] = trim($value);
    }
    if ($clean['website'] !== '') { return array('error' => 'Please leave the website field empty.'); }
    if ($clean['name'] === '' || preg_match('/[\r\n]/', $clean['name']) || strlen($clean['name']) < 2) { return array('error' => 'Please enter your full name.'); }
    if (!filter_var($clean['email'], FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $clean['email'])) { return array('error' => 'Please enter a valid email address.'); }
    $digits = preg_replace('/\D/', '', $clean['phone']);
    if (strlen($digits) < 7 || strlen($digits) > 15 || !preg_match('/^[+0-9().\s-]+$/D', $clean['phone'])) { return array('error' => 'Please enter a valid phone number including the country code.'); }
    if (!in_array($clean['service'], array('Sculptural GRG', 'Ceilings', 'Partitions', 'Complete project / other'), true)) { return array('error' => 'Please select the expertise you are interested in.'); }
    if ($clean['consent'] !== 'yes') { return array('error' => 'Please confirm that Arcane may contact you about this enquiry.'); }
    if (!preg_match('/^[a-f0-9]{32}$/D', $clean['request_id'])) { return array('error' => 'Please reopen the form and try again.'); }
    return $clean;
}
function arcane_lead_origin_allowed($origin) {
    return in_array($origin, array('https://www.arcane.ae', 'https://arcane.ae'), true);
}
function arcane_lead_store_send($clean, $directory, $clientKey, $sender, $now) {
    if (is_link($directory)) { throw new Exception('Unsafe enquiry directory'); }
    if (!is_dir($directory) && !mkdir($directory, 0700, true)) { throw new Exception('Cannot create enquiry directory'); }
    if (!chmod($directory, 0700)) { throw new Exception('Cannot protect enquiry directory'); }
    $lock = fopen($directory . '/.lock', 'c');
    if (!$lock || !flock($lock, LOCK_EX)) { throw new Exception('Cannot lock enquiry storage'); }
    @chmod($directory . '/.lock', 0600);
    try {
        $file = $directory . '/' . $clean['request_id'] . '.json';
        if (is_link($file)) { throw new Exception('Unsafe enquiry file'); }
        if (is_file($file)) {
            $old = json_decode(file_get_contents($file), true);
            if (is_array($old) && isset($old['delivery']) && $old['delivery'] === 'queued') { return array('ok' => true, 'reference' => $old['reference']); }
        }
        $rateFile = $directory . '/.rate.json';
        if (is_link($rateFile)) { throw new Exception('Unsafe rate file'); }
        $rates = is_file($rateFile) ? json_decode(file_get_contents($rateFile), true) : array();
        if (!is_array($rates)) { $rates = array(); }
        foreach ($rates as $key => $attempts) {
            $rates[$key] = array_values(array_filter($attempts, function($time) use ($now) { return $time > $now - 3600; }));
            if (!$rates[$key]) { unset($rates[$key]); }
        }
        if (isset($rates[$clientKey]) && count($rates[$clientKey]) >= 12) { return array('error' => 'Too many enquiries have been sent. Please try again later or contact our team directly.', 'status' => 429); }
        if (!isset($rates[$clientKey])) { $rates[$clientKey] = array(); }
        $rates[$clientKey][] = $now; arcane_lead_write($rateFile, $rates);
        $reference = 'ARC-' . gmdate('ymd', $now) . '-' . strtoupper(substr($clean['request_id'], 0, 8));
        $record = array('reference' => $reference, 'received_at' => gmdate('c', $now), 'delivery' => 'pending', 'enquiry' => $clean);
        unset($record['enquiry']['website'], $record['enquiry']['request_id']);
        arcane_lead_write($file, $record);
        $subject = 'Website project enquiry [' . $reference . ']';
        $body = "New Arcane website enquiry\nReference: " . $reference . "\nReceived: " . gmdate('c', $now) . "\n\nName: " . $clean['name'] . "\nEmail: " . $clean['email'] . "\nPhone: " . $clean['phone'] . "\nCompany: " . ($clean['company'] !== '' ? $clean['company'] : 'Not supplied') . "\nExpertise: " . $clean['service'] . "\nSource: " . $clean['source'] . "\n\nProject details:\n" . ($clean['message'] !== '' ? $clean['message'] : 'Not supplied') . "\n\nContact consent: supplied with this enquiry.\n";
        $headers = "From: Arcane Website <website@arcane.ae>\r\nReply-To: " . $clean['email'] . "\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n";
        $sent = call_user_func($sender, 'info@arcane.ae', $subject, $body, $headers);
        $record['delivery'] = $sent ? 'queued' : 'failed'; arcane_lead_write($file, $record);
        // Retain private enquiry copies for 90 days; remove only this handler's old JSON records.
        foreach (glob($directory . '/*.json') as $candidate) {
            if (preg_match('/^[a-f0-9]{32}\.json$/D', basename($candidate)) && !is_link($candidate) && filemtime($candidate) < $now - 90 * 86400) { @unlink($candidate); }
        }
        if (!$sent) { return array('error' => 'Your enquiry could not be emailed right now. Please try again or contact info@arcane.ae directly.', 'status' => 503); }
        return array('ok' => true, 'reference' => $reference);
    } finally { flock($lock, LOCK_UN); fclose($lock); }
}
function arcane_lead_respond($status, $body) {
    http_response_code($status); header('Content-Type: application/json; charset=UTF-8'); header('Cache-Control: no-store, max-age=0'); header('X-Content-Type-Options: nosniff');
    echo json_encode($body); exit;
}
function arcane_lead_http() {
    header('Cache-Control: no-store, max-age=0'); header('X-Content-Type-Options: nosniff');
    $method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : '';
    if (!in_array($method, array('GET', 'POST'), true)) { header('Allow: GET, POST'); arcane_lead_respond(405, array('message' => 'Please use the project enquiry form.')); }
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    if ($origin !== '' && !arcane_lead_origin_allowed($origin)) { arcane_lead_respond(403, array('message' => 'Please submit this form from the Arcane website.')); }
    ini_set('session.use_strict_mode', '1'); ini_set('session.use_only_cookies', '1');
    session_name('arcane_enquiry');
    if (version_compare(PHP_VERSION, '7.3.0', '>=')) { session_set_cookie_params(array('lifetime' => 0, 'path' => '/', 'secure' => true, 'httponly' => true, 'samesite' => 'Lax')); }
    else { session_set_cookie_params(0, '/; SameSite=Lax', '', true, true); }
    if (!session_start()) { throw new Exception('Cannot start enquiry session'); }
    if (!isset($_SESSION['arcane_csrf'])) { $_SESSION['arcane_csrf'] = arcane_lead_random(32); }
    if ($method === 'GET') {
        if (isset($_SESSION['arcane_completed'])) { unset($_SESSION['arcane_request'], $_SESSION['arcane_completed']); }
        if (!isset($_SESSION['arcane_request'])) { $_SESSION['arcane_request'] = arcane_lead_random(16); }
        arcane_lead_respond(200, array('csrf' => $_SESSION['arcane_csrf'], 'request_id' => $_SESSION['arcane_request']));
    }
    if (isset($_SERVER['CONTENT_LENGTH']) && (int)$_SERVER['CONTENT_LENGTH'] > 24000) { arcane_lead_respond(413, array('message' => 'Please shorten your project details.')); }
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input) || !isset($input['csrf']) || !is_string($input['csrf']) || !hash_equals($_SESSION['arcane_csrf'], $input['csrf']) || !isset($input['request_id'], $_SESSION['arcane_request']) || !is_string($input['request_id']) || !hash_equals($_SESSION['arcane_request'], $input['request_id'])) {
        arcane_lead_respond(403, array('message' => 'Please reopen the form and try again.'));
    }
    $clean = arcane_lead_validate($input);
    if (isset($clean['error'])) { arcane_lead_respond(422, array('message' => $clean['error'])); }
    $home = dirname(__DIR__); // Installed in public_html: private sibling directory is outside the website.
    $directory = $home . '/.arcane-enquiries';
    $secretFile = $home . '/.arcane-enquiry-key';
    if (is_link($secretFile)) { throw new Exception('Unsafe enquiry key'); }
    $key = is_file($secretFile) ? file_get_contents($secretFile) : '';
    if ($key === '') {
        $handle = @fopen($secretFile, 'x');
        if ($handle) { $key = arcane_lead_random(32); chmod($secretFile, 0600); fwrite($handle, $key); fclose($handle); }
        else { $key = is_file($secretFile) ? file_get_contents($secretFile) : ''; }
    }
    if (strlen($key) < 32) { throw new Exception('Cannot protect enquiry rate data'); }
    $clientKey = hash_hmac('sha256', isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown', $key);
    $result = arcane_lead_store_send($clean, $directory, $clientKey, function($to, $subject, $body, $headers) {
        return function_exists('mail') && @mail($to, $subject, $body, $headers);
    }, time());
    if (isset($result['error'])) { arcane_lead_respond($result['status'], array('message' => $result['error'])); }
    // Keep the successful ID until the next GET; a retry cannot send a second email.
    $_SESSION['arcane_completed'] = $_SESSION['arcane_request'];
    arcane_lead_respond(200, $result);
}
if (PHP_SAPI !== 'cli') {
    umask(0077); ini_set('display_errors', '0');
    try {
        arcane_lead_http();
    } catch (Exception $error) { error_log('Arcane enquiry handler: ' . $error->getMessage()); arcane_lead_respond(503, array('message' => 'Your enquiry could not be emailed right now. Please try again or contact info@arcane.ae directly.')); }
}
