-- Run once: adds the admin toggle for the "Order on WhatsApp" checkout option.
ALTER TABLE paymentsettings
    ADD COLUMN WhatsappOrderEnabled TINYINT(1) NOT NULL DEFAULT 0 AFTER CodEnabled;
