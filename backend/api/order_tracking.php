<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/response.php";

// Customer-facing status timeline for one order: only the status and when it changed.
// (The full audit trail in order_log.php stays admin-only, since it holds remarks and staff names.)
if ($_SERVER['REQUEST_METHOD'] !== 'GET' || empty($_GET['orderKey'])) {
    fail("orderKey is required");
}

$stmt = $pdo->prepare(
    "SELECT NewStatus AS Status, CreatedOn FROM orderlog WHERE OrderKeyRef = ? ORDER BY CreatedOn ASC"
);
$stmt->execute([$_GET['orderKey']]);
send($stmt->fetchAll());
