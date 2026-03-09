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
git clone https://github.com/BorislavStefanov31/MarketPulse.git
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
| `OPENAI_API_KEY`     | OpenAI API key for AI reports (https://openai.com/api/)|
| `RESEND_API_KEY`     | Resend API key for emails (https://resend.com/)|
| `RESEND_FROM_EMAIL`  | Sender email address (https://resend.com/)|

Database and Redis URLs are set automatically by Docker Compose for local dev.

Disclaimer:
If you don't have a resend email the RESEND_FROM_EMAIL can be onboarding@resend.dev, but it will only send send emails to the email with which you have registered in Resend.

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

## High-level design of the system:

<img width="1233" height="782" alt="Screenshot at Mar 08 20-52-59" src="https://github.com/user-attachments/assets/7f92d38b-5701-4b72-960a-28c41f85174b" />

Architecture Decisions and Tradeoffs:


BullMQ + Redis — The price fetching runs as a separate worker process. If it crashes, the API stays up. BullMQ handles retries automatically and Redis was already needed for caching and Socket.IO (in prod we can separate them). 

Separate Socket.IO server — WebSocket connections sit on their own process so they don't block the API. The worker publishes pride:update events to Redis pub/sub, and Socket.IO picks them up and broadcasts to all clients.

Single Redis instance — One Redis handles caching, BullMQ job queue, and Socket.IO pub/sub. In prod i would split those into separate processes

Authentication — Just normal email/pass auth. Access tokens expire in 15 minutes, refresh tokens in 7 days. Tokens are stored in expo-secure-store (iOS Keychain / Android Keystore). On the BE refresh tokens are stored in the DB for stateless api.

CoinGecko polling instead of WebSocket feeds — The worker fetches all 100 assets in one call, saves to Postgres, invalidates the cache, and emits a Socket.IO price:update event — so the mobile app would know to invalidate its queries and check for price alerts. For an app that does not support trading and i don't have access to real-time data so i think this is fresh enough.

One AI report per asset per day — OpenAI calls are slow and expensive (the cost a lot of tokens if we would have to do it for every person). Reports are saved in Postgres and cached in Redis. The prompt uses web search so reports still include current news.

Email Service - i use Resend for forgot password emails.

Prisma - i use prisma for type-safe queries, more readable schema and autmatic migrations to the Postgre. It also prevents SQL injections

Docker Compose — Postgres, Redis, API, Worker, and Socket.IO each run in their own container for better scalability in the future via orchestrators like Kubernetes.

Indexes — Composite indexes on snapshots, alerts, and watchlist for faster reads.

Caching — Redis caches the top 100 list and asset details with a 60-second TTL, plus AI reports and user alerts which are invalidated on write. This is done for faster reads again.

Tests - I also have unit and integration tests for the backend which creates temporal container for testing so that they doesn't interfiere with the normal processes.

Swagger - There are swagger docs you can find in the "/docs" route

Logging — Structured JSON logs with pino and also you can see what each of the containers is loggin trought the console or the Docker Dekstop application.

Mobile - I use React Native Expo because it is easier to manage than a plain React Native ClI app and it is perfect for small projects like this (in there i also use the popular navigation library React Navigation instead of Expo Navigation, because im more expireneced with it and it gives you more granular control).

React Query + Context for the mobile app — Server data (assets, watchlists, alerts) is managed by React Query which handles caching, refetching, and pagination. UI state (theme, locale, auth) uses React Context.

Cursor-based pagination — Avoids the performance issues of OFFSET on large tables and prevents skipped rows when new data comes in. React Query's useInfiniteQuery handles cursor chaining natively.

The mobile app's alerts - Alerts are shown only when you are in the app and are checked when the price:update event comes from the socket (the one that also triggers query invalidations for new fetches)

The mobile app's chart - I use TradingView charts trough the "trading-view-light-charts" package because i think they have the best charts.

Locale and theme - There is also a locale and theme in the app which are saved per account so that when the user returns its prefferences would be automatically applied.
