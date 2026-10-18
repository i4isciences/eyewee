-- Records that a device explicitly agreed to the Terms of Service and Privacy Policy before its
-- first chat (pre-launch checklist, 2026-10-18, item 4). No RLS -- same pattern as every other
-- eyewee_device_* table: the service-role client is the only thing that ever touches this, and
-- device_id is read from the server's own httpOnly cookie, never supplied by the client.
create table if not exists eyewee_device_consent (
  device_id text primary key,
  consented_at timestamptz not null default now()
);
