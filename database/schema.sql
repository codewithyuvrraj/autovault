-- ============================================================
-- Car Platform - MySQL Schema + Seed Data
-- Database: car_platform
-- Run: mysql -u root < database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS car_platform
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE car_platform;

-- ------------------------------------------------------------
-- Categories
-- ------------------------------------------------------------
DROP TABLE IF EXISTS car_images;
DROP TABLE IF EXISTS cars;
DROP TABLE IF EXISTS categories;

CREATE TABLE categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  slug VARCHAR(80) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL,
  icon VARCHAR(16) NOT NULL DEFAULT '🚗',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Cars
-- ------------------------------------------------------------
CREATE TABLE cars (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  make VARCHAR(80) NOT NULL,
  model VARCHAR(80) NOT NULL,
  year SMALLINT UNSIGNED NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  `condition` ENUM('New','Used','Certified Pre-Owned') NOT NULL DEFAULT 'Used',
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
  CONSTRAINT fk_cars_category FOREIGN KEY (category_id)
    REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_cars_category (category_id),
  INDEX idx_cars_year (year),
  INDEX idx_cars_price (price)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Users (Google OAuth accounts)
-- ------------------------------------------------------------
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  google_id VARCHAR(64) NOT NULL UNIQUE,
  email VARCHAR(190) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  picture VARCHAR(500) DEFAULT NULL,
  last_login TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Car Images
-- ------------------------------------------------------------
CREATE TABLE car_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  car_id INT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_images_car FOREIGN KEY (car_id)
    REFERENCES cars(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Seed: Categories
-- ------------------------------------------------------------
INSERT INTO categories (name, slug, description, icon) VALUES
('Sports',      'sports',      'High-performance machines built for speed and thrill.', '🏎️'),
('Sedan',       'sedan',       'Comfortable four-door cars for everyday luxury.',        '🚗'),
('SUV',         'suv',         'Spacious sport utility vehicles for any terrain.',       '🚙'),
('Luxury',      'luxury',      'Premium vehicles with refined craftsmanship.',           '👑'),
('Hatchback',   'hatchback',   'Compact, agile and city-friendly cars.',                 '🚘'),
('Coupe',       'coupe',       'Sleek two-door style with dynamic performance.',         '🏁'),
('Convertible', 'convertible', 'Open-top driving freedom under the sun.',                '🌤️'),
('Electric',    'electric',    'Zero-emission EVs with instant torque.',                 '⚡'),
('Truck',       'truck',       'Heavy-duty hauling and off-road capability.',            '🛻'),
('Classic',     'classic',     'Timeless vintage icons with soul and history.',          '📻');

-- ------------------------------------------------------------
-- Seed: Cars
-- ------------------------------------------------------------
INSERT INTO cars
(make, model, year, price, category_id, `condition`, mileage, fuel_type, transmission,
 color, engine_size, horsepower, seats, description, seller_name, seller_email, seller_phone,
 city, featured, status) VALUES
('Ferrari', 'F8 Tributo', 2021, 295000.00, (SELECT id FROM categories WHERE slug='sports'),
 'Used', 8200, 'Petrol', 'Automatic', 'Rosso Corsa', '3.9L V8 Twin-Turbo', 710, 2,
 'Stunning Ferrari F8 Tributo finished in classic Rosso Corsa. Immaculate service history,
  carbon fibre extras and ceramic brakes. A genuine supercar experience in showroom condition.',
 'Velocity Motors', 'sales@velocitymotors.com', '+1 (555) 010-2030', 'Miami, FL', TRUE, 'active'),

('BMW', 'M4 Competition', 2023, 89000.00, (SELECT id FROM categories WHERE slug='sports'),
 'Certified Pre-Owned', 5400, 'Petrol', 'Automatic', 'Toronto Red', '3.0L I6 Twin-Turbo', 503, 4,
 'BMW M4 Competition xDrive with M Driver''s Package. Laser headlights, M carbon bucket seats
  and Harman Kardon sound. Full BMW warranty remains.',
 'Elite Auto Haus', 'hello@eliteautohaus.com', '+1 (555) 010-7788', 'Los Angeles, CA', TRUE, 'active'),

('Toyota', 'Camry XSE', 2024, 34900.00, (SELECT id FROM categories WHERE slug='sedan'),
 'New', 150, 'Hybrid', 'Automatic', 'Wind Chill Pearl', '2.5L 4-Cyl Hybrid', 232, 5,
 'Brand new Toyota Camry XSE Hybrid. Panoramic roof, JBL audio, wireless charging and
  Toyota Safety Sense 3.0. Factory warranty with complimentary maintenance.',
 'City Toyota', 'info@citytoyota.com', '+1 (555) 010-3344', 'Dallas, TX', TRUE, 'active'),

('Mercedes-Benz', 'S 580 4MATIC', 2022, 119000.00, (SELECT id FROM categories WHERE slug='luxury'),
 'Used', 14000, 'Petrol', 'Automatic', 'Obsidian Black', '4.0L V8 Biturbo', 496, 5,
 'The flagship Mercedes S-Class with 4MATIC. Executive rear seating, Burmester 4D surround,
  MBUX rear tablet and rear-axle steering. First-class travel, perfected.',
 'Prestige Imports', 'team@prestigeimports.io', '+1 (555) 010-5566', 'New York, NY', TRUE, 'active'),

('Porsche', '911 Turbo S', 2023, 245000.00, (SELECT id FROM categories WHERE slug='sports'),
 'New', 0, 'Petrol', 'Automatic', 'GT Silver', '3.8L Flat-6 Twin-Turbo', 640, 2,
 'Porsche 911 Turbo S with Sport Chrono and aerokit. Exceptionally specified and ready
  for delivery. The benchmark of everyday supercars.',
 'Autobahn Motors', 'sales@autobahnmotors.de', '+1 (555) 010-9900', 'Chicago, IL', TRUE, 'active'),

('Tesla', 'Model 3 Performance', 2024, 51990.00, (SELECT id FROM categories WHERE slug='electric'),
 'New', 0, 'Electric', 'Automatic', 'Pearl White', 'Dual Motor AWD', 510, 5,
 'Tesla Model 3 Performance with Track Mode, 20" Überturbine wheels and upgraded brakes.
  0-60 in 2.9 seconds. Autopilot and Full Self-Driving capable.',
 'Tesla Direct', 'orders@tesladirect.example', '+1 (555) 010-1122', 'San Francisco, CA', TRUE, 'active'),

('Range Rover', 'Sport Autobiography', 2023, 124500.00, (SELECT id FROM categories WHERE slug='suv'),
 'Certified Pre-Owned', 9800, 'Petrol', 'Automatic', 'Eiger Grey', '4.4L V8 Twin-Turbo', 523, 5,
 'Range Rover Sport Autobiography with Meridian Signature sound, 23-inch wheels and
  Adaptive Off-Road Cruise Control. Commanding presence everywhere it goes.',
 'Premier SUV Co.', 'sales@premiersuv.com', '+1 (555) 010-4455', 'Denver, CO', TRUE, 'active'),

('Chevrolet', 'Corvette Stingray', 2022, 72900.00, (SELECT id FROM categories WHERE slug='coupe'),
 'Used', 6100, 'Petrol', 'Automatic', 'Torch Red', '6.2L V8', 495, 2,
 'Mid-engine Corvette Stingray 3LT with Z51 performance package. Front lift, mag ride
  and NPP exhaust. American icon, modern masterpiece.',
 'Thunder Road Auto', 'cars@thunderroad.example', '+1 (555) 010-6677', 'Houston, TX', FALSE, 'active'),

('Ford', 'F-150 Raptor R', 2024, 112500.00, (SELECT id FROM categories WHERE slug='truck'),
 'New', 0, 'Petrol', 'Automatic', 'Code Orange', '5.2L V8 Supercharged', 720, 5,
 'The most powerful F-150 ever built. Raptor R with FOX live-valve shocks, 37-inch tires
  and a supercharged V8 that dominates the desert and the drag strip alike.',
 'American Iron Dealers', 'sales@americaniron.example', '+1 (555) 010-8899', 'Austin, TX', TRUE, 'active'),

('Jaguar', 'F-Type R Convertible', 2021, 68500.00, (SELECT id FROM categories WHERE slug='convertible'),
 'Used', 11200, 'Petrol', 'Automatic', 'British Racing Green', '5.0L V8 Supercharged', 575, 2,
 'Jaguar F-Type R Convertible with active sport exhaust and premium leather interior.
  Top-down touring with a thunderous V8 soundtrack.',
 'Heritage Motors', 'enquiries@heritagemotors.uk', '+1 (555) 010-2233', 'Seattle, WA', FALSE, 'active'),

('Honda', 'Civic Type R', 2023, 44900.00, (SELECT id FROM categories WHERE slug='hatchback'),
 'Used', 7500, 'Petrol', 'Manual', 'Championship White', '2.0L Turbo 4-Cyl', 315, 4,
 'Honda Civic Type R in Championship White. The legendary hot hatch, sharpened.
  Limited slip diff, adaptive dampers and a manual gearbox purists adore.',
 'Drive On Motors', 'hello@driveon.example', '+1 (555) 010-1010', 'Portland, OR', FALSE, 'active'),

('Aston Martin', 'DB11 V8', 2021, 156000.00, (SELECT id FROM categories WHERE slug='classic'),
 'Used', 8900, 'Petrol', 'Automatic', 'Q Gallant Green', '4.0L V8 Twin-Turbo', 503, 4,
 'Aston Martin DB11 in a stunning Q Commission Gallant Green with tan hide interior.
  A grand tourer that blends effortless pace with hand-crafted elegance.',
 'Champions Gallery', 'sales@championsgallery.example', '+1 (555) 010-3434', 'Scottsdale, AZ', FALSE, 'active'),

('Audi', 'RS e-tron GT', 2023, 109500.00, (SELECT id FROM categories WHERE slug='electric'),
 'Used', 12400, 'Electric', 'Automatic', 'Daytona Grey', 'Dual Motor AWD', 637, 4,
 'Audi RS e-tron GT with 93 kWh battery, 800V architecture and quattro all-wheel drive.
  Launch control, adaptive air suspension and a stunning, sculpted body.',
 'Volt & Velocity', 'sales@voltvelocity.example', '+1 (555) 010-5656', 'San Diego, CA', FALSE, 'active'),

('Lexus', 'ES 350 F Sport', 2022, 41500.00, (SELECT id FROM categories WHERE slug='sedan'),
 'Certified Pre-Owned', 15800, 'Petrol', 'Automatic', 'Ultrasonic Blue', '3.5L V6', 302, 5,
 'Lexus ES 350 F Sport with Mark Levinson audio, heated/ventilated seats and Lexus
  Safety System+ 2.5. Quiet, comfortable and endlessly reliable.',
 'Pacific Lexus', 'contact@pacificlexus.example', '+1 (555) 010-7878', 'Phoenix, AZ', FALSE, 'active'),

('Bentley', 'Continental GT Speed', 2022, 254000.00, (SELECT id FROM categories WHERE slug='luxury'),
 'Used', 5200, 'Petrol', 'Automatic', 'Mulliner Shooting Star', '6.0L W12 Twin-Turbo', 650, 4,
 'Bentley Continental GT Speed with Mulliner Driving Specification. 650 hp W12, active
  all-wheel drive and Bentley Rotating Display. The definitive luxury grand tourer.',
 'Knight Bridge Motors', 'sales@knightbridge.example', '+1 (555) 010-9090', 'Beverly Hills, CA', TRUE, 'active');

-- ------------------------------------------------------------
-- Seed: Images (Unsplash CDN photos, one per car)
-- ------------------------------------------------------------
INSERT INTO car_images (car_id, image_url, is_primary) VALUES
((SELECT id FROM cars WHERE make='Ferrari' AND model='F8 Tributo'), 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=1200&q=80', TRUE),
((SELECT id FROM cars WHERE make='BMW' AND model='M4 Competition'), 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=1200&q=80', TRUE),
((SELECT id FROM cars WHERE make='Toyota' AND model='Camry XSE'), 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1200&q=80', TRUE),
((SELECT id FROM cars WHERE make='Mercedes-Benz' AND model='S 580 4MATIC'), 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=80', TRUE),
((SELECT id FROM cars WHERE make='Porsche' AND model='911 Turbo S'), 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80', TRUE),
((SELECT id FROM cars WHERE make='Tesla' AND model='Model 3 Performance'), 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=80', TRUE),
((SELECT id FROM cars WHERE make='Range Rover' AND model='Sport Autobiography'), 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80', TRUE),
((SELECT id FROM cars WHERE make='Chevrolet' AND model='Corvette Stingray'), 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1200&q=80', TRUE),
((SELECT id FROM cars WHERE make='Ford' AND model='F-150 Raptor R'), 'https://images.unsplash.com/photo-1605893477799-b99e3b8b93fe?w=1200&q=80', TRUE),
((SELECT id FROM cars WHERE make='Jaguar' AND model='F-Type R Convertible'), 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&q=80', TRUE),
((SELECT id FROM cars WHERE make='Honda' AND model='Civic Type R'), 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1200&q=80', TRUE),
((SELECT id FROM cars WHERE make='Aston Martin' AND model='DB11 V8'), 'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=1200&q=80', TRUE),
((SELECT id FROM cars WHERE make='Audi' AND model='RS e-tron GT'), 'https://images.unsplash.com/photo-1614204424926-196a80bf0be8?w=1200&q=80', TRUE),
((SELECT id FROM cars WHERE make='Lexus' AND model='ES 350 F Sport'), 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&q=80', TRUE),
((SELECT id FROM cars WHERE make='Bentley' AND model='Continental GT Speed'), 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=1200&q=80', TRUE);
