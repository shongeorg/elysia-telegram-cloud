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

| Variable              | Description                                         |
| --------------------- | --------------------------------------------------- |
| `PORT`                | Local dev server port                               |
| `DB_URL`              | Neon PostgreSQL connection string                   |
| `TELEGRAM_BOT_TOKEN`  | Bot token from [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_CHANNEL_ID` | Telegram channel ID (must start with `-100`)        |
| `PRODUCTION_URL`      | Vercel production URL                               |
| `DEVELOPMENT_URL`     | Local development URL                               |

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

## Media Session controls (Android notification / lock screen)

The player is a plain `new Audio()` instance rendered by Vue 3. The notification
card and lock-screen controls come from the native [Web Media Session API](https://developer.mozilla.org/docs/Web/API/Media_Session_API) —
no extra libraries required. All the code lives in `src/controllers/main.ts`.

As soon as an audio element plays, Android already shows a basic card (title,
play/pause). The full control set — next/previous, seek buttons, working progress
bar — appears **only** for the actions the page declares. So every button has to
be registered by hand.

### 1. Register the action handlers

Handlers must call the *same* functions the on-page buttons use, otherwise the
web UI and the system card drift apart:

| Media Session action | Player function                    |
| -------------------- | ---------------------------------- |
| `play`               | `audio.play()` — only if paused    |
| `pause`              | `audio.pause()`                    |
| `previoustrack`      | `prev()`                           |
| `nexttrack`          | `next()`                           |
| `seekbackward`       | `seekBy(-offset)`                  |
| `seekforward`        | `seekBy(+offset)`                  |
| `seekto`             | `seekTo(details.seekTime)` clamped |

```js
const handlers = {
  play: () => { if (audio.src && audio.paused) audio.play().catch(() => {}); },
  pause: () => { if (!audio.paused) audio.pause(); },
  previoustrack: () => prev(),
  nexttrack: () => next(),
  seekbackward: (d) => seekBy(-((d && d.seekOffset) || 10)),
  seekforward: (d) => seekBy((d && d.seekOffset) || 10),
  seekto: (d) => { /* clamp d.seekTime to [0, duration], then set audio.currentTime */ },
};

// register each action separately: unknown actions throw and must not break the rest
["play", "pause", "previoustrack", "nexttrack", "seekbackward", "seekforward", "seekto"]
  .forEach((action) => {
    try { navigator.mediaSession.setActionHandler(action, handlers[action]); } catch {}
  });
```

Rules that matter:

- `play` must **start** playback, not toggle it — a toggle would pause when the
  system already considers the track as playing.
- Never start a track without a valid `download_url`.
- Keep `next`/`prev`/`toggle` in one place; do not reimplement the queue logic
  inside the handlers.
- Wrap every `setActionHandler` in its own `try/catch` (older browsers know
  `mediaSession` but not every action).
- On unmount call `setActionHandler(action, null)` for each action and clear
  `navigator.mediaSession.metadata`.

### 2. Track metadata

`navigator.mediaSession.metadata` drives the title/artist/artwork in the card:

```js
if ("mediaSession" in navigator && "MediaMetadata" in window) {
  navigator.mediaSession.metadata = new MediaMetadata({
    title: cleanName(track.file_name), // the only real name field in the DB
    artist: "Cloud Player",            // fallback: tracks have no artist field
    album: "Telegram Storage",
    artwork: [{ src: appLogo, sizes: "64x64", type: "image/svg+xml" }],
  });
}
```

Tracks only store `file_name`, `mime_type`, `file_size` and `download_url`, so
there is nothing to use for a per-track artist or cover — hence the static
fallback. Never build an artwork URL from unverified data.

### 3. Playback state and position

Sync the card with the real audio element instead of with button clicks:

- `play` / `playing` events → `navigator.mediaSession.playbackState = "playing"`
- `pause` / `ended` events → `"paused"`, `error` → `"none"`
- `timeupdate`, `loadedmetadata`, `durationchange`, `seeked` → `setPositionState()`

`setPositionState()` must only be called with sane values, otherwise it throws:

```js
const d = audio.duration;
if (!isFinite(d) || d <= 0) return;          // duration unknown → skip
let pos = Math.min(Math.max(audio.currentTime || 0, 0), d); // clamp to [0, duration]
navigator.mediaSession.setPositionState({ duration: d, playbackRate: 1, position: pos });
```

Do not poll with `setInterval` — the audio events above are enough.

### 4. Testing on a phone

1. Open the site in **Chrome on Android** (in-app browsers inside Telegram do not
   expose the system card) and tap a track — Chrome requires a user gesture to
   start playback.
2. Minimise the browser or pull down the notification shade → the card should
   show the track name plus play/pause, next/previous and seek.
3. Test play/pause, next/previous and the progress bar from the shade and from
   the lock screen.

Which buttons are actually rendered still depends on the Chrome/Android version
and the system UI — the page can only declare which actions it supports.

## API Endpoints

| Method | Route          | Description                    |
| ------ | -------------- | ------------------------------ |
| `GET`  | `/`            | Music player UI                |
| `GET`  | `/api`         | API status                     |
| `GET`  | `/api/files`   | All files (JSON)               |
| `GET`  | `/api/music`   | Audio files with download URLs |
| `POST` | `/api/webhook` | Telegram webhook handler       |

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
