begin;
alter table public.support_tickets add column if not exists customer_email text;
create or replace function public.ibuzz_set_support_customer_email()
returns trigger language plpgsql security definer set search_path = public, auth as $ticket_email$
begin
  select u.email into new.customer_email from auth.users u where u.id = new.user_id;
  return new;
end $ticket_email$;
drop trigger if exists ibuzz_support_customer_email on public.support_tickets;
create trigger ibuzz_support_customer_email before insert on public.support_tickets
for each row execute function public.ibuzz_set_support_customer_email();
update public.support_tickets t set customer_email = u.email from auth.users u where u.id = t.user_id and t.customer_email is null;
commit;