-- eyewee is account-free (confirmed 2026-09-28 -- see docs/DEVELOPMENT_PLAN.md §9): no login, no
-- email, no password. The original `eyewee_conversations`/`eyewee_messages` tables
-- (202609170003_eyewee_conversations.sql) were built against an authenticated `auth.users` model
-- inherited from when eyewee was spec'd as living inside the accounts-based postdocworks app, and
-- were never wired to anything in this standalone repo -- they're orphaned. This migration does
-- NOT drop them (dropping tables on a shared Supabase project is a deliberate, separate call for a
-- human to make, not something to do inline here) -- it adds new, correctly-scoped tables instead.
--
-- The new key everywhere below is `device_id`: a random uuid minted per browser and stored in a
-- long-lived httpOnly cookie (lib/eyewee/session/deviceId.ts) -- not tied to an email or identity.
-- These tables carry no RLS policies for `anon`/`authenticated` at all -- on purpose. There is no
-- Supabase Auth session to key a policy on, so the trust boundary is entirely server-side: only
-- Next.js route handlers touch these tables, using the service-role key
-- (lib/eyewee/supabaseAdmin.ts), and every query is scoped to the calling request's own device_id
-- in application code. RLS is still enabled (defense in depth against a future policy mistake
-- accidentally exposing these to the anon/publishable key), it's just deliberately policy-less.

create table if not exists public.eyewee_device_conversations (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists eyewee_device_conversations_device_idx
  on public.eyewee_device_conversations (device_id, updated_at desc);

create table if not exists public.eyewee_device_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.eyewee_device_conversations(id) on delete cascade,
  sender public.eyewee_message_sender not null, -- reuses the enum from 202609170003
  text text not null check (char_length(text) between 1 and 8000),
  created_at timestamptz not null default now()
);

create index if not exists eyewee_device_messages_conversation_idx
  on public.eyewee_device_messages (conversation_id, created_at);

alter table public.eyewee_device_conversations enable row level security;
alter table public.eyewee_device_messages enable row level security;
revoke all on public.eyewee_device_conversations from anon, authenticated;
revoke all on public.eyewee_device_messages from anon, authenticated;

-- StorageConnection: a postdoc's own reconnected deposits (Zenodo/OSF/Dryad/Figshare) --
-- docs/DEVELOPMENT_PLAN.md §6.4. Distinct from the Leverage novelty-check (§6.9), which needs no
-- storage/account at all.
create type public.eyewee_storage_repository as enum ('zenodo', 'osf', 'dryad', 'figshare');

create table if not exists public.eyewee_device_storage_connections (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null,
  repository public.eyewee_storage_repository not null,
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  external_account_label text not null default '',
  connected_at timestamptz not null default now(),
  unique (device_id, repository)
);

alter table public.eyewee_device_storage_connections enable row level security;
revoke all on public.eyewee_device_storage_connections from anon, authenticated;

-- MemoryFact -- docs/DEVELOPMENT_PLAN.md §6.5. Schema only; the write path stays blocked on the
-- extraction-model product decision. `GET /api/memory` can ship against this table today (it'll
-- just return empty rows until that decision lands and a write path is built).
create table if not exists public.eyewee_device_memory_facts (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null,
  text text not null check (char_length(text) between 1 and 2000),
  category text not null check (category in ('field', 'focus', 'badge', 'preference', 'other')),
  source_conversation_id uuid references public.eyewee_device_conversations(id) on delete set null,
  created_at timestamptz not null default now(),
  last_referenced_at timestamptz
);

create index if not exists eyewee_device_memory_facts_device_idx
  on public.eyewee_device_memory_facts (device_id, created_at desc);

alter table public.eyewee_device_memory_facts enable row level security;
revoke all on public.eyewee_device_memory_facts from anon, authenticated;
