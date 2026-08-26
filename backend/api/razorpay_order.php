<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/response.php";
require_once __DIR__ . "/../helpers/razorpay.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail("Method not allowed", 405);
}

$body = json_input();
$amount = $body["amount"] ?? null; // rupees, converted to paise below
if (!is_numeric($amount) || $amount <= 0) {
    fail("A positive amount is required");
}

$config = razorpay_config($pdo);

$order = razorpay_request("POST", "/orders", $config, [
    "amount" => (int) round($amount * 100),
    "currency" => "INR",
    "receipt" => "ns_" . bin2hex(random_bytes(8)),
]);

send([
    "razorpayOrderId" => $order["id"],
    "amount" => $order["amount"],
    "currency" => $order["currency"],
    "keyId" => $config["keyId"],
]);
