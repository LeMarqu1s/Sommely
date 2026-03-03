-- Migration localStorage → Supabase Auth + Database
-- Exécuter dans Supabase SQL Editor

-- Table profiles (remplace user_profiles)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  avatar_url text,
  taste_profile jsonb default '{}',
  onboarding_completed boolean default false,
  referral_code text unique,
  created_at timestamptz default now()
);

-- Table subscriptions
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  plan text default 'free' check (plan in ('free', 'monthly', 'annual')),
  status text default 'trial' check (status in ('trial', 'active', 'cancelled', 'expired')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

-- Table cave_bottles
create table if not exists public.cave_bottles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  vintage integer not null,
  region text,
  appellation text,
  wine_type text default 'Rouge',
  grapes text,
  price_paid numeric default 0,
  current_price numeric default 0,
  quantity integer default 1,
  peak_start integer,
  peak_end integer,
  peak_year integer,
  drink_from integer,
  drink_until integer,
  image_url text,
  notes text,
  price_history jsonb default '[]',
  price_variation_24h numeric default 0,
  last_price_update date,
  alert text,
  location text,
  added_at timestamptz default now()
);

-- Table scans
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  type text default 'bottle' check (type in ('bottle', 'menu')),
  result jsonb not null,
  created_at timestamptz default now()
);

-- Table referrals
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references profiles(id) on delete cascade not null,
  referred_id uuid references profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'converted')),
  reward_given boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.cave_bottles enable row level security;
alter table public.scans enable row level security;
alter table public.referrals enable row level security;

-- Policies profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Policies subscriptions
create policy "Users can view own subscription" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users can insert own subscription" on public.subscriptions for insert with check (auth.uid() = user_id);
create policy "Users can update own subscription" on public.subscriptions for update using (auth.uid() = user_id);

-- Policies cave_bottles
create policy "Users can view own cave" on public.cave_bottles for select using (auth.uid() = user_id);
create policy "Users can insert own cave" on public.cave_bottles for insert with check (auth.uid() = user_id);
create policy "Users can update own cave" on public.cave_bottles for update using (auth.uid() = user_id);
create policy "Users can delete own cave" on public.cave_bottles for delete using (auth.uid() = user_id);

-- Policies scans
create policy "Users can view own scans" on public.scans for select using (auth.uid() = user_id);
create policy "Users can insert own scans" on public.scans for insert with check (auth.uid() = user_id);

-- Policies referrals
create policy "Users can view own referrals" on public.referrals for select using (auth.uid() = referrer_id or auth.uid() = referred_id);

-- Index
create index if not exists cave_bottles_user_id_idx on public.cave_bottles(user_id);
create index if not exists scans_user_id_idx on public.scans(user_id);
create index if not exists scans_created_at_idx on public.scans(created_at desc);
create index if not exists profiles_referral_code_idx on public.profiles(referral_code);

-- Trigger: créer profil + subscription trial à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
declare
  r_code text;
  trial_end timestamptz;
  ref_code text;
  ref_id uuid;
begin
  -- Générer code parrainage 6 caractères alphanumériques
  r_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
  while exists (select 1 from public.profiles where referral_code = r_code) loop
    r_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
  end loop;

  -- Parrainage: 14 jours si code valide, sinon 7 jours
  ref_code := nullif(trim(new.raw_user_meta_data->>'referral_code'), '');
  if ref_code is not null then
    select id into ref_id from public.profiles where referral_code = upper(ref_code) and id != new.id limit 1;
    if ref_id is not null then
      trial_end := now() + interval '14 days';
      insert into public.referrals (referrer_id, referred_id, status)
      values (ref_id, new.id, 'pending');
    else
      trial_end := now() + interval '7 days';
    end if;
  else
    trial_end := now() + interval '7 days';
  end if;

  insert into public.profiles (id, email, name, referral_code, created_at)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), r_code, now());

  insert into public.subscriptions (user_id, plan, status, trial_ends_at)
  values (new.id, 'free', 'trial', trial_end);

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
