<?php
// Stateless CAPTCHA: the server signs (expiry + hash of the answer) into a token, so
// no DB/session storage is needed. The answer itself is only ever sent as an SVG image.

function captcha_secret(): string {
    global $DB_PASS, $DB_NAME, $DB_USER;
    return hash('sha256', ($DB_PASS ?? '') . '|' . ($DB_NAME ?? '') . '|' . ($DB_USER ?? '') . '|nethras-captcha');
}

function captcha_sign(string $payload): string {
    return hash_hmac('sha256', $payload, captcha_secret());
}

function captcha_make(): array {
    // No 0/O/1/I/L to avoid look-alike characters.
    $chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    $answer = '';
    for ($i = 0; $i < 5; $i++) {
        $answer .= $chars[random_int(0, strlen($chars) - 1)];
    }

    $expires = time() + 300;
    $payload = $expires . '.' . hash('sha256', strtoupper($answer) . captcha_secret());
    $token = $payload . '.' . captcha_sign($payload);

    $w = 150; $h = 50;
    $svg = "<svg xmlns='http://www.w3.org/2000/svg' width='$w' height='$h' viewBox='0 0 $w $h'>";
    $svg .= "<rect width='$w' height='$h' fill='#FDF0F0'/>";
    for ($i = 0; $i < 6; $i++) {
        $svg .= sprintf(
            "<line x1='%d' y1='%d' x2='%d' y2='%d' stroke='#B5314A' stroke-opacity='0.45' stroke-width='1.2'/>",
            random_int(0, $w), random_int(0, $h), random_int(0, $w), random_int(0, $h)
        );
    }
    for ($i = 0; $i < 5; $i++) {
        $x = 14 + $i * 27 + random_int(-2, 2);
        $y = 33 + random_int(-5, 5);
        $rot = random_int(-22, 22);
        $svg .= "<text x='$x' y='$y' font-family='Georgia,serif' font-size='28' font-weight='bold' fill='#8E1828' transform='rotate($rot $x $y)'>{$answer[$i]}</text>";
    }
    for ($i = 0; $i < 25; $i++) {
        $svg .= sprintf("<circle cx='%d' cy='%d' r='1' fill='#8E1828' fill-opacity='0.5'/>", random_int(0, $w), random_int(0, $h));
    }
    $svg .= '</svg>';

    return ['token' => $token, 'image' => 'data:image/svg+xml;base64,' . base64_encode($svg)];
}

function captcha_verify(string $token, string $answer): bool {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    [$expires, $answerHash, $sig] = $parts;
    if (!hash_equals(captcha_sign($expires . '.' . $answerHash), $sig)) return false;
    if ((int)$expires < time()) return false;
    return hash_equals($answerHash, hash('sha256', strtoupper(trim($answer)) . captcha_secret()));
}

function require_captcha(array $body): void {
    if (!captcha_verify((string)($body['captchaToken'] ?? ''), (string)($body['captchaAnswer'] ?? ''))) {
        fail("Incorrect or expired captcha. Please try again.", 400);
    }
}
