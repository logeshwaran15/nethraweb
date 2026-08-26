<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/crud.php";

handle_crud($pdo, "coupons", "Couponkey", [
    "Code", "DiscountType", "Value", "MinOrderAmount", "UsageLimit", "UsageCount", "ExpiryOn", "IsActive",
], "CreatedOn DESC");
