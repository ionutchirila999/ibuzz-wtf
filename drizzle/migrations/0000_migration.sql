create type public.app_role as enum ('admin','user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

-- First account ever created becomes the shop owner (admin)
create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_role after insert on auth.users
for each row execute function public.handle_new_user_role();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('technology','womens_shoes')),
  subcategory text not null,
  title text not null,
  brand text,
  model text,
  description text,
  images text[] not null default '{}',
  price numeric(12,2) not null default 0,
  negotiable boolean not null default false,
  stock integer not null default 1,
  condition text not null default 'pre_owned' check (condition in ('new','pre_owned','refurbished')),
  shoe_size text,
  size_system text,
  color text,
  material text,
  authenticity_verified boolean not null default false,
  authenticity_notes text,
  delivery_options text,
  return_policy text,
  is_demo boolean not null default false,
  status text not null default 'available' check (status in ('available','sold','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "public reads visible" on public.products for select to anon, authenticated using (status <> 'hidden');
create policy "admin reads all" on public.products for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin inserts" on public.products for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin updates" on public.products for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin deletes" on public.products for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.product_costs (
  product_id uuid primary key references public.products(id) on delete cascade,
  purchase_cost numeric(12,2) not null default 0,
  repair_cost numeric(12,2) not null default 0,
  shipping_cost numeric(12,2) not null default 0,
  platform_fees numeric(12,2) not null default 0,
  other_expenses numeric(12,2) not null default 0,
  fault_notes text,
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.product_costs to authenticated;
grant all on public.product_costs to service_role;
alter table public.product_costs enable row level security;
create policy "admin all costs" on public.product_costs for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.resale_offers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  category text not null check (category in ('technology','womens_shoes')),
  item_description text not null,
  condition_notes text,
  asking_price numeric(12,2),
  status text not null default 'new' check (status in ('new','contacted','closed')),
  created_at timestamptz not null default now()
);
grant insert on public.resale_offers to anon, authenticated;
grant select, update, delete on public.resale_offers to authenticated;
grant all on public.resale_offers to service_role;
alter table public.resale_offers enable row level security;
create policy "anyone submits" on public.resale_offers for insert to anon, authenticated with check (status = 'new');
create policy "admin reads offers" on public.resale_offers for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin updates offers" on public.resale_offers for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin deletes offers" on public.resale_offers for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- Product image storage policies (bucket created separately)
create policy "public read product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "admin upload product images" on storage.objects for insert to authenticated with check (bucket_id='product-images' and public.has_role(auth.uid(),'admin'));
create policy "admin delete product images" on storage.objects for delete to authenticated using (bucket_id='product-images' and public.has_role(auth.uid(),'admin'));