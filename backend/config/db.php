<?php
// Local XAMPP fallback (port 3307, root/no password) is used only when
// DB_* environment variables aren't set. Production sets these via
// backend/config/db.local.php (gitignored — never commit real credentials).
$DB_HOST = getenv("DB_HOST") ?: "127.0.0.1";
$DB_PORT = getenv("DB_PORT") ?: "3307";
$DB_NAME = getenv("DB_NAME") ?: "nethras_db";
$DB_USER = getenv("DB_USER") ?: "root";
$DB_PASS = getenv("DB_PASS") ?: "";

$localOverride = __DIR__ . "/db.local.php";
if (file_exists($localOverride)) {
    require $localOverride;
}

try {
    $pdo = new PDO(
        "mysql:host={$DB_HOST};port={$DB_PORT};dbname={$DB_NAME};charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    header("Content-Type: application/json");
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit;
}
