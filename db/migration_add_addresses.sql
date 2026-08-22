-- Run once against an existing nethras_db to add the saved-addresses feature.
USE nethras_db;

CREATE TABLE Addresses
(
    Addresskey      CHAR(32)      NOT NULL PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),

    UserKeyRef      CHAR(32)      NOT NULL, -- join to Users.Userkey in PHP

    Label           VARCHAR(50)   NOT NULL DEFAULT 'Home',
    -- Home / Work / Other

    FullName        VARCHAR(150)  NOT NULL,
    Phone           VARCHAR(20)   NOT NULL,
    AddressLine     VARCHAR(500)  NOT NULL,
    Landmark        VARCHAR(200)  NULL,
    City            VARCHAR(100)  NOT NULL,
    State           VARCHAR(100)  NOT NULL,
    Pincode         VARCHAR(10)   NOT NULL,

    IsDefault       TINYINT(1)    NOT NULL DEFAULT 0,

    CreatedOn       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedOn      DATETIME      NULL
);
