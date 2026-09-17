-- eyewee chat surface: conversations + messages.
-- Additive to the shared postdocworks Supabase project. Table names are prefixed `eyewee_` to
-- avoid any collision with `doc2postdoc_conversations`/`doc2postdoc_messages`, which are a
-- different feature (peer-to-peer postdoc messaging, not eyewee chat).
-- Reply generation for messages is a canned, pattern-matched responder (see app/api/conversations),
-- not a live model call -- the send-message-to-a-live-model path stays behind the crisis-response
-- hold described in docs/SPEC.md Section 2.1 until legal + mental-health-professional clearance.

create type public.eyewee_message_sender as enum ('user', 'eyewee');

create table if not exists public.eyewee_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.eyewee_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.eyewee_conversations(id) on delete cascade,
  sender public.eyewee_message_sender not null,
  text text not null check (char_length(text) between 1 and 8000),
  created_at timestamptz not null default now()
);

create index if not exists eyewee_conversations_user_idx on public.eyewee_conversations (user_id, updated_at desc);
create index if not exists eyewee_messages_conversation_idx on public.eyewee_messages (conversation_id, created_at);

alter table public.eyewee_conversations enable row level security;
alter table public.eyewee_messages enable row level security;

drop policy if exists "owners manage their own conversations" on public.eyewee_conversations;
create policy "owners manage their own conversations" on public.eyewee_conversations
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "owners read messages in their conversations" on public.eyewee_messages;
create policy "owners read messages in their conversations" on public.eyewee_messages
  for select to authenticated using (
    exists (select 1 from public.eyewee_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

-- No sender restriction here: the owning user's authenticated session is what the API route
-- itself uses to insert eyewee's canned reply (there is no separate model/service identity),
-- and ownership of the conversation is already the real gate.
drop policy if exists "owners insert messages in their conversations" on public.eyewee_messages;
create policy "owners insert messages in their conversations" on public.eyewee_messages
  for insert to authenticated with check (
    exists (select 1 from public.eyewee_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

grant select, insert, update, delete on public.eyewee_conversations to authenticated;
grant select, insert on public.eyewee_messages to authenticated;
