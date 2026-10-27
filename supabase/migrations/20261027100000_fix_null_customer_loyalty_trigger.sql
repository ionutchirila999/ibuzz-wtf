-- Prevent loyalty automation from blocking order updates for guest or deleted customers.
-- Orders without a linked auth user remain manageable, but do not earn account-bound rewards.
begin;

create or replace function public.ibuzz_award_loyalty_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points integer;
  v_referrer uuid;
  v_inserted uuid;
begin
  if new.user_id is not null
     and new.status = 'completed'
     and new.payment_status = 'paid'
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
        update public.loyalty_accounts
        set points_balance = points_balance + v_points, updated_at = now()
        where user_id = new.user_id;
      end if;
    end if;

    select referred_by into v_referrer
    from public.loyalty_accounts
    where user_id = new.user_id;

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

          update public.loyalty_accounts
          set points_balance = points_balance + 100, updated_at = now()
          where user_id = v_referrer;
        end if;

        insert into public.loyalty_ledger(user_id, points_delta, reason, order_id)
        values (new.user_id, 50, 'referral_new_customer', new.id)
        on conflict (user_id, order_id, reason) do nothing
        returning id into v_inserted;

        if v_inserted is not null then
          update public.loyalty_accounts
          set points_balance = points_balance + 50, updated_at = now()
          where user_id = new.user_id;
        end if;
      end if;
    end if;
  end if;

  return new;
end;
$$;

commit;
