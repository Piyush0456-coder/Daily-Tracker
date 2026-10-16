
# Daily Tracker — Complete Project

Responsive React + Vite habit tracker with a dark emerald dashboard, Supabase email/password authentication, per-user habit storage, daily completion logs, analytics, streaks, and CSV export. Designed for desktop, tablet, and mobile.

## 1. Run locally

Install Node.js 20 or newer, open this folder in VS Code, then run:

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`. Edit `.env.local` with your Supabase project values, then restart Vite. Use only the publishable/anon key in frontend code. Never use the `service_role`/secret key.

## 2. Supabase setup

1. Create a Supabase project.
2. In **Project Settings → API Keys**, copy the Project URL and Publishable key (or legacy `anon` key).
3. Add them to `.env.local` using the names in `.env.example`.
4. In **SQL Editor**, run the complete `supabase/schema.sql` script once.
5. In **Authentication → URL Configuration**, add your local URL `http://localhost:5173` to the allowed redirect URLs. After deployment, also add your GitHub Pages URL.
6. Register a test account and test creating/deleting a habit, checking days, and refreshing the page.

## 3. Publish publicly for free with GitHub Pages

This repository includes `.github/workflows/deploy.yml`; it builds and deploys the app when you push to `main`.

1. Create a **public** repository on GitHub, for example `daily-tracker`.
2. Upload/push the contents of this project folder to the repository root (so `package.json` is at the root).
3. In GitHub, open **Settings → Secrets and variables → Actions → New repository secret**. Add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your publishable/anon key
4. Open **Settings → Pages** and set the build/deployment source to **GitHub Actions**.
5. Open the **Actions** tab and wait for **Deploy Daily Tracker to GitHub Pages** to finish successfully.
6. Your public site will be `https://YOUR-GITHUB-USERNAME.github.io/REPOSITORY-NAME/`.
7. Add that public URL to Supabase **Authentication → URL Configuration** under Site URL / Redirect URLs.

GitHub Pages hosting and Supabase's free tier can be used without paying while within their current plan limits. Public hosting means anyone can open the site; user data should remain isolated by the supplied Row Level Security policies.

## Important security notes

- Never commit `.env.local`; it is ignored by Git.
- Never expose Supabase `service_role` or secret keys.
- The frontend publishable/anon key is expected to be public; RLS policies are essential.
- GitHub Pages is static hosting. The database and authentication are provided by Supabase.

## Troubleshooting

- If sign-up requires email confirmation, confirm the email before signing in.
- If the site deploys but login fails, check the GitHub Actions secrets and Supabase redirect URLs.
- After changing repository secrets, trigger a new deployment by pushing a commit or using **Actions → Run workflow**.
- If you change the repository name, the Vite configuration calculates the Pages base path automatically during GitHub Actions builds.
# Daily-Tracker
A react mini project for daily track for task
