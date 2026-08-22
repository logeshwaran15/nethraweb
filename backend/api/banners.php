<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/crud.php";

handle_crud($pdo, "Banners", "Bannerkey", [
    "Title", "Subtitle", "ImagePath", "LinkUrl", "ButtonText",
    "Placement", "SortOrder", "IsActive", "StartOn", "EndOn",
], "SortOrder");
