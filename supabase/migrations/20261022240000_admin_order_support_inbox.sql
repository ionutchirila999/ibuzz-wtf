begin;

alter table public.order_support_requests
  add column if not exists assigned_to text,
  add column if not exists internal_notes text,
  add column if not exists admin_reply text,
  add column if not exists replied_at timestamptz;

grant select, update on public.order_support_requests to authenticated;
drop policy if exists "Admins read order support requests" on public.order_support_requests;
create policy "Admins read order support requests" on public.order_support_requests
  for select to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role));
drop policy if exists "Admins update order support requests" on public.order_support_requests;
create policy "Admins update order support requests" on public.order_support_requests
  for update to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create table if not exists public.order_support_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.order_support_requests(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  message text not null check (length(trim(message)) between 1 and 5000),
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists order_support_messages_request_created_idx
  on public.order_support_messages(request_id, created_at);
alter table public.order_support_messages enable row level security;
create policy "Customers and admins read order support messages" on public.order_support_messages
  for select to authenticated using (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    or (not is_internal and exists (
      select 1 from public.order_support_requests r where r.id = request_id and r.user_id = auth.uid()
    ))
  );
revoke all on public.order_support_messages from anon, authenticated;
grant select on public.order_support_messages to authenticated;

create or replace function public.ibuzz_add_order_support_message(
  p_request_id uuid,
  p_message text,
  p_is_internal boolean default false
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  request_row public.order_support_requests%rowtype;
  message_id uuid;
  admin_user boolean;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if length(trim(coalesce(p_message,''))) < 1 or length(p_message) > 5000 then raise exception 'Message must contain 1 to 5000 characters'; end if;
  admin_user := public.has_role(auth.uid(), 'admin'::public.app_role);
  select * into request_row from public.order_support_requests where id=p_request_id for update;
  if not found then raise exception 'Request not found'; end if;
  if p_is_internal and not admin_user then raise exception 'Admin access required for internal notes'; end if;
  if not admin_user and request_row.user_id <> auth.uid() then raise exception 'Request access denied'; end if;

  insert into public.order_support_messages(request_id,author_id,message,is_internal)
  values(p_request_id,auth.uid(),trim(p_message),p_is_internal) returning id into message_id;
  if admin_user and not p_is_internal then
    update public.order_support_requests set admin_reply=trim(p_message),replied_at=now(),updated_at=now() where id=p_request_id;
  end if;
  if admin_user then
    insert into public.admin_audit_log(actor_id,action,entity_table,entity_id,details)
    values(auth.uid(),case when p_is_internal then 'order_support_internal_note_added' else 'order_support_reply_added' end,
      'order_support_requests',p_request_id::text,jsonb_build_object('message_id',message_id));
  end if;
  return message_id;
end;
$$;
revoke all on function public.ibuzz_add_order_support_message(uuid,text,boolean) from public, anon;
grant execute on function public.ibuzz_add_order_support_message(uuid,text,boolean) to authenticated;

commit;