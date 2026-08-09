# 🏎️ AutoVault — Car Marketplace Platform

A full-stack car listing platform built with **React (Vite) + Node.js/Express + MySQL**.

Publish cars with photos and full details, browse by category (Sports, Sedan, SUV, Luxury,
Hatchback, Coupe, Convertible, Electric, Truck, Classic), filter, search and manage categories.

---

## 🚀 Quick start (everything already set up)

| Service | URL / Details |
| --- | --- |
| **Web app** | http://localhost:5173 |
| **API server** | http://localhost:5001 |
| **API health** | http://localhost:5001/api/health |
| **MySQL** | **Official MySQL 26.7.0 Enterprise** · 127.0.0.1:3306 · user `root` · no password · database `car_platform` |

### The database runs on your installed MySQL

The platform uses **your official MySQL installation** (`/usr/local/mysql`, version
**26.7.0-commercial**, MySQL Enterprise Server). It is managed by a LaunchAgent that
auto-starts at login:

- Server binary: `/usr/local/mysql/bin/mysqld`
- Data directory: `~/mysql-data` (initialized with root / empty password)
- Service: `~/Library/LaunchAgents/com.autovault.mysql.plist`
- Manual control: `launchctl unload ~/Library/LaunchAgents/com.autovault.mysql.plist` to stop,
  `launchctl load ...` to start

### To start the app later

```bash
./start.sh        # starts MySQL (if needed) + API :5001 + web app :5173
```

Or manually:

```bash
# 1. API server
cd server && npm install && npm run dev      # -> http://localhost:5001

# 2. Web app (second terminal)
cd client && npm install && npm run dev      # -> http://localhost:5173
```

### To reset the database (optional)

```bash
/usr/local/mysql/bin/mysql -u root --host=127.0.0.1 < database/schema.sql
```

---

## 🔐 Google Sign-In

The platform includes Google OAuth login (button in the navbar, free to enable):

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a project.
2. **APIs & Services → OAuth consent screen** → External → fill in app name + emails.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application**.
4. Add the redirect URI: `http://localhost:5001/api/auth/google/callback`
5. Copy the **Client ID** and **Client Secret** into `server/.env`:
   ```
   GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxxx
   ```
6. While the app is in **Testing** status, add your Google account under **OAuth consent screen → Test users**.
7. Restart the API: `tmux kill-session -t car-api && (cd server && tmux new-session -d -s car-api 'node src/index.js')

Sessions are stored in a 7-day httpOnly cookie (`av_token`), users live in the `users` table,
and the flow is protected with a CSRF `state` token + verified-email check.

---

## 📱 Features

- **Publish a car** — multi-field form, up to **8 image uploads** (drag & drop, previews,
  first image becomes the cover), instant go-live.
- **Browse & discover** — responsive card grid, category chips, hero search.
- **Powerful filters** — category, price range, fuel type, transmission, condition,
  featured-only + sorting by price, year, newest, most viewed.
- **Car detail page** — photo gallery with thumbnails, full spec sheet, description,
  seller contact card, view counter.
- **Categories** — 10 seeded categories; add new ones with icons and descriptions;
  delete empty ones.
- **MySQL database** — clean relational schema (`categories`, `cars`, `car_images`)
  with foreign keys, indexes and 15 seeded cars.

---

## 🗄️ Database schema

```
categories  (id, name, slug, description, icon, created_at)
cars        (id, make, model, year, price, category_id FK, condition, mileage,
             fuel_type, transmission, color, engine_size, horsepower, seats,
             description, seller_name, seller_email, seller_phone, city,
             featured, status, views, created_at)
car_images  (id, car_id FK, image_url, is_primary, created_at)
```

Full DDL + seed data live in [`database/schema.sql`](database/schema.sql).

---

## 🧭 API endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | DB connectivity check |
| GET | `/api/categories` | All categories + car counts |
| POST | `/api/categories` | Create category `{name, icon, description}` |
| DELETE | `/api/categories/:id` | Delete category (only if empty) |
| GET | `/api/cars` | List with filters: `category, q, minPrice, maxPrice, fuel, transmission, condition, featured, sort` |
| GET | `/api/cars/:id` | Car detail + images (+ bumps views) |
| POST | `/api/cars` | Publish car (multipart fields + `images[]`) |
| DELETE | `/api/cars/:id` | Delete a listing |

---

## 🔌 Connecting with MySQL Workbench

1. Open **MySQL Workbench** → click **+** next to *MySQL Connections*.
2. Use these settings:
   - **Connection Name:** `Car Platform`
   - **Hostname:** `127.0.0.1`
   - **Port:** `3306`
   - **Username:** `root`
   - **Password:** *(leave empty)*
3. Click **Test Connection** → it should say *Connection succeeded*.
4. Open the **car_platform** schema to browse `categories`, `cars` and `car_images`.

---

## 🛠️ Tech stack

- **Frontend:** React 18, Vite 5, React Router 6, plain CSS design system (dark theme)
- **Backend:** Node.js, Express, mysql2 (pooled), Multer (image uploads)
- **Database:** MySQL 26.7.0 Enterprise (official install at `/usr/local/mysql`)
- **Image storage:** local `server/uploads/` folder served statically
