<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/response.php";
require_once __DIR__ . "/../helpers/auth.php";

// Saved addresses are personal data — every operation is scoped to the owning
// user (or an Admin/Staff), never a bare CRUD table like products/categories.
$method = $_SERVER['REQUEST_METHOD'];
$columns = ["UserKeyRef", "Label", "FullName", "Phone", "AddressLine", "Landmark", "City", "State", "Pincode", "IsDefault"];

function fetch_address(PDO $pdo, string $key) {
    $stmt = $pdo->prepare("SELECT * FROM addresses WHERE Addresskey = ?");
    $stmt->execute([$key]);
    return $stmt->fetch();
}

if ($method === 'GET') {
    $userKey = $_GET['userKey'] ?? null;
    if (!$userKey) fail("Missing ?userKey=");
    require_self_or_admin($pdo, $userKey);

    $stmt = $pdo->prepare("SELECT * FROM addresses WHERE UserKeyRef = ? ORDER BY IsDefault DESC, CreatedOn DESC");
    $stmt->execute([$userKey]);
    send($stmt->fetchAll());
}

if ($method === 'POST') {
    $body = json_input();
    if (empty($body['UserKeyRef'])) fail("Missing UserKeyRef");
    require_self_or_admin($pdo, $body['UserKeyRef']);

    $id = new_key();
    $cols = array_merge(["Addresskey"], $columns);
    $placeholders = implode(", ", array_fill(0, count($cols), "?"));
    $colList = implode(", ", array_map(fn($c) => "`$c`", $cols));

    $values = [$id];
    foreach ($columns as $c) {
        $values[] = $body[$c] ?? null;
    }

    if (!empty($body['IsDefault'])) {
        $pdo->prepare("UPDATE addresses SET IsDefault = 0 WHERE UserKeyRef = ?")->execute([$body['UserKeyRef']]);
    }

    $pdo->prepare("INSERT INTO addresses ($colList) VALUES ($placeholders)")->execute($values);
    send(fetch_address($pdo, $id), 201);
}

if ($method === 'PUT') {
    $key = $_GET['key'] ?? null;
    if (!$key) fail("Missing ?key=");
    $existing = fetch_address($pdo, $key);
    if (!$existing) fail("Not found", 404);
    require_self_or_admin($pdo, $existing['UserKeyRef']);

    $body = json_input();
    if (!empty($body['IsDefault'])) {
        $pdo->prepare("UPDATE addresses SET IsDefault = 0 WHERE UserKeyRef = ? AND Addresskey != ?")
            ->execute([$existing['UserKeyRef'], $key]);
    }

    $set = implode(", ", array_map(fn($c) => "`$c` = COALESCE(?, `$c`)", $columns));
    $values = [];
    foreach ($columns as $c) {
        $values[] = array_key_exists($c, $body) ? $body[$c] : null;
    }
    $values[] = $key;

    $pdo->prepare("UPDATE addresses SET $set, ModifiedOn = NOW() WHERE Addresskey = ?")->execute($values);
    send(fetch_address($pdo, $key));
}

if ($method === 'DELETE') {
    $key = $_GET['key'] ?? null;
    if (!$key) fail("Missing ?key=");
    $existing = fetch_address($pdo, $key);
    if (!$existing) fail("Not found", 404);
    require_self_or_admin($pdo, $existing['UserKeyRef']);

    $pdo->prepare("DELETE FROM addresses WHERE Addresskey = ?")->execute([$key]);
    send(["deleted" => $key]);
}

fail("Method not allowed", 405);
