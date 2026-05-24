// routes/contact.js
const express  = require('express');
const router   = express.Router();
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'submissions.json');

// ── Helpers ──────────────────────────────────────────────────────────────────

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ submissions: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function buildTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// ── POST /api/contact  (public) ──────────────────────────────────────────────

router.post(
  '/',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters.'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address.'),
    body('message')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Message must be between 10 and 2000 characters.'),
  ],
  async (req, res) => {
    // Validate
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { name, email, message } = req.body;
    const id        = uuidv4();
    const timestamp = new Date().toISOString();

    // Persist to JSON store
    try {
      const db = readDB();
      db.submissions.push({ id, name, email, message, timestamp, read: false });
      writeDB(db);
    } catch (err) {
      console.error('[DB] Write error:', err.message);
      return res.status(500).json({ error: 'Could not save submission. Please try again.' });
    }

    // Send notification email (non-blocking — never fail the response because of email)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = buildTransporter();

        // Notification to Navigator Assist
        await transporter.sendMail({
          from: `"Navigator Assist Website" <${process.env.EMAIL_USER}>`,
          to:   process.env.EMAIL_TO || process.env.EMAIL_USER,
          subject: `New Enquiry from ${name}`,
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
              <h2 style="color:#1a6bff;">New Enquiry — Navigator Assist</h2>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px;color:#666;width:110px;">Name</td><td style="padding:8px;font-weight:600;">${name}</td></tr>
                <tr style="background:#f5f7ff;"><td style="padding:8px;color:#666;">Email</td><td style="padding:8px;"><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding:8px;color:#666;">Received</td><td style="padding:8px;">${new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td></tr>
              </table>
              <div style="margin-top:16px;padding:16px;background:#f5f7ff;border-left:3px solid #1a6bff;">
                <p style="margin:0;white-space:pre-wrap;">${message}</p>
              </div>
              <p style="font-size:12px;color:#999;margin-top:24px;">Reference ID: ${id}</p>
            </div>
          `,
        });

        // Auto-reply to the sender
        await transporter.sendMail({
          from: `"Navigator Assist" <${process.env.EMAIL_USER}>`,
          to:   email,
          subject: 'We received your enquiry — Navigator Assist',
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
              <h2 style="color:#1a6bff;">Thank you, ${name}!</h2>
              <p>We've received your message and will get back to you within <strong>24 hours</strong>.</p>
              <div style="margin:24px 0;padding:16px;background:#f5f7ff;border-left:3px solid #1a6bff;">
                <p style="margin:0;white-space:pre-wrap;">${message}</p>
              </div>
              <p>— The Navigator Assist Team<br>
              <a href="tel:+917034222440">+91 70342 22440</a><br>
              Thammanam, Kochi</p>
            </div>
          `,
        });

        console.log(`[Email] Sent for submission ${id}`);
      } catch (err) {
        console.error('[Email] Send failed (submission still saved):', err.message);
      }
    } else {
      console.warn('[Email] Skipped — EMAIL_USER/EMAIL_PASS not configured in .env');
    }

    return res.status(201).json({
      success: true,
      message: 'Your enquiry has been received. We will get back to you shortly!',
      id,
    });
  }
);

module.exports = router;
