<?php
// Minimal SMTP sender (no Composer needed). Settings come from Admin > Settings > Email (the
// emailsettings table) first, then from backend/config/mail.local.php (gitignored) as a fallback.
//
// Returns [true, ""] on success or [false, "reason"] on failure.
function send_mail(string $to, string $subject, string $body, ?PDO $pdo = null): array {
    $MAIL_HOST = "";
    $MAIL_PORT = 465;       // 465 = SSL, 587 = STARTTLS
    $MAIL_USER = "";
    $MAIL_PASS = "";
    $MAIL_FROM = "";
    $MAIL_FROM_NAME = "Nethra's";

    $cfg = __DIR__ . "/../config/mail.local.php";
    if (file_exists($cfg)) {
        require $cfg;
    }
    if ($pdo) {
        try {
            $row = $pdo->query("SELECT * FROM emailsettings LIMIT 1")->fetch();
            if ($row && $row["SmtpHost"] && $row["SmtpUser"] && $row["SmtpPass"]) {
                $MAIL_HOST = $row["SmtpHost"];
                $MAIL_PORT = (int)$row["SmtpPort"];
                $MAIL_USER = $row["SmtpUser"];
                $MAIL_PASS = $row["SmtpPass"];
                $MAIL_FROM = $row["FromEmail"] ?: "";
                $MAIL_FROM_NAME = $row["FromName"] ?: "Nethra's";
            }
        } catch (Throwable $e) {
            // table missing: fall back to the config file
        }
    }
    if ($MAIL_HOST === "" || $MAIL_USER === "" || $MAIL_PASS === "") {
        return [false, "SMTP is not configured (Admin > Settings > Email)"];
    }
    $from = $MAIL_FROM !== "" ? $MAIL_FROM : $MAIL_USER;

    $errno = 0;
    $errstr = "";
    $remote = ($MAIL_PORT === 465 ? "ssl://" : "tcp://") . $MAIL_HOST . ":" . $MAIL_PORT;
    $fp = @stream_socket_client($remote, $errno, $errstr, 15);
    if (!$fp) {
        return [false, "Could not connect to {$MAIL_HOST}:{$MAIL_PORT} ({$errstr})"];
    }
    stream_set_timeout($fp, 15);

    $read = function () use ($fp): string {
        $data = "";
        while (($line = fgets($fp, 515)) !== false) {
            $data .= $line;
            if (strlen($line) < 4 || $line[3] === " ") break;
        }
        return $data;
    };
    $cmd = function (string $c, string $expect) use ($fp, $read): ?string {
        fwrite($fp, $c . "\r\n");
        $resp = $read();
        return str_starts_with($resp, $expect) ? null : trim($resp);
    };

    $greeting = $read();
    if (!str_starts_with($greeting, "220")) {
        fclose($fp);
        return [false, "Bad SMTP greeting: " . trim($greeting)];
    }

    $steps = [];
    $host = $_SERVER['SERVER_NAME'] ?? "localhost";
    if ($err = $cmd("EHLO {$host}", "250")) { fclose($fp); return [false, "EHLO failed: {$err}"]; }

    if ($MAIL_PORT !== 465) {
        if ($err = $cmd("STARTTLS", "220")) { fclose($fp); return [false, "STARTTLS failed: {$err}"]; }
        if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            fclose($fp);
            return [false, "TLS handshake failed"];
        }
        if ($err = $cmd("EHLO {$host}", "250")) { fclose($fp); return [false, "EHLO failed: {$err}"]; }
    }

    if ($err = $cmd("AUTH LOGIN", "334")) { fclose($fp); return [false, "AUTH failed: {$err}"]; }
    if ($err = $cmd(base64_encode($MAIL_USER), "334")) { fclose($fp); return [false, "Username rejected: {$err}"]; }
    if ($err = $cmd(base64_encode($MAIL_PASS), "235")) { fclose($fp); return [false, "Login rejected (check the app password): {$err}"]; }
    if ($err = $cmd("MAIL FROM:<{$from}>", "250")) { fclose($fp); return [false, "MAIL FROM failed: {$err}"]; }
    if ($err = $cmd("RCPT TO:<{$to}>", "250")) { fclose($fp); return [false, "RCPT TO failed: {$err}"]; }
    if ($err = $cmd("DATA", "354")) { fclose($fp); return [false, "DATA failed: {$err}"]; }

    $headers = "From: =?UTF-8?B?" . base64_encode($MAIL_FROM_NAME) . "?= <{$from}>\r\n"
        . "To: <{$to}>\r\n"
        . "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n"
        . "Date: " . date("r") . "\r\n"
        . "MIME-Version: 1.0\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n"
        . "Content-Transfer-Encoding: base64\r\n";
    $payload = $headers . "\r\n" . chunk_split(base64_encode($body)) . "\r\n.";
    if ($err = $cmd($payload, "250")) { fclose($fp); return [false, "Message rejected: {$err}"]; }

    $cmd("QUIT", "221");
    fclose($fp);
    return [true, ""];
}
