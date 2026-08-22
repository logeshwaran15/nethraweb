<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/crud.php";

handle_crud($pdo, "Announcements", "Announcementkey", [
    "Message", "LinkUrl", "SortOrder", "IsActive", "StartOn", "EndOn",
], "SortOrder");
