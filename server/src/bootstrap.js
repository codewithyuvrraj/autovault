const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

// Seed catalog lives in the repo so a fresh hosted database gets the same
// 10 categories, 15 cars and 15 (Unsplash) images the local app has.
const SEED_PATH = path.join(__dirname, '..', '..', 'database', 'seed-data.json');

// Mirrors database/schema.sql (CREATE TABLE IF NOT EXISTS — never drops anything)
const DDL = [
  `CREATE TABLE IF NOT EXISTS categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    slug VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(255) DEFAULT NULL,
    icon VARCHAR(16) NOT NULL DEFAULT '🚗',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS cars (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    make VARCHAR(80) NOT NULL,
    model VARCHAR(80) NOT NULL,
    year SMALLINT UNSIGNED NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    \`condition\` ENUM('New','Used','Certified Pre-Owned') NOT NULL DEFAULT 'Used',
    mileage INT UNSIGNED DEFAULT 0,
    fuel_type VARCHAR(40) DEFAULT NULL,
    transmission VARCHAR(40) DEFAULT NULL,
    color VARCHAR(40) DEFAULT NULL,
    engine_size VARCHAR(40) DEFAULT NULL,
    horsepower INT UNSIGNED DEFAULT NULL,
    seats TINYINT UNSIGNED DEFAULT NULL,
    description TEXT,
    seller_name VARCHAR(120) NOT NULL,
    seller_email VARCHAR(160) DEFAULT NULL,
    seller_phone VARCHAR(40) DEFAULT NULL,
    city VARCHAR(120) DEFAULT NULL,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    status ENUM('active','sold','hidden') NOT NULL DEFAULT 'active',
    views INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cars_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_cars_category (category_id),
    INDEX idx_cars_year (year),
    INDEX idx_cars_price (price)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    google_id VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(190) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    picture VARCHAR(500) DEFAULT NULL,
    last_login TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS car_images (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    car_id INT UNSIGNED NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_images_car FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`,
];

async function ensureSchema() {
  for (const sql of DDL) await pool.query(sql);
}

// Seed only empty tables so this is safe to run on every boot.
async function seedIfEmpty() {
  const [cats] = await pool.query('SELECT COUNT(*) AS n FROM categories');
  const [cars] = await pool.query('SELECT COUNT(*) AS n FROM cars');
  const hasCategories = Number(cats[0].n) > 0;
  const hasCars = Number(cars[0].n) > 0;
  if (hasCategories && hasCars) return { seeded: false };

  const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (!hasCategories) {
      for (const c of seed.categories) {
        await conn.query(
          'INSERT INTO categories (id, name, slug, description, icon) VALUES (?, ?, ?, ?, ?)',
          [c.id, c.name, c.slug, c.description, c.icon]
        );
      }
    }

    if (!hasCars) {
      for (const car of seed.cars) {
        await conn.query(
          `INSERT INTO cars
            (id, make, model, year, price, category_id, \`condition\`, mileage, fuel_type,
             transmission, color, engine_size, horsepower, seats, description, seller_name,
             seller_email, seller_phone, city, featured, created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            car.id, car.make, car.model, car.year, car.price, car.category_id, car.condition,
            car.mileage, car.fuel_type, car.transmission, car.color, car.engine_size,
            car.horsepower, car.seats, car.description, car.seller_name, car.seller_email,
            car.seller_phone, car.city, car.featured ? 1 : 0, car.created_at,
          ]
        );
      }
      for (const img of seed.images) {
        await conn.query(
          'INSERT INTO car_images (car_id, image_url, is_primary) VALUES (?, ?, ?)',
          [img.car_id, img.image_url, img.is_primary ? 1 : 0]
        );
      }
    }

    await conn.commit();
    return { seeded: true };
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    throw err;
  } finally {
    conn.release();
  }
}

// Ensures schema + seed data. Safe to call on every boot.
async function bootstrap() {
  await ensureSchema();
  return seedIfEmpty();
}

module.exports = { bootstrap };
