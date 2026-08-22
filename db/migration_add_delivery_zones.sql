-- Run once against an existing nethras_db to add the delivery charge module.
USE nethras_db;

CREATE TABLE DeliveryZones
(
    Zonekey            CHAR(32)      NOT NULL PRIMARY KEY DEFAULT (REPLACE(UUID(), '-', '')),

    ZoneName           VARCHAR(150)  NOT NULL,
    PincodePrefix      VARCHAR(10)   NOT NULL,
    -- e.g. "600", "641002" — matched against the customer's pincode by longest-prefix match

    DeliveryFee        DECIMAL(10,2) NOT NULL DEFAULT 0,
    FreeShippingAbove  DECIMAL(10,2) NOT NULL DEFAULT 0,
    EstimatedDays       VARCHAR(50)  NOT NULL DEFAULT '3-5 days',

    SortOrder          INT           NOT NULL DEFAULT 0,
    IsActive           TINYINT(1)    NOT NULL DEFAULT 1,

    CreatedOn          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ModifiedOn         DATETIME      NULL,
    CreatedBy          VARCHAR(150)  NULL,
    ModifiedBy         VARCHAR(150)  NULL
);
