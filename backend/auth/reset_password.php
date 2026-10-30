<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/response.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail("Method not allowed", 405);
}

$body = json_input();
$token = trim($body['token'] ?? '');
$password = trim($body['password'] ?? '');

if (!preg_match('/^[0-9a-f]{64}$/', $token)) {
    fail("This reset link is invalid or has expired", 400);
}
if (strlen($password) < 6) {
    fail("Password must be at least 6 characters");
}

$stmt = $pdo->prepare(
    "SELECT Resetkey, UserKeyRef FROM passwordresets WHERE TokenHash = ? AND ExpiresOn > NOW() LIMIT 1"
);
$stmt->execute([hash('sha256', $token)]);
$reset = $stmt->fetch();
if (!$reset) {
    fail("This reset link is invalid or has expired", 400);
}

$pdo->prepare("UPDATE users SET Password = ?, ModifiedOn = NOW() WHERE Userkey = ?")
    ->execute([password_hash($password, PASSWORD_DEFAULT), $reset['UserKeyRef']]);

// One-time link, and log the user out of every existing session.
$pdo->prepare("DELETE FROM passwordresets WHERE UserKeyRef = ?")->execute([$reset['UserKeyRef']]);
$pdo->prepare("DELETE FROM sessions WHERE UserKeyRef = ?")->execute([$reset['UserKeyRef']]);

send(["message" => "Your password has been reset. You can now sign in."]);
