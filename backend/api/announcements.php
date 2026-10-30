<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/crud.php";
require_once __DIR__ . "/../helpers/auth.php";

if ($_SERVER['REQUEST_METHOD'] !== 'GET') require_admin($pdo);

handle_crud($pdo, "announcements", "Announcementkey", [
    "Message", "LinkUrl", "SortOrder", "IsActive", "StartOn", "EndOn",
], "SortOrder");
