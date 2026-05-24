// server.js — Navigator Assist Backend
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
const fs         = require('fs');

const contactRouter = require('./routes/contact');
const adminRouter   = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Ensure data directory exists ─────────────────────────────────────────────
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (Postman, curl, same-origin HTML)
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    cb(new Error(`CORS: Origin "${origin}" not allowed.`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 5,                      // max 5 form submissions per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait 15 minutes and try again.' },
});

// ── Static frontend ───────────────────────────────────────────────────────────
// Drop navigator-assist.html into the /public folder for self-contained serving
app.use(express.static(__dirname));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/contact', contactLimiter, contactRouter);
app.use('/api/admin',   adminRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 catch-all for API
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// SPA fallback — serve frontend for all non-API routes
app.get('*', (_req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <h2 style="font-family:sans-serif;padding:40px;">
        Navigator Assist API is running on port ${PORT}.<br>
        <small style="color:#888;">Place your <code>navigator-assist.html</code> inside the <code>/public</code> folder and rename it to <code>index.html</code>.</small>
      </h2>
    `);
  }
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  if (err.message.startsWith('CORS')) {
    return res.status(403).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   Navigator Assist — Backend Running     ║
  ║   http://localhost:${PORT}                  ║
  ╠══════════════════════════════════════════╣
  ║  POST  /api/contact         Form submit  ║
  ║  GET   /api/admin/submissions  (admin)  ║
  ║  GET   /api/health          Health check ║
  ╚══════════════════════════════════════════╝
  `);
});
