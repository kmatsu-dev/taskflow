-- TaskFlow schema. Run in Supabase SQL Editor.
-- Designed so authentication can be bolted on later without a migration:
-- the user_id column already exists; only the RLS policies need to change.

create table if not exists public.tasks (
  id          text primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  title       text not null,
  category    text not null default 'prologue',
  priority    text not null default 'mid',
  type        text not null default 'daily',
  status      text not null default 'todo',
  notes       text default '',
  progress    integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.ideas (
  id          text primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  text        text not null,
  categories  text[] not null default '{}',
  created_at  timestamptz not null default now()
);

-- Row Level Security
alter table public.tasks enable row level security;
alter table public.ideas enable row level security;

-- Permissive policies until auth is wired up.
-- WARNING: any client with the anon key can read/write everything.
-- After adding auth, drop these and replace with e.g.:
--   create policy "tasks_owner" on public.tasks for all to authenticated
--     using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "tasks_anon_all" on public.tasks;
drop policy if exists "ideas_anon_all" on public.ideas;
create policy "tasks_anon_all" on public.tasks for all to anon
  using (true) with check (true);
create policy "ideas_anon_all" on public.ideas for all to anon
  using (true) with check (true);

-- Realtime: broadcast row changes to subscribers.
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.ideas;
