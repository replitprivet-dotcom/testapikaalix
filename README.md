# Kᴀᴀʟɪx Free APIs — Vercel Ready Package

A fast developer API hub with live ratings, real analytics, automatic Telegram profile sync, and a website-native community chat.

## Deploy

```bash
npm install
vercel --prod
```

Configure these **server-only** Vercel environment variables before deployment:

- `MONGODB_URI` — MongoDB Atlas connection string
- `MONGODB_DB` — database name (for example `kaalix_db`)
- `MONGODB_IP_SALT` — private random salt used to hash visitor IPs before storage
- `TELEGRAM_BOT_TOKEN` — bot token used only by server routes
- `TELEGRAM_BOT_USERNAME` — bot username without `@`

The connection string and bot token are never sent to the browser or rendered in the dashboard.

## Live community chat and Telegram verification

The Telegram icon and Community button open the website-native group chat. It supports:

- automatic profile creation using a server-side IP hash plus a browser profile ID
- mandatory Telegram verification before sending, replying, reacting, or uploading
- a one-click bot deep link (`/start` token) generated for each browser profile
- automatic webhook setup on verification start
- automatic sync of Telegram name, username, Telegram ID, and profile photo after the user presses **Start** in the bot
- editable display name/profile photo for verified users
- real MongoDB-persisted messages and image attachments
- replies, emoji reactions, and live refresh polling

For an existing deployment, open the chat once after deploying. The verification-start request automatically registers the Telegram webhook at `/api/telegram/webhook` for the current public origin.

## Real ratings and analytics

- Ratings are written to MongoDB and one visitor can update their vote instead of inflating the aggregate on every click.
- Visitor, page-view, API-call, and rating metrics are read from persistent collections.
- The dashboard uses no-cache requests and updates automatically every 5 seconds; there is no manual refresh button.
- If the database is unavailable, the UI reports that the write failed rather than claiming it was saved.

## Existing API proxy

The project retains the existing Vercel-ready API proxy routes, Telegram profile/avatar routes, file proxy, movie proxy, and other endpoint integrations.
