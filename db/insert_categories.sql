-- Adds the Mehandi Stencils and Accessories categories.
-- Table name is lowercase `categories` (production MySQL). INSERT IGNORE skips any
-- row whose Slug already exists (Slug is UNIQUE), so it is safe to re-run.

INSERT IGNORE INTO categories (Categorykey, Slug, Name, ImagePath, CategoryGroup, IsActive) VALUES
-- Mehandi Stencils
(REPLACE(UUID(), '-', ''), 'kids',                 'Kids',                 NULL, 'stencils', 1),
(REPLACE(UUID(), '-', ''), 'arabic',               'Arabic',               NULL, 'stencils', 1),
(REPLACE(UUID(), '-', ''), 'semi-bridal',          'Semi Bridal',          NULL, 'stencils', 1),
(REPLACE(UUID(), '-', ''), 'premium-large',        'Premium Large',        NULL, 'stencils', 1),
(REPLACE(UUID(), '-', ''), 'lotus',                'Lotus',                NULL, 'stencils', 1),
(REPLACE(UUID(), '-', ''), 'medium-stencils',      'Medium Stencils',      NULL, 'stencils', 1),
(REPLACE(UUID(), '-', ''), 'god-stencils',         'God Stencils',         NULL, 'stencils', 1),
(REPLACE(UUID(), '-', ''), 'bridesmaid',           'Bridesmaid',           NULL, 'stencils', 1),
(REPLACE(UUID(), '-', ''), 'bridal',               'Bridal',               NULL, 'stencils', 1),
(REPLACE(UUID(), '-', ''), 'heavy-bridal',         'Heavy Bridal',         NULL, 'stencils', 1),
(REPLACE(UUID(), '-', ''), 'small-baby-shower',    'Small Baby Shower',    NULL, 'stencils', 1),
(REPLACE(UUID(), '-', ''), 'baby-shower',          'Baby Shower',          NULL, 'stencils', 1),
(REPLACE(UUID(), '-', ''), 'heavy-baby-shower',    'Heavy Baby Shower',    NULL, 'stencils', 1),
(REPLACE(UUID(), '-', ''), 'ear-piercing',         'Ear Piercing',         NULL, 'stencils', 1),
(REPLACE(UUID(), '-', ''), 'engagement-stencils',  'Engagement Stencils',  NULL, 'stencils', 1),
(REPLACE(UUID(), '-', ''), 'leg-stencils',         'Leg Stencils',         NULL, 'stencils', 1),
-- Accessories
(REPLACE(UUID(), '-', ''), 'hair-clips',           'Hair Clips',           NULL, 'accessories', 1),
(REPLACE(UUID(), '-', ''), 'earrings',             'Earrings',             NULL, 'accessories', 1),
(REPLACE(UUID(), '-', ''), 'kids-hair-accessories','Kids Hair Accessories',NULL, 'accessories', 1),
(REPLACE(UUID(), '-', ''), 'invisible-chain',      'Invisible Chain',      NULL, 'accessories', 1),
(REPLACE(UUID(), '-', ''), 'bracelet',             'Bracelet',             NULL, 'accessories', 1),
(REPLACE(UUID(), '-', ''), 'panda-collection',     'Panda Collection',     NULL, 'accessories', 1),
(REPLACE(UUID(), '-', ''), 'fridge-magnets',       'Fridge Magnets',       NULL, 'accessories', 1),
(REPLACE(UUID(), '-', ''), 'combos',               'Combos',               NULL, 'accessories', 1),
(REPLACE(UUID(), '-', ''), 'keychains',            'Keychains',            NULL, 'accessories', 1),
(REPLACE(UUID(), '-', ''), 'diy-painting-kit',     'DIY Painting Kit',     NULL, 'accessories', 1);
