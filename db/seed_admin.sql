-- Run this once against nethras_db to create the first admin login.
-- Password is stored as plain text (per the schema design) — change it after first login.

USE nethras_db;

INSERT INTO Users (Userkey, FullName, Email, Password, PhoneNumber, Role, IsActive)
VALUES (REPLACE(UUID(), '-', ''), 'Nethra Admin', 'admin@nethras.com', 'Admin@123', '9999999999', 'Admin', 1);
