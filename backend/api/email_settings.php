<?php
require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../helpers/response.php";
require_once __DIR__ . "/../helpers/auth.php";
require_once __DIR__ . "/../helpers/mail.php";

// Single-row SMTP settings used by the password-reset email. Admin only.
// The SMTP password is write-only: it is never sent back to the browser.
require_admin($pdo);
$method = $_SERVER['REQUEST_METHOD'];

function email_row(PDO $pdo): array {
    $row = $pdo->query("SELECT * FROM emailsettings LIMIT 1")->fetch();
    if (!$row) {
        $pdo->prepare("INSERT INTO emailsettings (EmailSettingkey) VALUES (?)")->execute([new_key()]);
        $row = $pdo->query("SELECT * FROM emailsettings LIMIT 1")->fetch();
    }
    return $row;
}

function public_view(array $row): array {
    return [
        "SmtpHost" => $row["SmtpHost"],
        "SmtpPort" => $row["SmtpPort"],
        "SmtpUser" => $row["SmtpUser"],
        "FromEmail" => $row["FromEmail"],
        "FromName" => $row["FromName"],
        "HasPassword" => !empty($row["SmtpPass"]),
    ];
}

if ($method === 'GET') {
    send(public_view(email_row($pdo)));
}

if ($method === 'PUT') {
    $body = json_input();
    $row = email_row($pdo);
    $port = (int)($body["SmtpPort"] ?? 465);
    if ($port < 1 || $port > 65535) {
        fail("Enter a valid SMTP port");
    }
    // An empty password field means "keep the saved one".
    $newPass = trim($body["SmtpPass"] ?? "");
    $pass = $newPass !== "" ? $newPass : $row["SmtpPass"];

    $pdo->prepare(
        "UPDATE emailsettings SET SmtpHost = ?, SmtpPort = ?, SmtpUser = ?, SmtpPass = ?,
         FromEmail = ?, FromName = ?, ModifiedOn = NOW() WHERE EmailSettingkey = ?"
    )->execute([
        trim($body["SmtpHost"] ?? ""),
        $port,
        trim($body["SmtpUser"] ?? ""),
        $pass,
        trim($body["FromEmail"] ?? ""),
        trim($body["FromName"] ?? "") ?: "Nethra's",
        $row["EmailSettingkey"],
    ]);
    send(public_view(email_row($pdo)));
}

// POST sends a test email using the saved settings.
if ($method === 'POST') {
    $body = json_input();
    $to = trim($body["to"] ?? "");
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        fail("Enter a valid email address to send the test to");
    }
    [$ok, $reason] = send_mail($to, "Nethra's test email", "This is a test email from your Nethra's admin settings.\r\nIf you can read this, password reset emails will work.", $pdo);
    $ok ? send(["message" => "Test email sent to {$to}"]) : fail($reason, 502);
}

fail("Method not allowed", 405);
