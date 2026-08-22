-- Run once against an existing nethras_db to add courier/tracking fields to Orders.
USE nethras_db;

ALTER TABLE Orders
    ADD COLUMN CourierName VARCHAR(150) NULL AFTER PaymentMethod,
    ADD COLUMN TrackingId  VARCHAR(150) NULL AFTER CourierName;
