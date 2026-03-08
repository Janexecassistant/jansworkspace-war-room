-- War Room data tables

create table if not exists public.war_room_agents (
  id text primary key,
  name text not null,
  status text not null default 'idle',
  directive text,
  progress numeric default 0,
  checkpoint text,
  stream text not null default 'Ops',
  icon text default '⚙️',
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.war_room_objectives (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  owner text not null,
  stream text not null default 'Product',
  status text not null default 'Next',
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.war_room_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default timezone('utc', now()),
  agent text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists war_room_events_occurred_at_idx on public.war_room_events (occurred_at desc);
