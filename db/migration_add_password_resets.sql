-- Password reset links for the "Forgot password" flow. Only a SHA-256 of the token is stored.
CREATE TABLE IF NOT EXISTS passwordresets
(
    Resetkey    CHAR(32)     NOT NULL PRIMARY KEY,
    UserKeyRef  CHAR(32)     NOT NULL,
    TokenHash   CHAR(64)     NOT NULL UNIQUE,
    ExpiresOn   DATETIME     NOT NULL,
    CreatedOn   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_passwordresets_user ON passwordresets (UserKeyRef);
