<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/response.php";
require_once __DIR__ . "/../helpers/auth.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail("Method not allowed", 405);
}

$token = bearer_token();
if ($token) {
    $pdo->prepare("DELETE FROM sessions WHERE Token = ?")->execute([$token]);
}

send(["loggedOut" => true]);
