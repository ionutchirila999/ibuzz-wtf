begin;

-- Preserve financial/order records when a customer deletes their login.
-- Personal fields are anonymized by the account-deletion Edge Function before auth.users is removed.
alter table public.orders alter column user_id drop not null;
alter table public.orders drop constraint if exists orders_user_id_fkey;
alter table public.orders add constraint orders_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

commit;
