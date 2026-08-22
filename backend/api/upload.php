<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../helpers/response.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail("Method not allowed", 405);
}

if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    fail("No file uploaded");
}

$file = $_FILES['file'];

$allowed = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'gif' => 'image/gif'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if (!array_key_exists($ext, $allowed)) {
    fail("Unsupported file type: $ext");
}

$maxBytes = 5 * 1024 * 1024; // 5MB
if ($file['size'] > $maxBytes) {
    fail("File is too large (max 5MB)");
}

$uploadsDir = __DIR__ . "/../uploads";
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0777, true);
}

$filename = bin2hex(random_bytes(12)) . "." . $ext;
$destination = $uploadsDir . "/" . $filename;

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    fail("Failed to save the uploaded file", 500);
}

// Path relative to this backend's own root, so the frontend just prefixes it with VITE_API_BASE_URL.
send(["path" => "/uploads/" . $filename], 201);
