begin;
create table if not exists public.expense_entries (
  id uuid primary key default gen_random_uuid(),
  category text not null check (length(trim(category)) between 2 and 80),
  description text not null check (length(trim(description)) between 2 and 500),
  amount numeric(12,2) not null check (amount >= 0),
  occurred_on date not null default current_date,
  product_id uuid references public.products(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists expense_entries_occurred_idx on public.expense_entries(occurred_on desc);
alter table public.expense_entries enable row level security;
drop policy if exists "Admins manage expense entries" on public.expense_entries;
create policy "Admins read expense entries" on public.expense_entries for select to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "Admins insert expense entries" on public.expense_entries for insert to authenticated with check (public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "Admins update expense entries" on public.expense_entries for update to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "Admins delete expense entries" on public.expense_entries for delete to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role));
create or replace function public.ibuzz_audit_expense_changes()
returns trigger language plpgsql security definer set search_path = public as $expense_audit$
begin
  insert into public.admin_audit_log(actor_id, action, entity_table, entity_id, details)
  values (auth.uid(), case when tg_op = 'INSERT' then 'expense_created' when tg_op = 'DELETE' then 'expense_deleted' else 'expense_updated' end,
    'expense_entries', coalesce(new.id, old.id)::text,
    jsonb_build_object('category', coalesce(new.category, old.category), 'amount', coalesce(new.amount, old.amount)));
  return coalesce(new, old);
end $expense_audit$;
drop trigger if exists ibuzz_expense_audit on public.expense_entries;
create trigger ibuzz_expense_audit after insert or update or delete on public.expense_entries
for each row execute function public.ibuzz_audit_expense_changes();
commit;