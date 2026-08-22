# Nethra's PHP Backend (XAMPP / MySQL)

Plain PHP + PDO REST API matching `db/schema.sql`. No framework, no FK constraints — matches the schema design.

## Setup

1. Run `db/schema.sql` then `db/seed_admin.sql` against MySQL (creates `nethras_db` and one admin login:
   `admin@nethras.com` / `Admin@123`).
2. Copy this whole `backend` folder into your XAMPP `htdocs`, e.g.
   `C:\xampp\htdocs\nethras-backend` (so it's reachable at `http://localhost/nethras-backend`).
3. Start Apache + MySQL in the XAMPP control panel.
4. In the React app, copy `.env.example` to `.env` and set:
   ```
   VITE_API_BASE_URL=http://localhost/nethras-backend
   ```
5. Restart the Vite dev server so it picks up the env var.

## Endpoints

- `POST /auth/login.php` — `{ email, password }` → `{ user, redirectTo }`. `redirectTo` is `/admin` when `Role === "Admin"`, else `/`.
- `POST /auth/register.php` — `{ fullName, email, phone, password }` → creates a `Customer` role user.
- `GET/POST/PUT/DELETE /api/products.php` — `?key=` for single/update/delete.
- `GET/POST/PUT/DELETE /api/categories.php`
- `GET/POST/PUT/DELETE /api/orders.php`
- `GET/POST/PUT/DELETE /api/order_items.php` — `?orderKey=` to list one order's items.
- `GET/POST/PUT/DELETE /api/order_log.php` — `?orderKey=` to list one order's status history.
- `GET/POST/PUT/DELETE /api/coupons.php`
- `GET/POST/PUT/DELETE /api/wishlist.php` — `?userKey=` to list one user's wishlist.
- `GET/POST/PUT/DELETE /api/cart.php` — `?userKey=` to list one user's cart.
- `GET/PUT /api/seo_settings.php`, `payment_settings.php`, `contact_settings.php` — single-row settings tables.
- `GET/POST/PUT/DELETE /api/banners.php`
- `GET/POST/PUT/DELETE /api/announcements.php`
- `GET/PUT /api/users.php` — `?role=Customer` to filter, used by the admin Customers page (password is never returned).

## Notes

- Passwords are stored as plain text, per the schema (`Users.Password`, "no hash").
- `PUT` requests only overwrite the columns you send (`COALESCE` against the existing row), so partial updates are safe.
- `Products.Sku` and each table's key column are auto-generated server-side — the frontend never has to invent them.
