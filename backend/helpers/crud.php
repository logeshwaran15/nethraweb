<?php
require_once __DIR__ . "/response.php";

/**
 * Generic REST handler for a single table.
 *
 * @param PDO    $pdo
 * @param string $table       Table name, e.g. "products"
 * @param string $keyColumn   Primary key column, e.g. "Productkey"
 * @param array  $columns     Insertable/updatable columns (excludes the key + audit columns)
 * @param string $orderBy     Default ORDER BY clause
 */
function handle_crud(PDO $pdo, string $table, string $keyColumn, array $columns, ?string $orderBy = null) {
    $method = $_SERVER['REQUEST_METHOD'];
    $key = $_GET['key'] ?? null;

    if ($method === 'GET') {
        if ($key) {
            $stmt = $pdo->prepare("SELECT * FROM `$table` WHERE `$keyColumn` = ? LIMIT 1");
            $stmt->execute([$key]);
            $row = $stmt->fetch();
            $row ? send($row) : fail("Not found", 404);
        }
        $order = $orderBy ? " ORDER BY $orderBy" : "";
        $stmt = $pdo->query("SELECT * FROM `$table`" . $order);
        send($stmt->fetchAll());
    }

    if ($method === 'POST') {
        $body = json_input();
        $id = new_key();

        $cols = array_merge([$keyColumn], $columns);
        $placeholders = implode(", ", array_fill(0, count($cols), "?"));
        $colList = implode(", ", array_map(fn($c) => "`$c`", $cols));

        $values = [$id];
        foreach ($columns as $c) {
            $values[] = $body[$c] ?? null;
        }

        $stmt = $pdo->prepare("INSERT INTO `$table` ($colList) VALUES ($placeholders)");
        $stmt->execute($values);

        $fetch = $pdo->prepare("SELECT * FROM `$table` WHERE `$keyColumn` = ?");
        $fetch->execute([$id]);
        send($fetch->fetch(), 201);
    }

    if ($method === 'PUT') {
        if (!$key) fail("Missing ?key=");
        $body = json_input();

        // COALESCE keeps the existing value for any column the caller didn't send,
        // so thin frontend mappers can PUT a partial object without nulling columns out.
        $set = implode(", ", array_map(fn($c) => "`$c` = COALESCE(?, `$c`)", $columns));
        $values = [];
        foreach ($columns as $c) {
            $values[] = array_key_exists($c, $body) ? $body[$c] : null;
        }
        $values[] = $key;

        $hasModifiedOnCol = in_array('ModifiedOn', array_map(fn($r) => $r['Field'], $pdo->query("SHOW COLUMNS FROM `$table`")->fetchAll()));
        $modifiedClause = $hasModifiedOnCol ? ", `ModifiedOn` = NOW()" : "";

        $stmt = $pdo->prepare("UPDATE `$table` SET $set$modifiedClause WHERE `$keyColumn` = ?");
        $stmt->execute($values);

        $fetch = $pdo->prepare("SELECT * FROM `$table` WHERE `$keyColumn` = ?");
        $fetch->execute([$key]);
        $row = $fetch->fetch();
        $row ? send($row) : fail("Not found", 404);
    }

    if ($method === 'DELETE') {
        if (!$key) fail("Missing ?key=");
        $stmt = $pdo->prepare("DELETE FROM `$table` WHERE `$keyColumn` = ?");
        $stmt->execute([$key]);
        send(["deleted" => $key]);
    }

    fail("Method not allowed", 405);
}
