-- Singleton "About Us" page content, editable by the admin, shown on the public About page.
CREATE TABLE IF NOT EXISTS AboutSettings
(
    AboutSettingkey CHAR(32)      NOT NULL PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),

    Heading         VARCHAR(200)  NULL,
    Subheading      VARCHAR(300)  NULL,
    Body            TEXT          NULL,
    -- paragraphs separated by blank lines

    ImagePath       VARCHAR(500)  NULL,

    Stat1Label      VARCHAR(80)   NULL,
    Stat1Value      VARCHAR(40)   NULL,
    Stat2Label      VARCHAR(80)   NULL,
    Stat2Value      VARCHAR(40)   NULL,
    Stat3Label      VARCHAR(80)   NULL,
    Stat3Value      VARCHAR(40)   NULL,

    ModifiedOn      DATETIME      NULL,
    ModifiedBy      VARCHAR(150)  NULL
);
