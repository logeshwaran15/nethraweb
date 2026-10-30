-- SMTP settings for outgoing email (password reset), editable from Admin > Settings > Email.
CREATE TABLE IF NOT EXISTS emailsettings
(
    EmailSettingkey CHAR(32)      NOT NULL PRIMARY KEY,
    SmtpHost        VARCHAR(200)  NULL,
    SmtpPort        INT           NOT NULL DEFAULT 465,
    SmtpUser        VARCHAR(200)  NULL,
    SmtpPass        VARCHAR(300)  NULL,
    FromEmail       VARCHAR(200)  NULL,
    FromName        VARCHAR(150)  NULL,
    ModifiedOn      DATETIME      NULL
);
