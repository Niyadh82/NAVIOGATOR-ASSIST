# Navigator Assist — Backend

Express.js API server for the Navigator Assist website.

## Features

- **Contact form API** — validates, stores to JSON, sends email notification + auto-reply
- **Admin dashboard API** — list, mark-read, delete submissions (Basic Auth protected)
- **Rate limiting** — 5 submissions per IP per 15 minutes
- **Static file serving** — serves the frontend from `/public`

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=3000
EMAIL_USER=navigatorassist@gmail.com
EMAIL_PASS=juoatwnwoagfrjbo
EMAIL_TO=navigatorassist@gmail.com
ADMIN_USER=admin
ADMIN_PASS=Navigator@2026
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords.
> Generate one for "Mail" and paste it as `EMAIL_PASS`.

### 3. Run the server

```bash
# Production
npm start

# Development (auto-restart on changes)
npm run dev
```

Server will start at: **http://localhost:3000**

The frontend (`public/index.html`) is served automatically.

---

## API Reference

### Public Endpoints

#### `POST /api/contact`
Submit a contact form enquiry.

**Body (JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "I'd like to know more about your services."
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Your enquiry has been received...",
  "id": "uuid-here"
}
```

---

### Admin Endpoints (Basic Auth required)

All admin routes require the `Authorization: Basic <base64>` header.
Default credentials: `admin` / `changeme123` (change in `.env`).

| Method   | Endpoint                          | Description              |
|----------|-----------------------------------|--------------------------|
| `GET`    | `/api/admin/submissions`          | List all submissions     |
| `PATCH`  | `/api/admin/submissions/:id/read` | Mark a submission as read|
| `DELETE` | `/api/admin/submissions/:id`      | Delete one submission    |
| `DELETE` | `/api/admin/submissions`          | Delete all submissions   |

**Example with curl:**
```bash
curl -u admin:changeme123 http://localhost:3000/api/admin/submissions
```

---

### Health Check

```bash
GET /api/health
```
Returns `{ "status": "ok", "timestamp": "..." }`

---

## Data Storage

Submissions are stored in `data/submissions.json` as a JSON array.
No database required. Backup this file regularly.

---

## Deployment (Render / Railway / VPS)

1. Push code to GitHub
2. Set environment variables in your platform dashboard
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Point your domain's DNS to the deployed URL
6. Update `ALLOWED_ORIGINS` in `.env` with your live domain

---

## Folder Structure

```
navigator-assist-backend/
├── data/
│   └── submissions.json     ← auto-created on first run
├── middleware/
│   └── auth.js              ← Basic Auth guard
├── public/
│   └── index.html           ← Frontend (served statically)
├── routes/
│   ├── contact.js           ← POST /api/contact
│   └── admin.js             ← /api/admin/* routes
├── .env                     ← your secrets (never commit this)
├── .env.example             ← template
├── package.json
└── server.js                ← entry point
```
