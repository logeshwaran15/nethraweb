<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/response.php";

// Single-row settings table: GET returns (or creates) the one row, PUT updates it.
$method = $_SERVER['REQUEST_METHOD'];
$columns = ["SiteTitle", "MetaDescription", "MetaKeywords", "OgImagePath", "CanonicalUrl"];

$row = $pdo->query("SELECT * FROM SeoSettings LIMIT 1")->fetch();

if ($method === 'GET') {
    if (!$row) {
        $id = new_key();
        $pdo->prepare("INSERT INTO SeoSettings (SeoSettingkey) VALUES (?)")->execute([$id]);
        $row = $pdo->query("SELECT * FROM SeoSettings LIMIT 1")->fetch();
    }
    send($row);
}

if ($method === 'PUT') {
    $body = json_input();
    if (!$row) {
        $id = new_key();
        $pdo->prepare("INSERT INTO SeoSettings (SeoSettingkey) VALUES (?)")->execute([$id]);
        $row = $pdo->query("SELECT * FROM SeoSettings LIMIT 1")->fetch();
    }
    $set = implode(", ", array_map(fn($c) => "`$c` = ?", $columns));
    $values = array_map(fn($c) => $body[$c] ?? null, $columns);
    $values[] = $row['SeoSettingkey'];
    $pdo->prepare("UPDATE SeoSettings SET $set, ModifiedOn = NOW() WHERE SeoSettingkey = ?")->execute($values);
    send($pdo->query("SELECT * FROM SeoSettings LIMIT 1")->fetch());
}

fail("Method not allowed", 405);
