<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/response.php";

$method = $_SERVER['REQUEST_METHOD'];
$key = $_GET['key'] ?? null;

if ($method === 'GET') {
    if ($key) {
        $stmt = $pdo->prepare("SELECT Userkey, FullName, Email, PhoneNumber, Role, IsActive, CreatedOn, LastLoginOn FROM users WHERE Userkey = ?");
        $stmt->execute([$key]);
        $row = $stmt->fetch();
        $row ? send($row) : fail("Not found", 404);
    }
    $role = $_GET['role'] ?? null;
    if ($role) {
        $stmt = $pdo->prepare("SELECT Userkey, FullName, Email, PhoneNumber, Role, IsActive, CreatedOn, LastLoginOn FROM users WHERE Role = ? ORDER BY CreatedOn DESC");
        $stmt->execute([$role]);
    } else {
        $stmt = $pdo->query("SELECT Userkey, FullName, Email, PhoneNumber, Role, IsActive, CreatedOn, LastLoginOn FROM users ORDER BY CreatedOn DESC");
    }
    send($stmt->fetchAll());
}

if ($method === 'PUT') {
    if (!$key) fail("Missing ?key=");
    $body = json_input();
    $stmt = $pdo->prepare("UPDATE users SET IsActive = ?, ModifiedOn = NOW() WHERE Userkey = ?");
    $stmt->execute([(int)($body['IsActive'] ?? 1), $key]);
    $fetch = $pdo->prepare("SELECT Userkey, FullName, Email, PhoneNumber, Role, IsActive, CreatedOn, LastLoginOn FROM users WHERE Userkey = ?");
    $fetch->execute([$key]);
    send($fetch->fetch());
}

fail("Method not allowed", 405);
