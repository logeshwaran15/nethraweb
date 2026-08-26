-- Run once in phpMyAdmin (SQL tab) against nethras_db to fix image paths that were
-- saved while developing locally (http://localhost:8081/nethras-backend/...).
USE nethras_db;

UPDATE products
SET ImagePath = REPLACE(ImagePath, 'http://localhost:8081/nethras-backend', 'https://nethras.in/backend')
WHERE ImagePath LIKE 'http://localhost:8081/nethras-backend%';

UPDATE categories
SET ImagePath = REPLACE(ImagePath, 'http://localhost:8081/nethras-backend', 'https://nethras.in/backend')
WHERE ImagePath LIKE 'http://localhost:8081/nethras-backend%';

UPDATE banners
SET ImagePath = REPLACE(ImagePath, 'http://localhost:8081/nethras-backend', 'https://nethras.in/backend')
WHERE ImagePath LIKE 'http://localhost:8081/nethras-backend%';
