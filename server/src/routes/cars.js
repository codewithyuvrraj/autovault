const express = require('express');
const fs = require('fs');
const { query, pool } = require('../db');
const { upload } = require('../middleware/upload');
const router = express.Router();

// Remove any uploaded files for a failed request
function cleanupFiles(files) {
  (files || []).forEach((f) => fs.unlink(f.path, () => {}));
}

const CAR_FIELDS = [
  'make', 'model', 'year', 'price', 'category_id', 'condition',
  'mileage', 'fuel_type', 'transmission', 'color', 'engine_size',
  'horsepower', 'seats', 'description', 'seller_name', 'seller_email',
  'seller_phone', 'city', 'featured',
];

// GET /api/cars - list with filters
// ?category=slug&q=search&minPrice=&maxPrice=&fuel=&transmission=&condition=&sort=price_asc|price_desc|newest|year_desc|year_asc&featured=1
router.get('/', async (req, res) => {
  try {
    const where = ["ca.status = 'active'"];
    const params = [];

    if (req.query.category) {
      where.push('c.slug = ?');
      params.push(req.query.category);
    }
    if (req.query.q) {
      where.push('(ca.make LIKE ? OR ca.model LIKE ? OR ca.city LIKE ?)');
      const like = `%${req.query.q}%`;
      params.push(like, like, like);
    }
    if (req.query.minPrice) { where.push('ca.price >= ?'); params.push(Number(req.query.minPrice)); }
    if (req.query.maxPrice) { where.push('ca.price <= ?'); params.push(Number(req.query.maxPrice)); }
    if (req.query.fuel) { where.push('ca.fuel_type = ?'); params.push(req.query.fuel); }
    if (req.query.transmission) { where.push('ca.transmission = ?'); params.push(req.query.transmission); }
    if (req.query.condition) { where.push('ca.`condition` = ?'); params.push(req.query.condition); }
    if (req.query.featured === '1') { where.push('ca.featured = TRUE'); }
    if (req.query.status) { where.push('ca.status = ?'); params.push(req.query.status); }

    const sortMap = {
      newest: 'ca.created_at DESC',
      price_asc: 'ca.price ASC',
      price_desc: 'ca.price DESC',
      year_desc: 'ca.year DESC',
      year_asc: 'ca.year ASC',
      popular: 'ca.views DESC',
    };
    const orderBy = sortMap[req.query.sort] || 'ca.created_at DESC';

    const rows = await query(
      `SELECT ca.id, ca.make, ca.model, ca.year, ca.price, ca.` +
      '`condition`,' +
      ` ca.mileage, ca.fuel_type, ca.transmission, ca.color, ca.city, ca.featured,
              c.id AS category_id, c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon,
              (SELECT ci.image_url FROM car_images ci
                WHERE ci.car_id = ca.id ORDER BY ci.is_primary DESC, ci.id ASC LIMIT 1) AS image_url
       FROM cars ca
       JOIN categories c ON c.id = ca.category_id
       WHERE ${where.join(' AND ')}
       ORDER BY ${orderBy}`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /cars failed:', err);
    res.status(500).json({ error: 'Failed to load cars' });
  }
});

// GET /api/cars/:id - single car detail (bumps view count)
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await query(
      `SELECT ca.*, c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon
       FROM cars ca JOIN categories c ON c.id = ca.category_id
       WHERE ca.id = ? AND ca.status = 'active'`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Car not found' });

    const images = await query(
      'SELECT id, image_url, is_primary FROM car_images WHERE car_id = ? ORDER BY is_primary DESC, id ASC',
      [id]
    );
    // async view bump (never blocks the response)
    query('UPDATE cars SET views = views + 1 WHERE id = ?', [id]).catch(() => {});

    res.json({ ...rows[0], images });
  } catch (err) {
    console.error('GET /cars/:id failed:', err);
    res.status(500).json({ error: 'Failed to load car' });
  }
});

// POST /api/cars - publish a car (multipart: fields + images[])
router.post('/', upload.array('images', 8), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const body = req.body || {};

    const required = ['make', 'model', 'year', 'price', 'category_id', 'seller_name'];
    for (const field of required) {
      if (body[field] === undefined || body[field] === '') {
        cleanupFiles(req.files);
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    const car = {};
    for (const field of CAR_FIELDS) {
      if (body[field] !== undefined && body[field] !== '') {
        if (field === 'featured') {
          car[field] = body[field] === 'true' || body[field] === '1';
        } else if (['year', 'mileage', 'horsepower', 'seats'].includes(field)) {
          car[field] = Number(body[field]);
        } else {
          car[field] = body[field];
        }
      }
    }

    // Server-side numeric validation (protects the DB and gives friendly errors)
    const currentYear = new Date().getFullYear();
    const numericChecks = [
      ['year', car.year, (v) => v >= 1886 && v <= currentYear + 1],
      ['price', car.price, (v) => v >= 0 && v <= 100000000],
      ['mileage', car.mileage, (v) => v >= 0],
      ['horsepower', car.horsepower, (v) => v >= 0],
      ['seats', car.seats, (v) => v >= 1 && v <= 99],
    ];
    for (const [field, value, ok] of numericChecks) {
      if (value !== undefined && (Number.isNaN(value) || !ok(value))) {
        cleanupFiles(req.files);
        return res.status(400).json({ error: `Invalid value for ${field}` });
      }
    }

    // Validate category exists
    const [catRows] = await conn.query('SELECT id FROM categories WHERE id = ?', [car.category_id]);
    if (!catRows[0]) {
      cleanupFiles(req.files);
      return res.status(400).json({ error: 'Invalid category selected' });
    }

    // Insert car + images atomically
    await conn.beginTransaction();

    const [insert] = await conn.query(
      `INSERT INTO cars
        (make, model, year, price, category_id, \`condition\`, mileage, fuel_type, transmission,
         color, engine_size, horsepower, seats, description, seller_name, seller_email,
         seller_phone, city, featured)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        car.make, car.model, car.year, car.price, car.category_id,
        car.condition || 'Used', car.mileage || 0, car.fuel_type || null,
        car.transmission || null, car.color || null, car.engine_size || null,
        car.horsepower || null, car.seats || null, car.description || null,
        car.seller_name, car.seller_email || null, car.seller_phone || null,
        car.city || null, car.featured ? true : false,
      ]
    );
    const carId = insert.insertId;

    const files = req.files || [];
    const rows = [];
    for (let i = 0; i < files.length; i++) {
      const url = `/uploads/${files[i].filename}`;
      const [img] = await conn.query(
        'INSERT INTO car_images (car_id, image_url, is_primary) VALUES (?, ?, ?)',
        [carId, url, i === 0 ? true : false]
      );
      rows.push({ id: img.insertId, image_url: url, is_primary: i === 0 });
    }

    await conn.commit();
    res.status(201).json({
      id: carId,
      message: 'Car published successfully!',
      images: rows,
      image_url: rows[0]?.image_url || null,
    });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    cleanupFiles(req.files);
    console.error('POST /cars failed:', err);
    res.status(500).json({ error: 'Failed to publish car' });
  } finally {
    conn.release();
  }
});

// DELETE /api/cars/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await query('DELETE FROM cars WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Car not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /cars failed:', err);
    res.status(500).json({ error: 'Failed to delete car' });
  }
});

module.exports = router;
