<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/crud.php";

if ($_SERVER['REQUEST_METHOD'] === 'GET' && !empty($_GET['orderKey'])) {
    $stmt = $pdo->prepare("SELECT * FROM orderlog WHERE OrderKeyRef = ? ORDER BY CreatedOn DESC");
    $stmt->execute([$_GET['orderKey']]);
    send($stmt->fetchAll());
}

handle_crud($pdo, "orderlog", "OrderLogkey", [
    "OrderKeyRef", "OldStatus", "NewStatus", "Remarks", "CreatedBy",
], "CreatedOn DESC");
