const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const path    = require('path');

const app = express();

// ─── CORS ──────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsers ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── HTTP Logger (dev only) ────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Static Files — serve uploaded images ─────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Health Check ──────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'CivicSense API is operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/citizen',       require('./routes/citizen.routes'));
app.use('/api/officer',       require('./routes/officer.routes'));
app.use('/api/admin',         require('./routes/admin.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));

// ─── 404 Handler ───────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ──────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
