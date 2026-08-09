const express = require('express');
const { query } = require('../db');
const router = express.Router();

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// GET /api/categories - all categories with car counts
router.get('/', async (req, res) => {
  try {
    const rows = await query(`
      SELECT c.id, c.name, c.slug, c.description, c.icon,
             COUNT(ca.id) AS car_count
      FROM categories c
      LEFT JOIN cars ca ON ca.category_id = c.id AND ca.status = 'active'
      GROUP BY c.id, c.name, c.slug, c.description, c.icon
      ORDER BY c.name
    `);
    res.json(rows);
  } catch (err) {
    console.error('GET /categories failed:', err);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

// POST /api/categories - create a category
router.post('/', async (req, res) => {
  const { name, description = '', icon = '🚗' } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  try {
    const slug = slugify(name);
    const result = await query(
      'INSERT INTO categories (name, slug, description, icon) VALUES (?, ?, ?, ?)',
      [name.trim(), slug, description.trim(), icon]
    );
    res.status(201).json({ id: result.insertId, name, slug, description, icon, car_count: 0 });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A category with this name already exists' });
    }
    console.error('POST /categories failed:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// DELETE /api/categories/:id - delete a category
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    // Prevent deleting categories that still have cars
    const rows = await query('SELECT COUNT(*) AS total FROM cars WHERE category_id = ?', [id]);
    const car = rows[0];
    if (car && car.total > 0) {
      return res.status(409).json({ error: `Cannot delete: ${car.total} car(s) still use this category` });
    }
    const result = await query('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /categories failed:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
