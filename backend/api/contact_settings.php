<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/response.php";

$method = $_SERVER['REQUEST_METHOD'];
$columns = ["SupportEmail", "SupportPhone", "WhatsappNumber", "Address", "InstagramUrl", "FacebookUrl"];

$row = $pdo->query("SELECT * FROM ContactSettings LIMIT 1")->fetch();

if ($method === 'GET') {
    if (!$row) {
        $id = new_key();
        $pdo->prepare("INSERT INTO ContactSettings (ContactSettingkey) VALUES (?)")->execute([$id]);
        $row = $pdo->query("SELECT * FROM ContactSettings LIMIT 1")->fetch();
    }
    send($row);
}

if ($method === 'PUT') {
    $body = json_input();
    if (!$row) {
        $id = new_key();
        $pdo->prepare("INSERT INTO ContactSettings (ContactSettingkey) VALUES (?)")->execute([$id]);
        $row = $pdo->query("SELECT * FROM ContactSettings LIMIT 1")->fetch();
    }
    $set = implode(", ", array_map(fn($c) => "`$c` = ?", $columns));
    $values = array_map(fn($c) => $body[$c] ?? null, $columns);
    $values[] = $row['ContactSettingkey'];
    $pdo->prepare("UPDATE ContactSettings SET $set, ModifiedOn = NOW() WHERE ContactSettingkey = ?")->execute($values);
    send($pdo->query("SELECT * FROM ContactSettings LIMIT 1")->fetch());
}

fail("Method not allowed", 405);
