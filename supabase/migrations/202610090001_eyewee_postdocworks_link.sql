-- Opt-in link between an eyewee device and a real postdocworks account (docs/DEVELOPMENT_PLAN.md
-- §10). A postdoc who wants eyewee to see their real PostdocWorks profile/papers clicks "Connect"
-- and authenticates through postdocworks itself (lib/postdocworksLink/token.ts verifies a signed,
-- short-lived token postdocworks mints for its own logged-in user -- eyewee never sees a
-- postdocworks password or session). Nothing changes for a device that never connects. Read-only
-- on eyewee's side: see lib/eyewee/postdocworks/profile.ts -- this table only ever stores the
-- link itself, never a copy of postdocworks' data.

create table if not exists public.eyewee_device_postdocworks_link (
  device_id uuid primary key,
  postdocworks_user_id uuid not null,
  connected_at timestamptz not null default now()
);

create index if not exists eyewee_device_postdocworks_link_user_idx
  on public.eyewee_device_postdocworks_link (postdocworks_user_id);

alter table public.eyewee_device_postdocworks_link enable row level security;
revoke all on public.eyewee_device_postdocworks_link from anon, authenticated;
