# Famiglia Social Platform

A social platform interface built with Next.js. It includes a home feed with stories,
a post composer (photo/video), emoji reactions, a friends list, requests and trending topics.
Payments use Stripe (test mode) and the project is set up to use Supabase.

**Live demo:** https://famiglia-social-platform-hazl.vercel.app

## Tech stack
- Next.js, React, TypeScript
- Tailwind CSS
- Stripe (payment intents, test mode)
- Supabase

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Environment variables
Create a `.env.local` file in the project root with these keys (use your own values):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Never commit `.env.local` or real secret keys.
