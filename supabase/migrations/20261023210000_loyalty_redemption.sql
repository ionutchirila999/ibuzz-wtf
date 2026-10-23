-- Let customers exchange loyalty points for a single-use discount code.
begin;

alter table public.loyalty_ledger drop constraint if exists loyalty_ledger_reason_check;
alter table public.loyalty_ledger add constraint loyalty_ledger_reason_check
  check (reason in ('completed_order','referral_inviter','referral_new_customer','loyalty_redemption'));

create or replace function public.ibuzz_redeem_loyalty_points(p_points integer)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_balance integer;
  v_code text;
  v_discount numeric(12,2);
begin
  if v_user is null then raise exception 'Sign in to redeem points'; end if;
  if p_points is null or p_points < 100 or p_points > 5000 or p_points % 100 <> 0 then
    raise exception 'Redeem between 100 and 5000 points in increments of 100';
  end if;
  select points_balance into v_balance from public.loyalty_accounts where user_id = v_user for update;
  if not found then raise exception 'No loyalty account found'; end if;
  if v_balance < p_points then raise exception 'Not enough loyalty points'; end if;

  v_code := 'IBZREWARD' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  v_discount := p_points / 10.0;

  update public.loyalty_accounts
    set points_balance = points_balance - p_points, updated_at = now()
    where user_id = v_user;

  insert into public.loyalty_ledger(user_id, points_delta, reason, order_id)
    values (v_user, -p_points, 'loyalty_redemption', null);

  insert into public.discount_codes(code, discount_type, discount_value, min_order_amount, expires_at, max_redemptions, is_active, created_by)
    values (v_code, 'fixed', v_discount, 0, now() + interval '30 days', 1, true, v_user);

  return v_code;
end;
$$;

revoke all on function public.ibuzz_redeem_loyalty_points(integer) from public;
grant execute on function public.ibuzz_redeem_loyalty_points(integer) to authenticated;

commit;
