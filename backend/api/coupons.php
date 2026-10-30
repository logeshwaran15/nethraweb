<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/crud.php";
require_once __DIR__ . "/../helpers/auth.php";

// GET stays public: checkout validates a typed-in coupon code against this list.
if ($_SERVER['REQUEST_METHOD'] !== 'GET') require_admin($pdo);

handle_crud($pdo, "coupons", "Couponkey", [
    "Code", "DiscountType", "Value", "MinOrderAmount", "UsageLimit", "UsageCount", "ExpiryOn", "IsActive",
], "CreatedOn DESC");
