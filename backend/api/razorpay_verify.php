<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/response.php";
require_once __DIR__ . "/../helpers/razorpay.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail("Method not allowed", 405);
}

$body = json_input();
$orderId = $body["razorpayOrderId"] ?? "";
$paymentId = $body["razorpayPaymentId"] ?? "";
$signature = $body["razorpaySignature"] ?? "";

if (!$orderId || !$paymentId || !$signature) {
    fail("Missing Razorpay payment details");
}

$config = razorpay_config($pdo);

$expected = hash_hmac("sha256", "{$orderId}|{$paymentId}", $config["keySecret"]);
if (!hash_equals($expected, $signature)) {
    fail("Payment signature verification failed", 400);
}

send(["verified" => true]);
