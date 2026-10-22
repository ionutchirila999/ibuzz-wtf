begin;

alter table public.support_tickets
  add column if not exists assigned_to text,
  add column if not exists internal_notes text;

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  message text not null check (length(trim(message)) between 1 and 5000),
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists support_ticket_messages_ticket_created_idx
  on public.support_ticket_messages(ticket_id, created_at);
alter table public.support_ticket_messages enable row level security;
drop policy if exists "Customers and admins read support messages" on public.support_ticket_messages;
create policy "Customers and admins read support messages" on public.support_ticket_messages
  for select to authenticated using (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    or (not is_internal and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.user_id = auth.uid()
    ))
  );
revoke all on public.support_ticket_messages from anon, authenticated;
grant select on public.support_ticket_messages to authenticated;

create or replace function public.ibuzz_add_support_message(
  p_ticket_id uuid,
  p_message text,
  p_is_internal boolean default false
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  ticket_row public.support_tickets%rowtype;
  message_id uuid;
  admin_user boolean;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if length(trim(coalesce(p_message,''))) < 1 or length(p_message) > 5000 then
    raise exception 'Message must contain 1 to 5000 characters';
  end if;
  admin_user := public.has_role(auth.uid(), 'admin'::public.app_role);
  select * into ticket_row from public.support_tickets where id = p_ticket_id for update;
  if not found then raise exception 'Ticket not found'; end if;
  if p_is_internal and not admin_user then raise exception 'Admin access required for internal notes'; end if;
  if not admin_user and ticket_row.user_id <> auth.uid() then raise exception 'Ticket access denied'; end if;

  insert into public.support_ticket_messages(ticket_id, author_id, message, is_internal)
  values (p_ticket_id, auth.uid(), trim(p_message), p_is_internal)
  returning id into message_id;

  if admin_user and not p_is_internal then
    update public.support_tickets set admin_reply = trim(p_message), replied_at = now(), updated_at = now()
    where id = p_ticket_id;
  end if;
  if admin_user then
    insert into public.admin_audit_log(actor_id, action, entity_table, entity_id, details)
    values (auth.uid(), case when p_is_internal then 'support_internal_note_added' else 'support_reply_added' end,
      'support_tickets', p_ticket_id::text, jsonb_build_object('message_id', message_id));
  end if;
  return message_id;
end;
$$;

revoke all on function public.ibuzz_add_support_message(uuid, text, boolean) from public, anon;
grant execute on function public.ibuzz_add_support_message(uuid, text, boolean) to authenticated;

commit;