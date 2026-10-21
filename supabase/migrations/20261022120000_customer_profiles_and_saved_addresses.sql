-- Private customer profile and address book, scoped to the authenticated owner.
begin;

create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 100),
  phone text not null default '' check (char_length(phone) <= 150),
  preferred_language text not null default 'th' check (preferred_language in ('th', 'en', 'ro')),
  delivery_addresses jsonb not null default '[]'::jsonb check (jsonb_typeof(delivery_addresses) = 'array'),
  updated_at timestamptz not null default now()
);

alter table public.customer_profiles enable row level security;
revoke all on public.customer_profiles from public, anon;
grant select, insert, update on public.customer_profiles to authenticated;
grant all on public.customer_profiles to service_role;

drop policy if exists "customers read own profile" on public.customer_profiles;
create policy "customers read own profile"
  on public.customer_profiles for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "customers insert own profile" on public.customer_profiles;
create policy "customers insert own profile"
  on public.customer_profiles for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "customers update own profile" on public.customer_profiles;
create policy "customers update own profile"
  on public.customer_profiles for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Preserve existing profile details without exposing them to other customers.
insert into public.customer_profiles (user_id, full_name, phone, preferred_language, delivery_addresses)
select
  u.id,
  left(coalesce(u.raw_user_meta_data->>'full_name', ''), 100),
  left(coalesce(u.raw_user_meta_data->>'phone', ''), 150),
  case when u.raw_user_meta_data->>'preferred_language' in ('th','en','ro')
       then u.raw_user_meta_data->>'preferred_language' else 'th' end,
  case
    when jsonb_typeof(u.raw_user_meta_data->'delivery_addresses') = 'array'
      then u.raw_user_meta_data->'delivery_addresses'
    when length(trim(coalesce(u.raw_user_meta_data->>'delivery_address', ''))) >= 10
      then jsonb_build_array(jsonb_build_object(
        'id', 'legacy-default',
        'label', 'Home',
        'address', left(trim(u.raw_user_meta_data->>'delivery_address'), 1000),
        'is_default', true
      ))
    else '[]'::jsonb
  end
from auth.users u
on conflict (user_id) do nothing;

commit;
