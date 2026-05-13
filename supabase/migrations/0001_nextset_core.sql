-- NextSet 핵심 테이블 + RLS
-- Supabase SQL 편집기에서 실행하거나, 프로젝트 연결 후 CLI로 마이그레이션하세요.

create extension if not exists "pgcrypto";

-- routines: exercises는 앱의 RoutineExercise 배열 형태 JSONB
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists routines_user_id_idx on public.routines (user_id);

-- One weekly row per user; day columns reference routines.id
create table if not exists public.weekly_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  monday uuid references public.routines (id) on delete set null,
  tuesday uuid references public.routines (id) on delete set null,
  wednesday uuid references public.routines (id) on delete set null,
  thursday uuid references public.routines (id) on delete set null,
  friday uuid references public.routines (id) on delete set null,
  saturday uuid references public.routines (id) on delete set null,
  sunday uuid references public.routines (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  routine_id uuid references public.routines (id) on delete set null,
  routine_name text not null,
  date date not null,
  exercises jsonb not null default '[]'::jsonb,
  total_volume numeric not null default 0,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists workout_sessions_user_id_idx on public.workout_sessions (user_id);
create index if not exists workout_sessions_date_idx on public.workout_sessions (user_id, date desc);

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  weight numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists weight_logs_user_id_idx on public.weight_logs (user_id);

alter table public.routines enable row level security;
alter table public.weekly_schedules enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.weight_logs enable row level security;

-- routines
create policy "routines_select_own" on public.routines
  for select using (auth.uid() = user_id);
create policy "routines_insert_own" on public.routines
  for insert with check (auth.uid() = user_id);
create policy "routines_update_own" on public.routines
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "routines_delete_own" on public.routines
  for delete using (auth.uid() = user_id);

-- weekly_schedules
create policy "weekly_select_own" on public.weekly_schedules
  for select using (auth.uid() = user_id);
create policy "weekly_insert_own" on public.weekly_schedules
  for insert with check (auth.uid() = user_id);
create policy "weekly_update_own" on public.weekly_schedules
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weekly_delete_own" on public.weekly_schedules
  for delete using (auth.uid() = user_id);

-- workout_sessions
create policy "sessions_select_own" on public.workout_sessions
  for select using (auth.uid() = user_id);
create policy "sessions_insert_own" on public.workout_sessions
  for insert with check (auth.uid() = user_id);
create policy "sessions_update_own" on public.workout_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sessions_delete_own" on public.workout_sessions
  for delete using (auth.uid() = user_id);

-- weight_logs
create policy "weights_select_own" on public.weight_logs
  for select using (auth.uid() = user_id);
create policy "weights_insert_own" on public.weight_logs
  for insert with check (auth.uid() = user_id);
create policy "weights_update_own" on public.weight_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weights_delete_own" on public.weight_logs
  for delete using (auth.uid() = user_id);
