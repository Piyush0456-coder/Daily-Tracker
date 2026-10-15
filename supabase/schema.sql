-- Daily Tracker Stage 2 schema. Run in Supabase Dashboard > SQL Editor.
-- RLS limits rows to the currently signed-in user.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 100),
  category text not null default 'Personal',
  priority text not null default 'Medium' check (priority in ('Low','Medium','High')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists habits_user_id_idx on public.habits(user_id);
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  completion_date date not null,
  is_completed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habit_logs_one_per_day unique (habit_id, completion_date)
);
create index if not exists habit_logs_user_date_idx on public.habit_logs(user_id, completion_date);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists "Users can read their own habits" on public.habits;
create policy "Users can read their own habits" on public.habits for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can create their own habits" on public.habits;
create policy "Users can create their own habits" on public.habits for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own habits" on public.habits;
create policy "Users can update their own habits" on public.habits for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete their own habits" on public.habits;
create policy "Users can delete their own habits" on public.habits for delete to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can read their own habit logs" on public.habit_logs;
create policy "Users can read their own habit logs" on public.habit_logs for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can create their own habit logs" on public.habit_logs;
create policy "Users can create their own habit logs" on public.habit_logs for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = (select auth.uid())));
drop policy if exists "Users can update their own habit logs" on public.habit_logs;
create policy "Users can update their own habit logs" on public.habit_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = (select auth.uid())));
drop policy if exists "Users can delete their own habit logs" on public.habit_logs;
create policy "Users can delete their own habit logs" on public.habit_logs for delete to authenticated using ((select auth.uid()) = user_id);
