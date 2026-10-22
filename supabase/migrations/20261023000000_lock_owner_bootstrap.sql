-- Permanently close public owner bootstrap after the first confirmed owner.
-- Keeping this state separate from user_roles prevents a deleted/demoted final
-- admin from reopening first-owner registration to any confirmed account.
begin;

create table if not exists public.owner_bootstrap_state (
  singleton boolean primary key default true check (singleton),
  owner_claimed boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.owner_bootstrap_state (singleton, owner_claimed)
select true, exists (select 1 from public.user_roles where role = 'admin')
on conflict (singleton) do nothing;

alter table public.owner_bootstrap_state enable row level security;
revoke all on public.owner_bootstrap_state from public, anon, authenticated;
grant all on public.owner_bootstrap_state to service_role;

create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_claimed boolean;
begin
  if new.email_confirmed_at is null then
    return new;
  end if;

  -- Serialize owner claims and lock the durable bootstrap flag.
  perform pg_advisory_xact_lock(hashtext('ibuzz_first_owner'));
  select owner_claimed into v_owner_claimed
  from public.owner_bootstrap_state
  where singleton = true
  for update;

  if not coalesce(v_owner_claimed, true) then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict do nothing;

    update public.owner_bootstrap_state
    set owner_claimed = true, updated_at = now()
    where singleton = true;
  end if;

  return new;
end;
$$;

create or replace function public.owner_exists()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select owner_claimed from public.owner_bootstrap_state where singleton = true),
    true
  )
$$;

revoke all on function public.owner_exists() from public;
grant execute on function public.owner_exists() to anon, authenticated;

commit;
