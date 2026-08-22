-- Seeds Categories + Products with the same data the frontend used to hardcode in mock-data.ts.
-- ImagePath values point at /uploads/products/... served from the React app's public/ folder.
-- Run once against nethras_db after schema.sql (and seed_admin.sql if you haven't already).

USE nethras_db;

-- ============================================================
-- Categories
-- ============================================================
INSERT INTO Categories (Categorykey, Slug, Name, ImagePath, CategoryGroup, IsActive) VALUES
(REPLACE(UUID(), '-', ''), 'hand-stencils',      'Hand Stencils',      '/uploads/products/hand-stencils-category.jpg',      'stencils',    1),
(REPLACE(UUID(), '-', ''), 'finger-stencils',    'Finger Stencils',    '/uploads/products/finger-stencils-category.jpg',    'stencils',    1),
(REPLACE(UUID(), '-', ''), 'bridal-stencils',    'Bridal Stencils',    '/uploads/products/bridal-stencils-category.jpg',    'stencils',    1),
(REPLACE(UUID(), '-', ''), 'arabic-stencils',    'Arabic Stencils',    '/uploads/products/arabic-stencils-category.jpg',    'stencils',    1),
(REPLACE(UUID(), '-', ''), 'hair-clips',         'Hair Clips',         '/uploads/products/hair-clips-category.jpg',         'accessories', 1),
(REPLACE(UUID(), '-', ''), 'invisible-chains',   'Invisible Chains',   '/uploads/products/invisible-chains-category.jpg',   'accessories', 1);

-- ============================================================
-- Products
-- CategoryKeyRef is stored as the Categories.Slug value (not Categorykey) — the whole
-- app (routes, cart, wishlist) already references categories by slug throughout, so the
-- admin/storefront code keeps that convention instead of a strict FK-style key.
-- ============================================================
INSERT INTO Products
    (Productkey, Sku, Name, Tagline, Description, CategoryKeyRef, ProductGroup, ImagePath, Price, Mrp, Rating, ReviewsCount, Stock, IsActive)
VALUES
(REPLACE(UUID(), '-', ''), 'floral-finger-stencil', 'Floral Finger Stencil',
 'Beautiful floral finger stencil for easy and perfect mehndi in minutes.',
 'High quality non-toxic material\nSuitable for all skin types\nGives clean and sharp mehndi lines\nReusable with proper care',
 'finger-stencils', 'stencils', '/uploads/products/floral-finger-stencil.jpg', 49, 79, 4.8, 124, 24, 1),

(REPLACE(UUID(), '-', ''), 'peacock-design-stencil', 'Peacock Design Stencil',
 'Classic peacock motif that works beautifully for festivals and functions.',
 'Flexible and easy to place\nDetailed peacock cut-out\nReusable premium sheet\nPerfect finish every time',
 'arabic-stencils', 'stencils', '/uploads/products/peacock-design-stencil.jpg', 59, 99, 4.7, 96, 8, 1),

(REPLACE(UUID(), '-', ''), 'mandala-hand-stencil', 'Mandala Hand Stencil',
 'Full-hand mandala design for a rich, traditional mehndi look.',
 'Covers the full back of the hand\nSoft flexible material\nEasy to apply and remove\nBridal-quality detailing',
 'hand-stencils', 'stencils', '/uploads/products/mandala-hand-stencil.jpg', 69, 119, 4.9, 212, 42, 1),

(REPLACE(UUID(), '-', ''), 'bridal-design-stencil', 'Bridal Design Stencil',
 'Intricate bridal set designed for weddings and engagement functions.',
 'Intricate bridal motifs\nSet of matching patterns\nPremium quality material\nReusable and long lasting',
 'bridal-stencils', 'stencils', '/uploads/products/bridal-design-stencil.jpg', 79, 129, 4.9, 178, 0, 1),

(REPLACE(UUID(), '-', ''), 'arabic-stencil', 'Arabic Stencil',
 'Flowing Arabic patterns for a modern, elegant mehndi style.',
 'Bold flowing patterns\nQuick to apply\nNeat, professional finish\nReusable design',
 'arabic-stencils', 'stencils', '/uploads/products/arabic-stencil.jpg', 89, 149, 4.6, 88, 15, 1),

(REPLACE(UUID(), '-', ''), 'pearl-hair-clip', 'Pearl Hair Clip',
 'Gold-tone pearl clip that finishes any festive or everyday look.',
 'Gold-tone anti-tarnish finish\nStrong secure grip\nLightweight and comfortable\nPerfect gifting option',
 'hair-clips', 'accessories', '/uploads/products/pearl-hair-clip.jpg', 129, 199, 4.8, 143, 31, 1),

(REPLACE(UUID(), '-', ''), 'flower-hair-clip', 'Flower Hair Clip',
 'Handcrafted fabric flower clip with a gold detailed centre.',
 'Handcrafted petals\nGold detailed centre\nHolds thick hair easily\nTraditional and modern looks',
 'hair-clips', 'accessories', '/uploads/products/flower-hair-clip.jpg', 149, 229, 4.7, 74, 6, 1),

(REPLACE(UUID(), '-', ''), 'invisible-chain', 'Invisible Chain',
 'Delicate everyday chain with a barely-there premium finish.',
 'Skin friendly material\nAdjustable length\nDoes not fade easily\nLayers beautifully',
 'invisible-chains', 'accessories', '/uploads/products/invisible-chain.jpg', 199, 299, 4.5, 61, 19, 1);
