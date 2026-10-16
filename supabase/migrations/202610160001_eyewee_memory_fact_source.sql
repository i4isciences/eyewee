-- Lets eyewee cleanly re-sync PostdocWorks/Doc2Postdoc-derived memory facts on reconnect, without
-- piling up duplicates or leaving stale ones behind: facts written by the sync get tagged
-- source='postdocworks', and a reconnect deletes exactly that tagged set before writing fresh
-- ones. Conversation-derived facts (the suggest-then-approve flow) keep source = null, untouched.
alter table public.eyewee_device_memory_facts add column if not exists source text;
