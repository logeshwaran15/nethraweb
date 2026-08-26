<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/crud.php";

if ($_SERVER['REQUEST_METHOD'] === 'GET' && !empty($_GET['userKey'])) {
    $stmt = $pdo->prepare("SELECT * FROM cartitems WHERE UserKeyRef = ?");
    $stmt->execute([$_GET['userKey']]);
    send($stmt->fetchAll());
}

handle_crud($pdo, "cartitems", "CartItemkey", ["UserKeyRef", "ProductKeyRef", "Qty"]);
