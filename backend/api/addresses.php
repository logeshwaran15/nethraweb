<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/crud.php";

// GET ?userKey=... lists only that user's saved addresses.
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !empty($_GET['userKey'])) {
    $stmt = $pdo->prepare("SELECT * FROM Addresses WHERE UserKeyRef = ? ORDER BY IsDefault DESC, CreatedOn DESC");
    $stmt->execute([$_GET['userKey']]);
    send($stmt->fetchAll());
}

handle_crud($pdo, "Addresses", "Addresskey", [
    "UserKeyRef", "Label", "FullName", "Phone", "AddressLine",
    "Landmark", "City", "State", "Pincode", "IsDefault",
], "CreatedOn DESC");
