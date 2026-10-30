<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/crud.php";
require_once __DIR__ . "/../helpers/auth.php";

// GET ?userKey=... returns that user's wishlisted product keys.
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !empty($_GET['userKey'])) {
    require_self_or_admin($pdo, $_GET['userKey']);
    $stmt = $pdo->prepare("SELECT * FROM wishlist WHERE UserKeyRef = ?");
    $stmt->execute([$_GET['userKey']]);
    send($stmt->fetchAll());
}

// PUT ?userKey=... replaces that user's whole wishlist with the given product keys in one call.
if ($_SERVER['REQUEST_METHOD'] === 'PUT' && !empty($_GET['userKey'])) {
    require_self_or_admin($pdo, $_GET['userKey']);
    $userKey = $_GET['userKey'];
    $body = json_input();
    $productKeys = is_array($body) ? $body : [];

    $pdo->beginTransaction();
    $pdo->prepare("DELETE FROM wishlist WHERE UserKeyRef = ?")->execute([$userKey]);
    $insert = $pdo->prepare(
        "INSERT INTO wishlist (Wishlistkey, UserKeyRef, ProductKeyRef) VALUES (?, ?, ?)"
    );
    foreach ($productKeys as $productKey) {
        if (!$productKey) continue;
        $insert->execute([new_key(), $userKey, $productKey]);
    }
    $pdo->commit();

    send(["saved" => count($productKeys)]);
}

handle_crud($pdo, "wishlist", "Wishlistkey", ["UserKeyRef", "ProductKeyRef"]);
