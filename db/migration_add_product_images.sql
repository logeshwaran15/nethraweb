-- Up to 5 gallery images per product, stored as a JSON array of URLs.
-- Products.ImagePath stays as the first/primary image for existing code paths.
ALTER TABLE products ADD COLUMN ImagePaths TEXT NULL;
