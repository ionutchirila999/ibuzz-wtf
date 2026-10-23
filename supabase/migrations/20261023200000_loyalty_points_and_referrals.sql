-- Customer loyalty points and referral rewards.
begin;

create table if not exists public.loyalty_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  points_balance integer not null default 0 check (points_balance >= 0),
  referral_code text not null unique,
  referred_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (referred_by is null or referred_by <> user_id)
);

create table if not exists public.loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  points_delta integer not null check (points_delta <> 0),
  reason text not null check (reason in ('completed_order','referral_inviter','referral_new_customer')),
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, order_id, reason)
);

create table if not exists public.loyalty_referrals (
  referred_user_id uuid primary key references auth.users(id) on delete cascade,
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  qualifying_order_id uuid not null unique references public.orders(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (referred_user_id <> referrer_user_id)
);

alter table public.loyalty_accounts enable row level security;
alter table public.loyalty_ledger enable row level security;
alter table public.loyalty_referrals enable row level security;

drop policy if exists "Customers read own loyalty account" on public.loyalty_accounts;
create policy "Customers read own loyalty account" on public.loyalty_accounts
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "Customers read own loyalty ledger" on public.loyalty_ledger;
create policy "Customers read own loyalty ledger" on public.loyalty_ledger
  for select to authenticated using (user_id = auth.uid());

grant select on public.loyalty_accounts, public.loyalty_ledger to authenticated;
revoke all on public.loyalty_referrals from anon, authenticated;
revoke insert, update, delete on public.loyalty_accounts, public.loyalty_ledger from anon, authenticated;

create or replace function public.ibuzz_get_my_loyalty_account()
returns table(points_balance integer, referral_code text)
language plpgsql security definer set search_path = public
as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Sign in to view loyalty rewards'; end if;
  insert into public.loyalty_accounts(user_id, referral_code)
  values (v_user, 'IBZ' || upper(substr(replace(v_user::text, '-', ''), 1, 12)))
  on conflict (user_id) do nothing;
  return query select a.points_balance, a.referral_code
    from public.loyalty_accounts a where a.user_id = v_user;
end;
$$;

create or replace function public.ibuzz_apply_referral_code(p_code text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare v_user uuid := auth.uid(); v_referrer uuid;
begin
  if v_user is null then raise exception 'Sign in to apply a referral code'; end if;
  if length(trim(coalesce(p_code, ''))) < 4 or length(trim(p_code)) > 30 then raise exception 'Enter a valid referral code'; end if;
  insert into public.loyalty_accounts(user_id, referral_code)
  values (v_user, 'IBZ' || upper(substr(replace(v_user::text, '-', ''), 1, 12)))
  on conflict (user_id) do nothing;
  select user_id into v_referrer from public.loyalty_accounts
    where referral_code = upper(trim(p_code));
  if v_referrer is null then raise exception 'Referral code not found'; end if;
  if v_referrer = v_user then raise exception 'You cannot use your own referral code'; end if;
  update public.loyalty_accounts set referred_by = v_referrer, updated_at = now()
    where user_id = v_user and referred_by is null;
  if not found then raise exception 'A referral code has already been applied to this account'; end if;
  return true;
end;
$$;

create or replace function public.ibuzz_award_loyalty_points()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_points integer;
  v_referrer uuid;
  v_inserted uuid;
begin
  if new.status = 'completed' and new.payment_status = 'paid'
     and (old.status is distinct from 'completed' or old.payment_status is distinct from 'paid') then
    insert into public.loyalty_accounts(user_id, referral_code)
    values (new.user_id, 'IBZ' || upper(substr(replace(new.user_id::text, '-', ''), 1, 12)))
    on conflict (user_id) do nothing;

    v_points := floor(greatest(new.total, 0) / 100)::integer;
    if v_points > 0 then
      insert into public.loyalty_ledger(user_id, points_delta, reason, order_id)
      values (new.user_id, v_points, 'completed_order', new.id)
      on conflict (user_id, order_id, reason) do nothing
      returning id into v_inserted;
      if v_inserted is not null then
        update public.loyalty_accounts set points_balance = points_balance + v_points, updated_at = now()
          where user_id = new.user_id;
      end if;
    end if;

    select referred_by into v_referrer from public.loyalty_accounts where user_id = new.user_id;
    if v_referrer is not null then
      insert into public.loyalty_referrals(referred_user_id, referrer_user_id, qualifying_order_id)
      values (new.user_id, v_referrer, new.id)
      on conflict (referred_user_id) do nothing
      returning referred_user_id into v_inserted;
      if v_inserted is not null then
        insert into public.loyalty_ledger(user_id, points_delta, reason, order_id)
        values (v_referrer, 100, 'referral_inviter', new.id)
        on conflict (user_id, order_id, reason) do nothing
        returning id into v_inserted;
        if v_inserted is not null then
          insert into public.loyalty_accounts(user_id, referral_code)
          values (v_referrer, 'IBZ' || upper(substr(replace(v_referrer::text, '-', ''), 1, 12)))
          on conflict (user_id) do nothing;
          update public.loyalty_accounts set points_balance = points_balance + 100, updated_at = now()
            where user_id = v_referrer;
        end if;
        insert into public.loyalty_ledger(user_id, points_delta, reason, order_id)
        values (new.user_id, 50, 'referral_new_customer', new.id)
        on conflict (user_id, order_id, reason) do nothing
        returning id into v_inserted;
        if v_inserted is not null then
          update public.loyalty_accounts set points_balance = points_balance + 50, updated_at = now()
            where user_id = new.user_id;
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists ibuzz_award_loyalty_points on public.orders;
create trigger ibuzz_award_loyalty_points
  after update of status, payment_status on public.orders
  for each row execute function public.ibuzz_award_loyalty_points();

revoke all on function public.ibuzz_get_my_loyalty_account() from public;
grant execute on function public.ibuzz_get_my_loyalty_account() to authenticated;
revoke all on function public.ibuzz_apply_referral_code(text) from public;
grant execute on function public.ibuzz_apply_referral_code(text) to authenticated;

commit;
