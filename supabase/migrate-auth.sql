-- TaskFlow auth migration: switch from anon-permissive RLS to auth-scoped.
-- Prerequisite: sign up via the deployed app at least once
-- (https://kmatsu-dev.github.io/taskflow/) so auth.users has one row.
-- Idempotent — safe to re-run.

-- Abort early if no user exists yet (otherwise the backfill below would
-- leave user_id NULL and the SET NOT NULL at the end would fail).
do $$
begin
  if not exists (select 1 from auth.users) then
    raise exception 'No users in auth.users. Sign up via the app first, then re-run this script.';
  end if;
end $$;

-- 1. Drop the old permissive anon policies.
drop policy if exists "tasks_anon_all" on public.tasks;
drop policy if exists "ideas_anon_all" on public.ideas;

-- 2. Create auth-scoped policies (per-operation for clarity).
drop policy if exists "tasks_owner_select" on public.tasks;
drop policy if exists "tasks_owner_insert" on public.tasks;
drop policy if exists "tasks_owner_update" on public.tasks;
drop policy if exists "tasks_owner_delete" on public.tasks;
drop policy if exists "ideas_owner_select" on public.ideas;
drop policy if exists "ideas_owner_insert" on public.ideas;
drop policy if exists "ideas_owner_update" on public.ideas;
drop policy if exists "ideas_owner_delete" on public.ideas;

create policy "tasks_owner_select" on public.tasks
  for select to authenticated using (auth.uid() = user_id);
create policy "tasks_owner_insert" on public.tasks
  for insert to authenticated with check (auth.uid() = user_id);
create policy "tasks_owner_update" on public.tasks
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_owner_delete" on public.tasks
  for delete to authenticated using (auth.uid() = user_id);

create policy "ideas_owner_select" on public.ideas
  for select to authenticated using (auth.uid() = user_id);
create policy "ideas_owner_insert" on public.ideas
  for insert to authenticated with check (auth.uid() = user_id);
create policy "ideas_owner_update" on public.ideas
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ideas_owner_delete" on public.ideas
  for delete to authenticated using (auth.uid() = user_id);

-- 3. Backfill any existing rows to the (single) user.
update public.tasks
   set user_id = (select id from auth.users order by created_at limit 1)
 where user_id is null;
update public.ideas
   set user_id = (select id from auth.users order by created_at limit 1)
 where user_id is null;

-- 4. Make user_id required from now on.
alter table public.tasks alter column user_id set not null;
alter table public.ideas alter column user_id set not null;
