<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/response.php";
require_once __DIR__ . "/../helpers/auth.php";
require_once __DIR__ . "/../helpers/captcha.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail("Method not allowed", 405);
}

$body = json_input();
require_captcha($body);
$email = trim($body['email'] ?? '');
$password = trim($body['password'] ?? '');

if ($email === '' || $password === '') {
    fail("Email and password are required");
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE Email = ? LIMIT 1");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    fail("Invalid email or password", 401);
}

// Accounts created before hashing was added still have a plaintext Password.
// Verify against the hash first; if that fails, fall back to a plain match and
// transparently upgrade the stored value to a hash so it never has to happen again.
$isHashed = str_starts_with($user['Password'], '$2y$');
$valid = $isHashed
    ? password_verify($password, $user['Password'])
    : hash_equals($user['Password'], $password);

if (!$valid) {
    fail("Invalid email or password", 401);
}

if (!$isHashed) {
    $pdo->prepare("UPDATE users SET Password = ? WHERE Userkey = ?")
        ->execute([password_hash($password, PASSWORD_DEFAULT), $user['Userkey']]);
}

if ((int)$user['IsActive'] === 0) {
    fail("This account has been blocked", 403);
}

$update = $pdo->prepare("UPDATE users SET LastLoginOn = NOW() WHERE Userkey = ?");
$update->execute([$user['Userkey']]);

unset($user['Password']);

$session = create_session($pdo, $user['Userkey'], $user['Role']);

send([
    "user" => $user,
    "token" => $session['token'],
    "redirectTo" => $user['Role'] === 'Admin' ? '/admin' : '/',
]);
