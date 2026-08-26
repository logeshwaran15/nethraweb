<?php
require_once __DIR__ . "/response.php";

// Loads the Razorpay Key ID (public, stored in paymentsettings) and Key Secret
// (private, server-only, from the gitignored razorpay.local.php override).
function razorpay_config(PDO $pdo): array {
    $row = $pdo->query("SELECT RazorpayEnabled, RazorpayKeyId FROM paymentsettings LIMIT 1")->fetch();
    $keyId = $row["RazorpayKeyId"] ?? null;

    $RAZORPAY_KEY_SECRET = "";
    $localOverride = __DIR__ . "/../config/razorpay.local.php";
    if (file_exists($localOverride)) {
        require $localOverride;
    }

    if (!$row || !$row["RazorpayEnabled"] || !$keyId || !$RAZORPAY_KEY_SECRET) {
        fail("Razorpay is not configured", 500);
    }

    return ["keyId" => $keyId, "keySecret" => $RAZORPAY_KEY_SECRET];
}

function razorpay_request(string $method, string $path, array $config, ?array $body = null): array {
    $ch = curl_init("https://api.razorpay.com/v1{$path}");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_USERPWD => "{$config['keyId']}:{$config['keySecret']}",
        CURLOPT_HTTPHEADER => ["Content-Type: application/json"],
        CURLOPT_POSTFIELDS => $body !== null ? json_encode($body) : null,
        CURLOPT_TIMEOUT => 20,
    ]);
    $response = curl_exec($ch);
    if ($response === false) {
        fail("Razorpay request failed: " . curl_error($ch), 502);
    }
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $data = json_decode($response, true);
    if ($status >= 400) {
        fail($data["error"]["description"] ?? "Razorpay API error", 502);
    }
    return is_array($data) ? $data : [];
}
