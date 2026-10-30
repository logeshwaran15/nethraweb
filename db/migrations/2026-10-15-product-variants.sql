-- Product variants (per-option price + stock, e.g. claw clip colours 1-11).
-- Run once on the live database (phpMyAdmin > SQL). Table names are lowercase in production.
ALTER TABLE products  ADD COLUMN Variants     TEXT         NULL AFTER Stock;
ALTER TABLE cartitems ADD COLUMN VariantLabel VARCHAR(100) NULL AFTER ProductKeyRef;

-- Category display order (admin sets 1, 2, 3… to choose the order shown on the home page).
ALTER TABLE categories ADD COLUMN SortOrder INT NOT NULL DEFAULT 0 AFTER CategoryGroup;
