<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/crud.php";
require_once __DIR__ . "/../helpers/auth.php";

// Extra read: GET ?orderKey=... returns only that order's line items — used by
// customer order-success/track pages, so it stays public.
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !empty($_GET['orderKey'])) {
    $stmt = $pdo->prepare("SELECT * FROM orderitems WHERE OrderKeyRef = ?");
    $stmt->execute([$_GET['orderKey']]);
    send($stmt->fetchAll());
}

// A bare GET (every line item, across every customer's orders) is for admin
// reporting only.
if ($_SERVER['REQUEST_METHOD'] === 'GET' && empty($_GET['orderKey']) && empty($_GET['key'])) {
    require_admin($pdo);
}

handle_crud($pdo, "orderitems", "OrderItemkey", [
    "OrderKeyRef", "ProductKeyRef", "ProductName", "ProductImagePath", "Qty", "Price",
]);
