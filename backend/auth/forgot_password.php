<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/response.php";
require_once __DIR__ . "/../helpers/mail.php";
require_once __DIR__ . "/../helpers/captcha.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail("Method not allowed", 405);
}

$body = json_input();
require_captcha($body);
$email = trim($body['email'] ?? '');
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail("Please enter a valid email address");
}

// Where the reset link should point. Override per environment with the FRONTEND_URL
// environment variable, or by creating backend/config/app.local.php that sets $FRONTEND_URL.
$FRONTEND_URL = getenv("FRONTEND_URL") ?: "http://localhost:5173";
$appOverride = __DIR__ . "/../config/app.local.php";
if (file_exists($appOverride)) {
    require $appOverride;
}

// Always answer the same way, so this endpoint can't be used to discover which emails have accounts.
$generic = ["message" => "If an account exists for that email, a password reset link has been sent."];

$stmt = $pdo->prepare("SELECT Userkey, FullName, IsActive FROM users WHERE Email = ? LIMIT 1");
$stmt->execute([$email]);
$user = $stmt->fetch();
if (!$user || (int)$user['IsActive'] === 0) {
    send($generic);
}

// Throttle: one reset request per account per minute.
$recent = $pdo->prepare(
    "SELECT COUNT(*) FROM passwordresets WHERE UserKeyRef = ? AND CreatedOn > (NOW() - INTERVAL 1 MINUTE)"
);
$recent->execute([$user['Userkey']]);
if ((int)$recent->fetchColumn() > 0) {
    send($generic);
}

// Only the SHA-256 of the token is stored, so a database leak doesn't expose usable reset links.
$token = bin2hex(random_bytes(32));
$pdo->prepare("DELETE FROM passwordresets WHERE UserKeyRef = ?")->execute([$user['Userkey']]);
$pdo->prepare(
    "INSERT INTO passwordresets (Resetkey, UserKeyRef, TokenHash, ExpiresOn) VALUES (?, ?, ?, NOW() + INTERVAL 30 MINUTE)"
)->execute([new_key(), $user['Userkey'], hash('sha256', $token)]);

$link = rtrim($FRONTEND_URL, "/") . "/reset-password?token=" . $token;
$name = $user['FullName'] ?: "there";

$subject = "Reset your Nethra's password";
$message = "Hi {$name},\r\n\r\n"
    . "We received a request to reset your Nethra's password. Use the link below within 30 minutes:\r\n\r\n"
    . "{$link}\r\n\r\n"
    . "If you didn't ask for this, you can ignore this email — your password won't change.\r\n\r\n"
    . "Nethra's Mehandi & Accessories";
// Send through SMTP (config/mail.local.php). If SMTP isn't set up, fall back to PHP's mail().
[$sent, $reason] = send_mail($email, $subject, $message, $pdo);
if (!$sent) {
    $headers = "From: Nethra's <no-reply@" . ($_SERVER['SERVER_NAME'] ?? 'localhost') . ">\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n";
    $sent = @mail($email, $subject, $message, $headers);
}

// Couldn't send (e.g. local XAMPP with no mail server)? Keep the link and the reason in a log
// file so the problem is visible and the link can still be used while developing.
if (!$sent) {
    $logDir = __DIR__ . "/../logs";
    if (!is_dir($logDir)) {
        mkdir($logDir, 0777, true);
    }
    @file_put_contents(
        $logDir . "/reset_links.log",
        date("Y-m-d H:i:s") . "  {$email}  {$link}  (mail not sent: {$reason})\n",
        FILE_APPEND
    );
}

send($generic);
