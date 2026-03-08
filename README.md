# MarketPulse

Real-time cryptocurrency tracking app with AI-powered analysis, watchlists, and price alerts.

## Tech Stack

| Layer         | Technology                                      |
| ------------- | ----------------------------------------------- |
| Mobile        | React Native, Expo, React Query, Socket.IO      |
| API           | Express 5, Prisma, Zod, JWT                     |
| Background    | BullMQ worker (price fetching every 60s)        |
| Real-time     | Socket.IO with Redis adapter                    |
| Database      | PostgreSQL 16                                   |
| Cache / Queue | Redis 7                                         |
| External APIs | CoinGecko (prices), OpenAI (reports), Resend (email) |

## Prerequisites

- Node.js 22+
- Docker & Docker Compose
- Expo Go app on your phone (for mobile development)

## Quick Start

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd MarketPulse
npm run install:all
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

| Variable           | Description                  |
| ------------------ | ---------------------------- |
| `JWT_ACCESS_SECRET`  | Secret for access tokens (can be any text on dev)|
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (can be any text on dev)|
| `OPENAI_API_KEY`     | OpenAI API key for AI reports ()https://openai.com/api/ |
| `RESEND_API_KEY`     | Resend API key for emails (https://resend.com/)|
| `RESEND_FROM_EMAIL`  | Sender email address (https://resend.com/)|

Database and Redis URLs are set automatically by Docker Compose for local dev.

Disclaimer:
If you don't have a resend email the RESEND_FROM_EMAIL can be onboarding@resend.dev, but it will only send send emails to the email with which you have registered in Resend

### 3. Start everything

```bash
npm run dev
```

This starts:
- **Backend** (Docker Compose): PostgreSQL, Redis, API server (:3000), BullMQ worker, Socket.IO (:3001)
- **Mobile** (Expo): Metro bundler with QR code for Expo Go

### Available Scripts

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start backend (Docker) + mobile (Expo)   |
| `npm run dev:backend`| Start only the backend via Docker Compose|
| `npm run dev:mobile` | Start only the Expo dev server           |
| `npm run install:all`| Install packages for backend and mobile  |

### Backend-only Scripts (from `apps/backend/`)

| Command                   | Description                        |
| ------------------------- | ---------------------------------- |
| `npm run dev`             | Start API server with hot reload   |
| `npm run dev:worker`      | Start BullMQ worker with hot reload|
| `npm test`                | Run all tests (unit + integration) |
| `npm run test:unit`       | Run unit tests only                |
| `npm run test:integration`| Run integration tests (needs Docker)|

## Project Structure

```
MarketPulse/
├── apps/
│   ├── backend/
│   │   ├── prisma/          # Schema, migrations, seed
│   │   ├── src/
│   │   │   ├── routes/      # Auth, assets, watchlists, alerts, AI, audit
│   │   │   ├── services/    # Market provider, email, cache
│   │   │   ├── jobs/        # BullMQ queues and workers
│   │   │   ├── middleware/  # Auth, role checks
│   │   │   ├── socket.ts    # Socket.IO server
│   │   │   ├── server.ts    # Express entry point
│   │   │   ├── worker.ts    # BullMQ entry point
│   │   │   └── swagger.ts   # API docs
│   │   └── Dockerfile
│   └── mobile/
│       └── src/
│           ├── screens/     # Home, Watchlists, Alerts, Settings, AssetDetail
│           ├── contexts/    # Auth, Theme, Locale, Currency, AiNotify
│           ├── services/    # API client and service modules
│           ├── hooks/       # useSocket
│           ├── components/  # Toast, charts
│           └── navigation/  # Auth stack, main tabs
├── docker-compose.yml
├── .env.example
└── package.json
```

## API Documentation

Start the backend and visit [http://localhost:3000/docs](http://localhost:3000/docs) for the Swagger UI.

## Ports

| Service    | Port |
| ---------- | ---- |
| API        | 3000 |
| Socket.IO  | 3001 |
| PostgreSQL | 5432 |
| Redis      | 6379 |

<img width="1233" height="782" alt="Screenshot at Mar 08 20-52-59" src="https://github.com/user-attachments/assets/7f92d38b-5701-4b72-960a-28c41f85174b" />


