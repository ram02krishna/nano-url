# nanoURL Backend

The nanoURL Backend is a high-performance, scalable API engine that powers the nanoURL URL shortening platform. Architected with Node.js and Express, it provides a robust suite of RESTful services for secure authentication, dynamic URL management, and real-time analytics. Designed for reliability and speed, the backend ensures seamless redirection and data integrity at scale.

## Features

- ** High-Performance API**: Optimized RESTful endpoints for ultra-fast link generation and redirection.
- ** Advanced Analytics Engine**: Track link performance with detailed click metrics, IP addresses, browser info, OS, and device types.
- ** Secure JWT & OTP**: Industry-standard stateless security combined with Email OTP for verification and recovery.
- ** Drizzle ORM & PostgreSQL**: Type-safe database interactions with a powerful relational schema.
- ** Multi-Tier Rate Limiting**: Intelligent protection against DDoS and API abuse using granular IP-based throttling.
- ** Zod Schema Validation**: Centralized request validation to ensure strict data consistency and security.
- ** Serverless Optimized**: Fully pre-configured for instant, global deployment on Vercel.

## Run Locally

From the `backend` directory, install dependencies, apply the database schema, and start the development server:

```bash
pnpm install
pnpm db:push
pnpm run dev
```

Make sure PostgreSQL is running and `DATABASE_URL` and `JWT_SECRET` are configured in your `.env` file before starting the server.

## API Endpoints

### Authentication (`/user`)

- `POST /user/signup`: Register a new user and send an OTP.
- `POST /user/verify-email`: Verify email with OTP to activate account.
- `POST /user/login`: Authenticate user and receive a JWT.
- `POST /user/forgot-password`: Request a password reset OTP.
- `POST /user/reset-password`: Reset password using OTP.
- `POST /user/change-password`: Change password for an authenticated user.

### URL Management (`/`)

- `POST /shorten-free`: Shorten a URL without authentication (Free Tier).
  - Body: `{ url, code?, deviceId, expiresAt?, password? }`
- `POST /shorten`: Shorten a URL for authenticated users.
  - Body: `{ url, code?, expiresAt?, password? }`
- `GET /codes`: List all URLs owned by the authenticated user.
- `GET /:id/analytics`: Get detailed click analytics for a specific URL.
- `DELETE /:id`: Delete a shortened URL.
- `GET /:shortCode`: Resolve short code and redirect to target URL.
- `POST /verify-password/:shortCode`: Verify password for a protected link.

## Database Schema

Defined with **Drizzle ORM** for PostgreSQL:

### `users` table
- `id` (UUID, PK)
- `firstname`, `lastname` (varchar)
- `email` (varchar, unique)
- `password`, `salt` (text)
- `isVerified` (boolean)
- `otp` (varchar, 6 chars)
- `otpExpiry` (timestamp)

### `urls` table
- `id` (UUID, PK)
- `shortCode` (varchar, unique)
- `targetURL` (text)
- `userId` (UUID, FK)
- `deviceId` (varchar)
- `expiresAt` (timestamp)
- `password` (varchar, plain text or hashed)
- `createdAt`, `updatedAt` (timestamps)

### `url_clicks` table
- `id` (UUID, PK)
- `urlId` (UUID, FK, Cascade)
- `ipAddress` (varchar)
- `browser`, `os`, `device` (varchar)
- `clickedAt` (timestamp)

## Rate Limiting

- **Global**: 100 requests / 15 mins.
- **Auth**: 5 requests / 15 mins.
- **URL**: 30 requests / 1 min.

## Vercel Deployment

1. Import the `backend` folder into Vercel.
2. The `vercel.json` file is already configured for serverless execution.
3. Configure Environment Variables:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `JWT_SECRET`: Random secure string.
   - `CORS_ORIGIN`: Your frontend URL.
   - `RESEND_API_KEY`: Your Resend API Key.
   - `RESEND_FROM_EMAIL`: The email address used to send verification emails (e.g., "nanoURL Security <onboarding@resend.dev>").
