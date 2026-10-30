-- Updates existing catalog text: "Mehndi" spelling becomes "Mehandi" and "Reusable" wording is removed.
-- REPLACE is case-sensitive, so each casing is listed. Safe to run more than once.

UPDATE products SET
  Name        = REPLACE(REPLACE(Name, 'Mehndi', 'Mehandi'), 'mehndi', 'mehandi'),
  Tagline     = REPLACE(REPLACE(Tagline, 'Mehndi', 'Mehandi'), 'mehndi', 'mehandi'),
  Description = REPLACE(REPLACE(Description, 'Mehndi', 'Mehandi'), 'mehndi', 'mehandi');

UPDATE products SET Description = REPLACE(Description, '\nReusable with proper care', '');
UPDATE products SET Description = REPLACE(Description, '\nReusable design', '');
UPDATE products SET Description = REPLACE(Description, 'Reusable premium sheet', 'Premium sheet');
UPDATE products SET Description = REPLACE(Description, 'Reusable and long lasting', 'Long lasting');

-- Anything listed here was entered by hand and needs editing in the admin panel.
SELECT Sku, Name, Tagline, Description FROM products
WHERE LOWER(CONCAT_WS(' ', Name, Tagline, Description)) LIKE '%reusable%';

-- Text Google indexes from the admin-managed tables.
UPDATE seosettings SET
  SiteTitle       = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(SiteTitle, ', reusable', ''), 'reusable ', ''), 'Reusable ', ''), 'Mehndi', 'Mehandi'), 'mehndi', 'mehandi'),
  MetaDescription = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(MetaDescription, ', reusable', ''), 'reusable ', ''), 'Reusable ', ''), 'Mehndi', 'Mehandi'), 'mehndi', 'mehandi'),
  MetaKeywords    = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(MetaKeywords, ', reusable', ''), 'reusable ', ''), 'Reusable ', ''), 'Mehndi', 'Mehandi'), 'mehndi', 'mehandi');

UPDATE aboutsettings SET
  Heading    = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Heading, ', reusable', ''), 'reusable ', ''), 'Reusable ', ''), 'Mehndi', 'Mehandi'), 'mehndi', 'mehandi'),
  Subheading = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Subheading, ', reusable', ''), 'reusable ', ''), 'Reusable ', ''), 'Mehndi', 'Mehandi'), 'mehndi', 'mehandi'),
  Body       = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Body, ', reusable', ''), 'reusable ', ''), 'Reusable ', ''), 'Mehndi', 'Mehandi'), 'mehndi', 'mehandi');

UPDATE banners SET
  Title    = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Title, ', reusable', ''), 'reusable ', ''), 'Reusable ', ''), 'Mehndi', 'Mehandi'), 'mehndi', 'mehandi'),
  Subtitle = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Subtitle, ', reusable', ''), 'reusable ', ''), 'Reusable ', ''), 'Mehndi', 'Mehandi'), 'mehndi', 'mehandi');

UPDATE announcements SET
  Message = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Message, ', reusable', ''), 'reusable ', ''), 'Reusable ', ''), 'Mehndi', 'Mehandi'), 'mehndi', 'mehandi');

UPDATE categories SET Name = REPLACE(REPLACE(Name, 'Mehndi', 'Mehandi'), 'mehndi', 'mehandi');
