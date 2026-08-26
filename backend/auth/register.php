<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/response.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail("Method not allowed", 405);
}

$body = json_input();
$fullName = trim($body['fullName'] ?? '');
$email = trim($body['email'] ?? '');
$phone = trim($body['phone'] ?? '');
$password = trim($body['password'] ?? '');

if ($fullName === '' || $email === '' || $password === '') {
    fail("Name, email and password are required");
}

$existing = $pdo->prepare("SELECT Userkey FROM users WHERE Email = ? LIMIT 1");
$existing->execute([$email]);
if ($existing->fetch()) {
    fail("An account with this email already exists", 409);
}

$key = new_key();
$insert = $pdo->prepare(
    "INSERT INTO users (Userkey, FullName, Email, Password, PhoneNumber, Role, IsActive, CreatedBy)
     VALUES (?, ?, ?, ?, ?, 'Customer', 1, ?)"
);
$insert->execute([$key, $fullName, $email, $password, $phone, $fullName]);

send([
    "user" => [
        "Userkey" => $key,
        "FullName" => $fullName,
        "Email" => $email,
        "PhoneNumber" => $phone,
        "Role" => "Customer",
    ],
    "redirectTo" => "/",
], 201);
