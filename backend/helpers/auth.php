<?php
require_once __DIR__ . "/response.php";

const SESSION_LIFETIME_DAYS = 7;

function new_token(): string {
    return bin2hex(random_bytes(32)); // 64 hex chars, matches sessions.Token
}

function create_session(PDO $pdo, string $userKey, string $role): array {
    $token = new_token();
    $expires = (new DateTime())->modify("+" . SESSION_LIFETIME_DAYS . " days")->format("Y-m-d H:i:s");
    $pdo->prepare(
        "INSERT INTO sessions (Sessionkey, Token, UserKeyRef, Role, ExpiresOn) VALUES (?, ?, ?, ?, ?)"
    )->execute([new_key(), $token, $userKey, $role, $expires]);
    return ["token" => $token, "expiresOn" => $expires];
}

function bearer_token(): ?string {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/i', $header, $m)) {
        return $m[1];
    }
    return null;
}

// Returns the session row (with UserKeyRef, Role) for a valid, unexpired token, or null.
function current_session(PDO $pdo): ?array {
    $token = bearer_token();
    if (!$token) return null;

    $stmt = $pdo->prepare("SELECT * FROM sessions WHERE Token = ? AND ExpiresOn > NOW() LIMIT 1");
    $stmt->execute([$token]);
    $row = $stmt->fetch();
    return $row ?: null;
}

// Call at the top of any endpoint that only Admin/Staff should be able to use.
function require_admin(PDO $pdo): array {
    $session = current_session($pdo);
    if (!$session) {
        fail("Authentication required", 401);
    }
    if (!in_array($session['Role'], ['Admin', 'Staff'], true)) {
        fail("Admin access required", 403);
    }
    return $session;
}

// Call when an endpoint acts on data scoped to one user (e.g. ?userKey=...):
// allows the session's own user, or any Admin/Staff, and rejects everyone else.
function require_self_or_admin(PDO $pdo, string $userKey): array {
    $session = current_session($pdo);
    if (!$session) {
        fail("Authentication required", 401);
    }
    $isSelf = $session['UserKeyRef'] === $userKey;
    $isStaff = in_array($session['Role'], ['Admin', 'Staff'], true);
    if (!$isSelf && !$isStaff) {
        fail("Forbidden", 403);
    }
    return $session;
}
