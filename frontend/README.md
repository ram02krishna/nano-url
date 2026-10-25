# nanoURL Frontend

The nanoURL Frontend is a cutting-edge, highly responsive interface designed for the modern web. Built with React and Vite, it delivers a lightning-fast user experience with smooth transitions and real-time updates. From instant link shortening to detailed analytics visualizations, the frontend provides a polished, intuitive dashboard for managing your digital footprint across all devices.

## Features

- ** Ultra-Fast SPA**: Engineered with React and Vite for near-instant load times and fluid client-side navigation.
- ** Interactive Analytics**: Visualise your link performance with real-time data on clicks, browsers, OS, and devices.
- ** Secure Link Flows**: Native support for password-protected links with dedicated verification screens.
- ** OTP Verification**: Seamless user onboarding with integrated Email OTP verification flows.
- ** Adaptive UI/UX**: A sleek, modern design with full support for Light, Dark, and System modes via Tailwind CSS.
- ** Instant QR Codes**: Generate and download professional QR codes for every shortened link with one click.
- ** Device-Aware Limits**: Intelligent client-side tracking for the free tier, ensuring a fair and persistent trial experience.
- ** Framer Motion Animations**: Enhanced with smooth, high-quality transitions for a premium application feel.

## Tech Stack

- **Framework**: React (with Vite)
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router DOM
- **API Calls**: Axios
- **Animations**: Framer Motion
- **Notifications**: React Hot Toast

## Project Structure

The `src` directory is organized as follows:

- **`components`**: Reusable UI components (buttons, inputs, loaders, navbars, and URL cards).
- **`context`**: React context for authentication state and theme management.
- **`pages`**: Top-level page components for Home, Dashboard, Auth, Settings, and Error pages.
- **`routes`**: Centralized application routing.
- **`services`**: API interaction layers for authentication and URL operations.
- **`utils`**: Helper functions for device tracking and token management.

## Key Flows

### Email OTP Verification
1. After registration, the user is redirected to the verification page.
2. A 6-digit OTP is sent to the user's email.
3. Upon successful verification, the account is activated and the user is logged in.

### Password Protected Links
1. If a user tries to access a shortened URL that is password protected:
2. The backend redirects them to the frontend's `/p/:shortCode` page.
3. The user enters the password, and upon success, they are redirected to the target URL.

### Link Expiration
1. Users can set an expiration date when shortening a URL.
2. If the current date is past the expiration, the link will automatically resolve to a "Link Expired" error page.

## Getting Started

1.  **Navigate to the frontend directory**: `cd frontend`
2.  **Install dependencies**: `pnpm install`
3.  **Environment Variables**: Create a `.env` file with:
    ```
    VITE_BACKEND_URL=http://localhost:8000
    ```
4.  **Run Development Server**: `pnpm run dev`

## Vercel Deployment

1. Import the `frontend` folder into a new Vercel project.
2. The `vercel.json` file handles single-page application (SPA) routing, automatically preventing 404 errors on refresh.
3. Add the following Environment Variable:
   - `VITE_BACKEND_URL`: The URL of your deployed backend.
