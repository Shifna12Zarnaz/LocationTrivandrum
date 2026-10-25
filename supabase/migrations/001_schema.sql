-- Location Restaurant. Schema + RLS. Run once in Supabase SQL editor.
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text, role text not null default 'admin' check (role in ('owner','admin')),
  created_at timestamptz not null default now()
);
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.restaurant_settings (
  id smallint primary key default 1 check (id = 1),
  name text not null default 'Location Restaurant',
  tagline text, logo_key text, favicon_key text, story text, phone text, whatsapp text,
  address text, hours text, instagram text, maps_url text, seo_description text,
  timezone text not null default 'Asia/Dubai', currency text not null default '',
  allow_multiple_specials boolean not null default false,
  show_offers_nav boolean not null default true, show_story_nav boolean not null default true, show_contact_nav boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.restaurant_settings (id) values (1) on conflict do nothing;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug text not null unique, description text, image_key text, icon text,
  sort_order integer not null default 0, is_active boolean not null default true,
  archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null check (length(trim(name)) > 0), description text,
  price numeric(10,2) not null check (price >= 0), currency text,
  image_key text, is_veg boolean not null default false, is_available boolean not null default true,
  is_published boolean not null default true, is_bestseller boolean not null default false, is_new boolean not null default false,
  spice_level smallint not null default 0 check (spice_level between 0 and 3),
  allergens text[] not null default '{}', dietary text[] not null default '{}',
  variants jsonb not null default '[]' check (jsonb_typeof(variants) = 'array'),
  sort_order integer not null default 0, archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.daily_specials (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.menu_items(id) on delete cascade,
  special_date date not null, start_time time, end_time time, promo_text text,
  is_active boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (start_time is null or end_time is null or end_time > start_time)
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0), description text, discount_label text, terms text, image_key text,
  starts_at timestamptz, ends_at timestamptz,
  link_section text not null default 'menu' check (link_section in ('menu','offers','special')),
  category_id uuid references public.categories(id) on delete set null,
  item_id uuid references public.menu_items(id) on delete set null, link_url text,
  is_active boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (starts_at is null or ends_at is null or ends_at > starts_at)
);

create table public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  heading text not null check (length(trim(heading)) > 0), subtitle text, cta_text text, image_key text,
  link_section text not null default 'menu' check (link_section in ('menu','offers','special')),
  category_id uuid references public.categories(id) on delete set null,
  item_id uuid references public.menu_items(id) on delete set null, link_url text,
  is_active boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.images (
  id uuid primary key default gen_random_uuid(),
  object_key text not null unique, content_type text not null, size_bytes integer not null, folder text,
  status text not null default 'pending' check (status in ('pending','active')),
  uploaded_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);

create trigger t_upd before update on public.restaurant_settings for each row execute function public.set_updated_at();
create trigger t_upd before update on public.categories for each row execute function public.set_updated_at();
create trigger t_upd before update on public.menu_items for each row execute function public.set_updated_at();
create trigger t_upd before update on public.daily_specials for each row execute function public.set_updated_at();
create trigger t_upd before update on public.offers for each row execute function public.set_updated_at();
create trigger t_upd before update on public.hero_slides for each row execute function public.set_updated_at();

create index on public.categories (sort_order) where archived_at is null;
create index on public.menu_items (category_id) where archived_at is null;
create index on public.menu_items (is_published, sort_order) where archived_at is null;
create index on public.menu_items (is_bestseller) where is_published and archived_at is null;
create index on public.daily_specials (special_date, is_active);
create index on public.daily_specials (item_id);
create index on public.offers (is_active, starts_at, ends_at);
create index on public.hero_slides (is_active, sort_order);
create index on public.images (status, created_at);

alter table public.admins enable row level security;
alter table public.restaurant_settings enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.daily_specials enable row level security;
alter table public.offers enable row level security;
alter table public.hero_slides enable row level security;
alter table public.images enable row level security;

-- Public read: published content only. Admin: everything.
create policy pub_read on public.restaurant_settings for select to anon, authenticated using (true);
create policy pub_read on public.categories for select to anon, authenticated using (is_active and archived_at is null);
create policy pub_read on public.menu_items for select to anon, authenticated using (is_published and archived_at is null);
create policy pub_read on public.daily_specials for select to anon, authenticated using (is_active);
create policy pub_read on public.offers for select to anon, authenticated using (is_active);
create policy pub_read on public.hero_slides for select to anon, authenticated using (is_active);
create policy adm_all on public.restaurant_settings for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy adm_all on public.categories for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy adm_all on public.menu_items for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy adm_all on public.daily_specials for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy adm_all on public.offers for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy adm_all on public.hero_slides for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy adm_all on public.images for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy adm_read on public.admins for select to authenticated using ((select public.is_admin()) or user_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select on public.restaurant_settings, public.categories, public.menu_items, public.daily_specials, public.offers, public.hero_slides to anon;
grant select, insert, update, delete on public.restaurant_settings, public.categories, public.menu_items, public.daily_specials, public.offers, public.hero_slides, public.images to authenticated;
grant select on public.admins to authenticated;
-- Admin add/remove goes through the server (service role) only. No write grants on admins.
