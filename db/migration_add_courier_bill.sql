-- Run once: stores the courier bill (image or PDF) the admin uploads for an order.
-- The value is a path relative to the backend root, e.g. /uploads/courier-bills/ab12cd.pdf
ALTER TABLE orders
    ADD COLUMN CourierBillPath VARCHAR(500) NULL AFTER TrackingId;
