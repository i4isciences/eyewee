-- Pricing shape, per Ranjit (2026-10-08): free core (chat, badges, matching); role-based paid
-- tiers later (base: postdoc/PhD student, premium: faculty/PI/industry); paywall switches on
-- after usage habit forms, not at signup; which individual features get gated is NOT decided yet;
-- explicitly "don't build billing yet." This migration adds the two structural pieces asked for --
-- a tier field, and a feature-flag table -- without any billing, payment, or enforcement logic.
-- Device-scoped like the rest of eyewee's schema (see 202609280001) -- no accounts.

create table if not exists public.eyewee_device_profile (
  device_id uuid primary key,
  tier text not null default 'postdoc_base',
  created_at timestamptz not null default now()
);

alter table public.eyewee_device_profile enable row level security;
revoke all on public.eyewee_device_profile from anon, authenticated;

-- One row per feature that *could* be gated later. `gated` defaults to false for everything --
-- per Ranjit, nothing is actually paywalled yet. Flipping a feature to paid later is an UPDATE to
-- this table, not a schema migration or a code change.
create table if not exists public.eyewee_feature_flags (
  feature text primary key,
  gated boolean not null default false,
  required_tier text,
  updated_at timestamptz not null default now()
);

alter table public.eyewee_feature_flags enable row level security;
revoke all on public.eyewee_feature_flags from anon, authenticated;

insert into public.eyewee_feature_flags (feature, gated, required_tier) values
  ('voice', false, null),
  ('storage_connections', false, null),
  ('organize', false, null)
on conflict (feature) do nothing;
