<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/response.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail("Method not allowed", 405);
}

$body = json_input();
$email = trim($body['email'] ?? '');
$password = trim($body['password'] ?? '');

if ($email === '' || $password === '') {
    fail("Email and password are required");
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE Email = ? LIMIT 1");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || $user['Password'] !== $password) {
    fail("Invalid email or password", 401);
}

if ((int)$user['IsActive'] === 0) {
    fail("This account has been blocked", 403);
}

$update = $pdo->prepare("UPDATE users SET LastLoginOn = NOW() WHERE Userkey = ?");
$update->execute([$user['Userkey']]);

unset($user['Password']);

send([
    "user" => $user,
    "redirectTo" => $user['Role'] === 'Admin' ? '/admin' : '/',
]);
