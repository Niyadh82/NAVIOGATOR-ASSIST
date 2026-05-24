// routes/admin.js
const express  = require('express');
const router   = express.Router();
const basicAuth = require('../middleware/auth');
const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'submissions.json');

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ submissions: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// All admin routes require Basic Auth
router.use(basicAuth);

// GET /api/admin/submissions — list all (newest first)
router.get('/submissions', (req, res) => {
  const db = readDB();
  const sorted = [...db.submissions].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
  res.json({
    total: sorted.length,
    unread: sorted.filter(s => !s.read).length,
    submissions: sorted,
  });
});

// PATCH /api/admin/submissions/:id/read — mark as read
router.patch('/submissions/:id/read', (req, res) => {
  const db  = readDB();
  const idx = db.submissions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found.' });
  db.submissions[idx].read = true;
  writeDB(db);
  res.json({ success: true, submission: db.submissions[idx] });
});

// DELETE /api/admin/submissions/:id — remove one
router.delete('/submissions/:id', (req, res) => {
  const db = readDB();
  const before = db.submissions.length;
  db.submissions = db.submissions.filter(s => s.id !== req.params.id);
  if (db.submissions.length === before)
    return res.status(404).json({ error: 'Not found.' });
  writeDB(db);
  res.json({ success: true, deleted: req.params.id });
});

// DELETE /api/admin/submissions — clear all
router.delete('/submissions', (req, res) => {
  writeDB({ submissions: [] });
  res.json({ success: true, message: 'All submissions deleted.' });
});

module.exports = router;
