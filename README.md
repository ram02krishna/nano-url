## nanoURL - A Full-Stack URL Shortener

nanoURL is a sleek, full-stack URL shortening platform built for speed, security, and simplicity. Developed with a modern React frontend and a robust Node.js/Express backend, it offers a seamless way to create, manage, and track shortened links. Whether you're a casual user looking for a quick shorten or a power user needing detailed analytics, nanoURL provides a polished, responsive experience on any device.

## Key Features

- Instant Shortening: Transform long URLs into concise, manageable links in seconds.
- Advanced Analytics: Gain deep insights with detailed click tracking, including IP addresses, browser info, OS, and device types.
- Password-Protected Links: Add an extra layer of security by requiring a password for specific shortened URLs.
- Link Expiration: Set custom expiration dates for your links to ensure they are only accessible when needed.
- QR Code Generation: Instantly generate and download QR codes for every shortened URL.
- OTP Verification: Secure user onboarding and password recovery via Email OTP (One-Time Password) verification.
- Free-to-Use: Shorten up to 3 URLs instantly without an account—perfect for quick, anonymous shares.
- Robust Security: JWT-based authentication, salted password hashing, and centralized Zod-powered validation.
- Responsive Dashboard: A unified interface to monitor, copy, delete, and view analytics for your entire URL portfolio.
- Adaptive Theming: Seamlessly switch between Light, Dark, and System modes for optimal readability.
- High Performance: Powered by a PostgreSQL backend and Drizzle ORM for lightning-fast redirection and data retrieval.

## What's New

**Features**
- **Custom aliases** with live availability check (`/summer-sale`), plus reserved-word protection.
- **Click limits** (`maxClicks`) enforced atomically, and an **active/disabled toggle** to pause a link.
- **Edit links**: change destination, title, expiry, click limit or password without changing the short URL.
- **Link titles**, search, filters (active / protected / disabled) and sorting in the dashboard; CSV export of your links.
- **Dashboard overview**: totals, 14-day traffic chart and top links.
- **Richer analytics**: 7/30/90-day range, today / last-7-days stats, referrers, interactive chart and per-link CSV export.
- **Friendly status pages** for expired / disabled / limit-reached / not-found links (API clients still get JSON).
- **Resend OTP** with cooldown, password strength meter, profile + theme picker in Settings.
- Free tier is now **enforced server-side** (3 links per device), not just in the browser.

**Security & reliability**
- Link passwords are now hashed (scrypt). Existing plain-text passwords are upgraded automatically on first successful unlock.
- Only `http(s)` destinations are accepted (blocks `javascript:` / `data:` URLs).
- Brute-force limiter on password-protected links; redirects are no longer throttled by the management-API limiter.
- Redirects respond immediately and use edge geo headers (Vercel/Cloudflare) when available; geo lookups are cached.
- JWTs now expire after 7 days; OTPs use `crypto.randomInt` and constant-time comparison; login no longer reveals whether an email exists.

> **Upgrading an existing database:** the schema gained new columns (`title`, `is_active`, `max_clicks`, `click_count`, `last_clicked_at` on `urls`; `referrer` on `url_clicks`). Run `pnpm db:push` in `/backend` after pulling these changes. Existing rows keep working.

## Tech Stack

| Category           | Tech Stacks                                    |
| ------------------ | ---------------------------------------------- |
| Frontend           | React, Vite, Tailwind CSS, React Router, Axios, React QR Code |
| Backend            | Node.js, Express.js, PostgreSQL, Drizzle ORM   |
| Authentication     | JSON Web Tokens (JWT) + Email OTP              |
| Validation         | Zod (Centralized Middleware)                   |
| Deployment         | Docker, Docker Compose, Vercel (Serverless)    |

## Project Structure

The project is organized into two main directories:

- **`/frontend`**: Contains the React application, including all components, pages, services, and styles.
- **`/backend`**: Contains the Node.js server, including API routes, database models, and business logic.

## Getting Started

To get the application up and running locally, follow these steps:

### Prerequisites

- Node.js (LTS version)
- pnpm (or npm/yarn)
- Docker and Docker Compose

---

### Step 1: Clone the Repository

Clone this project to your local machine:

```bash
git clone <your-repository-url>
cd <repository-folder>
```

---

### Step 2: Backend Setup

1.  **Navigate to the backend directory**:

    ```bash
    cd backend
    ```

2.  **Create Environment File**:
    Create a `.env` file in the `backend` directory:
    ```
    PORT=8000
    DATABASE_URL="postgresql://postgres:admin@localhost:5432/postgres"
    JWT_SECRET=your-super-secret-key
    CORS_ORIGIN=http://localhost:5173
    # Email Configuration (Resend)
    RESEND_API_KEY=your_resend_api_key_here
    RESEND_FROM_EMAIL="nanoURL Security <onboarding@resend.dev>"
    ```

3.  **Start the Database**:

    ```bash
    docker-compose up -d
    ```

4.  **Install & Migrate**:

    ```bash
    pnpm install
    pnpm db:push
    ```

5.  **Start Server**:
    ```bash
    pnpm run dev
    ```

---

### Step 3: Frontend Setup

1.  **Navigate to the frontend directory**:

    ```bash
    cd frontend
    ```

2.  **Install & Start**:
    ```bash
    pnpm install
    pnpm run dev
    ```
    The app will be available at **`http://localhost:5173`**.

---

**Authenticated URL Shortening with Expiration & Password**:

```bash
curl -X POST http://localhost:8000/shorten \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/very-long-url",
    "code": "my-secret-link",
    "expiresAt": "2026-12-31T23:59:59Z",
    "password": "securepassword123"
  }'
```

**Update a link** (`PATCH /:id`, send `null` to clear a field):

```bash
curl -X PATCH http://localhost:8000/<url-id> \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/new","isActive":true,"maxClicks":100,"password":null}'
```

**Other endpoints**: `GET /check-alias/:code`, `GET /stats`, `GET /:id/analytics?days=7|30|90`, `GET /:id/export` (CSV), `GET /user/me`, `POST /user/resend-otp`.

**View URL Analytics**:

```bash
curl -X GET http://localhost:8000/<url-id>/analytics \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Verify Email OTP**:

```bash
curl -X POST http://localhost:8000/user/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456"
  }'
```

---

## Database Schema

nanoURL uses a relational schema managed by Drizzle ORM:

- **`users`**: Stores user profiles, hashed passwords, and verification status.
- **`urls`**: Stores shortened links, titles, target URLs, expiry, click limits, active flag, click counter, and optional hashed password.
- **`url_clicks`**: Stores detailed analytics for every click (IP, location, Browser, OS, Device, Referrer, Timestamp).

---
