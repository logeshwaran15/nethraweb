-- Run once against an existing nethras_db to add Razorpay payment tracking fields to Orders.
USE nethras_db;

ALTER TABLE orders
    ADD COLUMN RazorpayOrderId   VARCHAR(100) NULL AFTER PaymentMethod,
    ADD COLUMN RazorpayPaymentId VARCHAR(100) NULL AFTER RazorpayOrderId,
    ADD COLUMN PaymentStatus     VARCHAR(30)  NOT NULL DEFAULT 'Pending' AFTER RazorpayPaymentId;
