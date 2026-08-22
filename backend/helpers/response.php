<?php

function json_input() {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function send($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function fail($message, $code = 400) {
    send(["error" => $message], $code);
}

function new_key() {
    // 32-char id, same shape as REPLACE(UUID(), '-', '') used as the DB default.
    return bin2hex(random_bytes(16));
}
