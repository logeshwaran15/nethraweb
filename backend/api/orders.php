<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/crud.php";
require_once __DIR__ . "/../helpers/auth.php";

$method = $_SERVER['REQUEST_METHOD'];
// Placing an order (POST) and tracking one (GET) stay public; changing its status is admin-only.
if ($method === 'PUT') require_admin($pdo);
$columns = [
    "OrderNumber", "UserKeyRef", "Subtotal", "Discount", "ShippingFee", "Total",
    "CouponCode", "Status", "PaymentMethod", "RazorpayOrderId", "RazorpayPaymentId",
    "PaymentStatus", "CourierName", "TrackingId", "CourierBillPath",
    "ShippingName", "ShippingPhone", "ShippingAddress",
];

// GET by the customer-facing OrderNumber (e.g. "NS1234567"), for the order-tracking search box.
if ($method === 'GET' && !empty($_GET['number'])) {
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE OrderNumber = ? LIMIT 1");
    $stmt->execute([$_GET['number']]);
    $row = $stmt->fetch();
    $row ? send($row) : fail("Order not found", 404);
}

// GET ?userKey=... is "My Orders" for one logged-in customer.
if ($method === 'GET' && !empty($_GET['userKey'])) {
    require_self_or_admin($pdo, $_GET['userKey']);
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE UserKeyRef = ? ORDER BY CreatedOn DESC");
    $stmt->execute([$_GET['userKey']]);
    send($stmt->fetchAll());
}

// A bare GET with no key/number/userKey lists every order — that's the admin dashboard/order list.
if ($method === 'GET' && empty($_GET['key']) && empty($_GET['number']) && empty($_GET['userKey'])) {
    require_admin($pdo);
}

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
