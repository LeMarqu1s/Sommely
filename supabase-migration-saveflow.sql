-- SaveFlow: discount_used, feedback table, paused status
-- Exécuter dans Supabase SQL Editor après la migration principale

-- Ajouter discount_used aux profiles (si pas déjà présent)
alter table public.profiles add column if not exists discount_used boolean default false;

-- Ajouter 'paused' au check des subscriptions
alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions add constraint subscriptions_status_check
  check (status in ('trial', 'active', 'cancelled', 'expired', 'paused'));

-- Table feedback (exit survey SaveFlow)
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  reason text not null,
  text text,
  created_at timestamptz default now()
);

alter table public.feedback enable row level security;

create policy "Users can insert own feedback" on public.feedback for insert with check (auth.uid() = user_id);
create policy "Users can view own feedback" on public.feedback for select using (auth.uid() = user_id);

create index if not exists feedback_user_id_idx on public.feedback(user_id);
