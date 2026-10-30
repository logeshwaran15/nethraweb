<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/crud.php";
require_once __DIR__ . "/../helpers/auth.php";

// GET stays public: checkout looks up shipping fee/ETA by pincode.
if ($_SERVER['REQUEST_METHOD'] !== 'GET') require_admin($pdo);

handle_crud($pdo, "deliveryzones", "Zonekey", [
    "ZoneName", "PincodePrefix", "DeliveryFee", "FreeShippingAbove",
    "EstimatedDays", "SortOrder", "IsActive",
], "SortOrder");
