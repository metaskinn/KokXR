-- KökXR content schema (Neon Postgres). Applied by scripts/db-migrate.mjs; safe to run again.

-- One row per artifact. `published` is what visitors see; `draft` is a change waiting for curator approval.
-- New artifacts start with published = null and only appear on the site after approval.
create table if not exists artifacts (
  id          text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status      text not null check (status in ('pending', 'published', 'rejected')),
  published   jsonb,
  draft       jsonb,
  review_note text,
  updated_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (published is not null or draft is not null)
);
create index if not exists artifacts_status_idx on artifacts (status);

-- Every write is recorded: who (role), what, which artifact.
create table if not exists audit_log (
  id          bigserial primary key,
  artifact_id text not null,
  action      text not null check (action in ('seed', 'save', 'approve', 'reject', 'discard', 'delete', 'upload')),
  actor       text not null,
  note        text,
  at          timestamptz not null default now()
);
create index if not exists audit_log_at_idx on audit_log (at desc);

-- Files in the private "uploads" bucket (Neon Object Storage). The bytes live in the bucket; this row keeps the key.
-- Served through GET /api/media/<key> as a short-lived presigned URL.
create table if not exists media (
  key          text primary key,
  artifact_id  text,
  size         bigint not null,
  content_type text not null,
  etag         text,
  source       text not null default 'repo' check (source in ('repo', 'upload')),
  uploaded_at  timestamptz not null default now()
);
create index if not exists media_artifact_idx on media (artifact_id);

-- Printed inventories (Bursa 1-3, Konya 1-2, Hatay) and the facts read from their pages.
create table if not exists inventory (
  id          text primary key,
  name        text not null,
  district    text not null,
  section     text not null,
  volume      int  not null check (volume between 1 and 3),
  grp         text,
  artifact_id text,
  has_scale_model boolean not null default false
);
-- Migration: the inventory was Bursa-only; every row now names its city.
alter table inventory add column if not exists city text not null default 'Bursa';
create table if not exists inventory_details (
  id   text primary key references inventory (id) on delete cascade,
  data jsonb not null
);

-- Migration: allow the 'upload' action on tables created before image uploads existed.
alter table audit_log drop constraint if exists audit_log_action_check;
alter table audit_log add constraint audit_log_action_check check (action in ('seed', 'save', 'approve', 'reject', 'discard', 'delete', 'upload'));
