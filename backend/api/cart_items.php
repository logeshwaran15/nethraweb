<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/crud.php";
require_once __DIR__ . "/../helpers/auth.php";

// GET ?userKey=... returns that user's saved cart lines.
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !empty($_GET['userKey'])) {
    require_self_or_admin($pdo, $_GET['userKey']);
    $stmt = $pdo->prepare("SELECT * FROM cartitems WHERE UserKeyRef = ?");
    $stmt->execute([$_GET['userKey']]);
    send($stmt->fetchAll());
}

// PUT ?userKey=... replaces that user's whole cart with the given lines in one call,
// so the frontend can push its in-memory cart without diffing row by row.
if ($_SERVER['REQUEST_METHOD'] === 'PUT' && !empty($_GET['userKey'])) {
    require_self_or_admin($pdo, $_GET['userKey']);
    $userKey = $_GET['userKey'];
    $body = json_input();
    $lines = is_array($body) ? $body : [];

    $pdo->beginTransaction();
    $pdo->prepare("DELETE FROM cartitems WHERE UserKeyRef = ?")->execute([$userKey]);
    $insert = $pdo->prepare(
        "INSERT INTO cartitems (CartItemkey, UserKeyRef, ProductKeyRef, VariantLabel, Qty) VALUES (?, ?, ?, ?, ?)"
    );
    foreach ($lines as $line) {
        if (empty($line['ProductKeyRef'])) continue;
        $insert->execute([
            new_key(), $userKey, $line['ProductKeyRef'],
            !empty($line['VariantLabel']) ? $line['VariantLabel'] : null,
            $line['Qty'] ?? 1,
        ]);
    }
    $pdo->commit();

    send(["saved" => count($lines)]);
}

handle_crud($pdo, "cartitems", "CartItemkey", ["UserKeyRef", "ProductKeyRef", "VariantLabel", "Qty"]);
