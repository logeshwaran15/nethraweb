<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/crud.php";

$method = $_SERVER['REQUEST_METHOD'];
$columns = ["Sku", "Name", "Tagline", "Description", "CategoryKeyRef", "ProductGroup",
    "ImagePath", "Price", "Mrp", "Rating", "ReviewsCount", "Stock", "IsActive"];

// Sku is required + unique in the DB but the admin UI doesn't ask for it —
// auto-generate one from the product name on create, then insert directly.
if ($method === 'POST') {
    $body = json_input();
    $id = new_key();

    if (empty($body['Sku'])) {
        $slug = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $body['Name'] ?? 'product'), '-'));
        $body['Sku'] = $slug . '-' . substr($id, 0, 6);
    }

    $values = [$id];
    foreach ($columns as $c) {
        $values[] = $body[$c] ?? null;
    }
    $colList = implode(", ", array_map(fn($c) => "`$c`", array_merge(["Productkey"], $columns)));
    $placeholders = implode(", ", array_fill(0, count($columns) + 1, "?"));

    $stmt = $pdo->prepare("INSERT INTO Products ($colList) VALUES ($placeholders)");
    $stmt->execute($values);

    $fetch = $pdo->prepare("SELECT * FROM Products WHERE Productkey = ?");
    $fetch->execute([$id]);
    send($fetch->fetch(), 201);
}

handle_crud($pdo, "Products", "Productkey", $columns, "Name");
