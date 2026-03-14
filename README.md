# Daily Inventory Counter

Mobile-first inventory counting app built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase Postgres.

## Features
- Mobile-first responsive table with horizontal scroll
- Sticky product column
- Auto-calculated Actual Sold and Difference
- Autosave to localStorage + database
- Serverless-ready API routes

## Project Structure
- `app/`
- `app/api/inventory/route.ts`
- `components/InventoryTable.tsx`
- `lib/db.ts`
- `types/inventory.ts`

## Supabase Schema
Run this SQL in Supabase:

```sql
create table if not exists inventory_days (
  date date primary key,
  rows jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
```

## Environment Variables
Create a `.env.local` file:

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Local Development
```
npm install
npm run dev
```

## Deploy to Vercel
1. Push the repo to GitHub.
2. Create a new Vercel project.
3. Add the environment variables from `.env.local` in Vercel.
4. Deploy.

## Notes
- Opening Stock pulls from the previous day’s Ending Stock when available.
- Numbers are formatted to 3 decimals on blur.
