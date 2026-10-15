# Daily Tracker — Stage 4: Streaks & Analytics

Stage 4 builds on the Stage 3 Supabase persistence version.

## New in this stage
- Current streak metric calculated from completed days in the current month.
- Longest consecutive streak metric calculated from current-month check-ins.
- Sidebar streak summary now uses calculated data instead of a hardcoded 12-day value.
- Category insight identifies the best-performing category based on current habit data.
- Existing Supabase habit and completion persistence is retained.
- No 7-day/14-day chart toggles have been added.

## Install/update
1. Back up your existing project.
2. Extract this ZIP and copy the `daily-tracker` files over your existing project.
3. Keep your existing `.env.local` file; it contains your Supabase credentials.
4. From the project folder run `npm install` then `npm run dev`.
5. Sign in, mark consecutive days complete, and check that the streak cards update.

## Calculation note
Streaks are calculated from the completed day numbers available in the current month. A future enhancement can calculate streaks across month boundaries by loading a wider date range from `habit_logs`.
