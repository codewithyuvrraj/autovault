const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
const { pool } = require('./db');

dotenv.config();

const carsRouter = require('./routes/cars');
const categoriesRouter = require('./routes/categories');
const authRouter = require('./routes/auth');

const app = express();
const PORT = Number(process.env.PORT) || 5001;

// ---------- middleware ----------
// origin: true reflects the requester when CLIENT_ORIGIN is unset,
// which is required for credentials cookies (a literal '*' is rejected with them)
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), { maxAge: '1d' }));

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.originalUrl}`);
  next();
});

// ---------- routes ----------
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', time: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

app.use('/api/cars', carsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/auth', authRouter);

// JSON 404 for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Unknown endpoint: ${req.method} ${req.originalUrl}` });
});

// ---------- error handling ----------
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.message && err.message.includes('image files')) {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Image too large (max 8MB per image)' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Too many images (max 8)' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚗 Car Platform API running at http://localhost:${PORT}`);
});
