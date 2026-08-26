<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/crud.php";

// Extra read: GET ?orderKey=... returns only that order's line items.
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !empty($_GET['orderKey'])) {
    $stmt = $pdo->prepare("SELECT * FROM orderitems WHERE OrderKeyRef = ?");
    $stmt->execute([$_GET['orderKey']]);
    send($stmt->fetchAll());
}

handle_crud($pdo, "orderitems", "OrderItemkey", [
    "OrderKeyRef", "ProductKeyRef", "ProductName", "ProductImagePath", "Qty", "Price",
]);
