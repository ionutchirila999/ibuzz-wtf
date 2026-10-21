-- Support ticket ownership must be assigned at creation and never changed
-- through the public API. RLS controls which rows users can see; this trigger
-- separately prevents ownership reassignment on an otherwise authorized update.
begin;

create or replace function public.ibuzz_prevent_support_ticket_reassignment()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'Support ticket owner cannot be changed'
      using errcode = '42501';
  end if;

  if new.order_id is distinct from old.order_id then
    raise exception 'Support ticket order association cannot be changed'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

revoke all on function public.ibuzz_prevent_support_ticket_reassignment()
  from public, anon, authenticated;

drop trigger if exists support_tickets_immutable_ownership
  on public.support_tickets;

create trigger support_tickets_immutable_ownership
  before update of user_id, order_id on public.support_tickets
  for each row
  execute function public.ibuzz_prevent_support_ticket_reassignment();

-- Reassert the intended row-level access rules and customer creation boundary.
drop policy if exists "Customers and admins read support tickets"
  on public.support_tickets;
create policy "Customers and admins read support tickets"
  on public.support_tickets
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.has_role(auth.uid(), 'admin'::public.app_role)
  );

drop policy if exists "Customers create own support tickets"
  on public.support_tickets;
create policy "Customers create own support tickets"
  on public.support_tickets
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'open'
    and priority = 'normal'
    and admin_reply is null
    and replied_at is null
    and (
      order_id is null
      or exists (
        select 1
        from public.orders o
        where o.id = support_tickets.order_id
          and o.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Admins update support tickets"
  on public.support_tickets;
create policy "Admins update support tickets"
  on public.support_tickets
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

commit;
