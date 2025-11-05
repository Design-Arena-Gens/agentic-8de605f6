# AI Video Agent for Instagram

Automated video generation and Instagram posting system built with Next.js.

## Features

- 🎬 AI video generation using FAL.AI
- 💾 Video storage in Vercel Blob
- 📱 Instagram posting automation
- ⏰ Scheduled posting with cron
- 📊 Management dashboard

## Environment Variables

```
FAL_API_KEY=your_fal_api_key
INSTAGRAM_ACCESS_TOKEN=your_token
INSTAGRAM_USER_ID=your_user_id
BLOB_READ_WRITE_TOKEN=auto_generated
CRON_SECRET=random_secret
```

## Deploy

```bash
npm install
npm run build
vercel deploy --prod
```

## Usage

1. Visit the web dashboard
2. Enter video prompt
3. Set schedule (optional)
4. Videos post automatically via cron

## API Endpoints

- POST `/api/generate-video` - Generate video
- POST `/api/post-to-instagram` - Post to IG
- GET `/api/posts` - List all posts
- GET `/api/cron/daily-post` - Cron handler
