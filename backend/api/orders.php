<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/crud.php";

$method = $_SERVER['REQUEST_METHOD'];
$columns = [
    "OrderNumber", "UserKeyRef", "Subtotal", "Discount", "ShippingFee", "Total",
    "CouponCode", "Status", "PaymentMethod", "CourierName", "TrackingId",
    "ShippingName", "ShippingPhone", "ShippingAddress",
];

// PUT with a Status change also writes an orderlog row, so the transition is auditable.
if ($method === 'PUT' && !empty($_GET['key'])) {
    $key = $_GET['key'];
    $body = json_input();

    if (array_key_exists('Status', $body)) {
        $current = $pdo->prepare("SELECT Status FROM orders WHERE Orderkey = ?");
        $current->execute([$key]);
        $row = $current->fetch();
        if ($row && $row['Status'] !== $body['Status']) {
            $logId = new_key();
            $pdo->prepare(
                "INSERT INTO orderlog (OrderLogkey, OrderKeyRef, OldStatus, NewStatus, Remarks, CreatedBy)
                 VALUES (?, ?, ?, ?, ?, ?)"
            )->execute([
                $logId,
                $key,
                $row['Status'],
                $body['Status'],
                $body['Remarks'] ?? null,
                $body['UpdatedBy'] ?? 'Admin',
            ]);
        }
    }
}

handle_crud($pdo, "orders", "Orderkey", $columns, "CreatedOn DESC");
