# Elysia Telegram Cloud Storage

Music player powered by Telegram Bot API — store unlimited audio files in Telegram, stream directly from the browser.

## Stack

- **Runtime**: Bun
- **Backend**: Elysia.js (TypeScript)
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **Frontend**: Vue 3 + Tailwind CSS (inline)
- **Deploy**: Vercel (Serverless)

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Environment variables

Create `.env` file in project root:

```env
PORT=4545

DB_URL=postgresql://user:password@host/neondb?sslmode=require

TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHANNEL_ID=-100xxxxxxxxxx

PRODUCTION_URL=https://your-app.vercel.app
DEVELOPMENT_URL=http://localhost:4545
```

| Variable | Description |
|----------|-------------|
| `PORT` | Local dev server port |
| `DB_URL` | Neon PostgreSQL connection string |
| `TELEGRAM_BOT_TOKEN` | Bot token from [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_CHANNEL_ID` | Telegram channel ID (must start with `-100`) |
| `PRODUCTION_URL` | Vercel production URL |
| `DEVELOPMENT_URL` | Local development URL |

#### Getting TELEGRAM_CHANNEL_ID

1. Forward any message from your channel to [@idbot](https://t.me/idbot)
2. The bot replies with channel info:
   ```
   🔎 TELEGRAM CHANNEL CHECK
   📢 Channel: elysia-cloude
   🆔 -1003728421790 | 13 digits
   ```
3. Copy the ID (starts with `-100`, 13 digits total) and paste into `.env`

#### Setting up the Telegram Bot

1. Create a bot via [@BotFather](https://t.me/BotFather):
   - Send `/newbot`
   - Choose name and username
   - Copy the token (format: `123456789:ABCdefGHIjklMNOpqrSTUvwxYZ`)
2. Add the bot to your channel as **admin** (required to receive channel posts)

### 3. Database setup

Push schema to Neon:

```bash
npx drizzle-kit push
```

### 4. Run locally

```bash
bun run dev
```

Open: http://localhost:4545

### 5. Deploy

```bash
bun run deploy
```

## Telegram Webhook Setup

Set the webhook URL after deploying:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://your-app.vercel.app/api/webhook"
```

Replace `<YOUR_TOKEN>` with your `TELEGRAM_BOT_TOKEN` and the URL with your Vercel deployment URL.

### Verify webhook:

```bash
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo"
```

## How it works

1. Send audio files to the Telegram channel
2. Webhook receives updates, saves file metadata to Neon DB
3. `GET /api/music` fetches audio files + generates temporary download links via Telegram Bot API
4. Browser streams audio directly from Telegram servers

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/` | Music player UI |
| `GET` | `/api` | API status |
| `GET` | `/api/files` | All files (JSON) |
| `GET` | `/api/music` | Audio files with download URLs |
| `POST` | `/api/webhook` | Telegram webhook handler |

## Project Structure

```
src/
├── index.ts          # Main app entry
├── schema.ts         # Drizzle database schema
├── controllers/
│   └── main.ts       # Page controller (Vue frontend)
└── routes/
    └── main.ts       # Main routes
```

## Limitations

- Telegram Bot API supports files up to **20 MB** via `getFile`
- Download links are temporary (expire after some time)
- Links are regenerated on each `/api/music` request
