-- Server-side login sessions, so the backend can verify who's calling it
-- instead of trusting whatever the browser claims. Run once against the live DB.

CREATE TABLE IF NOT EXISTS sessions
(
    Sessionkey  CHAR(32)      NOT NULL PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),
    Token       CHAR(64)      NOT NULL UNIQUE,
    UserKeyRef  CHAR(32)      NOT NULL, -- join to users.Userkey in PHP
    Role        VARCHAR(50)   NOT NULL, -- snapshot at login time, so a role change doesn't need re-login to take effect for the *old* check, but does for new tokens

    ExpiresOn   DATETIME      NOT NULL,
    CreatedOn   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_token ON sessions (Token);
