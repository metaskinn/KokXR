-- KökXR: Supabase şeması. SQL Editor'de bir kez, baştan sona çalıştırılır.
-- Yönetici/küratör yetkisi: auth.users.raw_app_meta_data içinde {"rol":"yonetici"} (en altta örnek).

create table if not exists public.eserler (
  id text primary key,
  veri jsonb not null,
  durum text not null default 'beklemede' check (durum in ('beklemede','onaylandi','reddedildi')),
  olusturan uuid references auth.users(id),
  guncelleme timestamptz not null default now()
);

create table if not exists public.gorseller (
  id uuid primary key default gen_random_uuid(),
  eser_id text not null references public.eserler(id) on delete cascade,
  yol text not null,
  alt text not null default '',
  kredi text not null default 'Fotoğraf: Vakıf Katılım, Vakıf Eserleri Envanter Projesi – Bursa Fotoğraf Arşivi',
  yukleyen uuid references auth.users(id),
  olusturma timestamptz not null default now()
);

create table if not exists public.katkilar (
  id uuid primary key default gen_random_uuid(),
  eser_id text references public.eserler(id) on delete cascade,
  baslik text not null,
  metin text not null,
  durum text not null default 'beklemede' check (durum in ('beklemede','onaylandi','reddedildi')),
  oneren uuid references auth.users(id),
  olusturma timestamptz not null default now()
);

create or replace function public.yonetici_mi() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'rol', '') = 'yonetici'
$$;

alter table public.eserler enable row level security;
alter table public.gorseller enable row level security;
alter table public.katkilar enable row level security;

-- Herkes yalnız onaylanmış eseri okur; yönetici hepsini.
create policy "eser oku" on public.eserler for select using (durum = 'onaylandi' or public.yonetici_mi() or olusturan = auth.uid());
create policy "eser ekle" on public.eserler for insert to authenticated with check (olusturan = auth.uid() and (durum = 'beklemede' or public.yonetici_mi()));
create policy "eser guncelle" on public.eserler for update to authenticated using (public.yonetici_mi() or (olusturan = auth.uid() and durum <> 'onaylandi')) with check (public.yonetici_mi() or durum = 'beklemede');
create policy "eser sil" on public.eserler for delete to authenticated using (public.yonetici_mi());

create policy "gorsel oku" on public.gorseller for select using (
  public.yonetici_mi() or exists (select 1 from public.eserler e where e.id = eser_id and e.durum = 'onaylandi'));
create policy "gorsel ekle" on public.gorseller for insert to authenticated with check (yukleyen = auth.uid());
create policy "gorsel sil" on public.gorseller for delete to authenticated using (public.yonetici_mi());

create policy "katki oku" on public.katkilar for select using (public.yonetici_mi() or oneren = auth.uid() or durum = 'onaylandi');
create policy "katki ekle" on public.katkilar for insert to authenticated with check (oneren = auth.uid() and durum = 'beklemede');
create policy "katki karar" on public.katkilar for update to authenticated using (public.yonetici_mi()) with check (public.yonetici_mi());

-- Görsel kovası (herkese okunur; yalnız giriş yapmış kullanıcı yükler).
insert into storage.buckets (id, name, public) values ('gorseller', 'gorseller', true) on conflict (id) do nothing;
create policy "kova oku" on storage.objects for select using (bucket_id = 'gorseller');
create policy "kova yukle" on storage.objects for insert to authenticated with check (bucket_id = 'gorseller');
create policy "kova sil" on storage.objects for delete to authenticated using (bucket_id = 'gorseller' and public.yonetici_mi());

-- Yönetici atama (e-postayı değiştirip çalıştırın):
-- update auth.users set raw_app_meta_data = raw_app_meta_data || '{"rol":"yonetici"}' where email = 'EPOSTA@ornek.com';
