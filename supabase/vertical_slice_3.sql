-- Vertical Slice 3: conversations + messages policies

-- conversations policies
alter table public.conversations enable row level security;

drop policy if exists "conversations insert auth" on public.conversations;
create policy "conversations insert auth" on public.conversations
for insert to authenticated
with check (true);

drop policy if exists "conversations select where member" on public.conversations;
create policy "conversations select where member" on public.conversations
for select to authenticated
using (
  exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = conversations.id
      and cm.user_id = auth.uid()
  )
);

-- conversation_members policies
alter table public.conversation_members enable row level security;

drop policy if exists "members select in own conversations" on public.conversation_members;
create policy "members select in own conversations" on public.conversation_members
for select to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = conversation_members.conversation_id
      and cm.user_id = auth.uid()
  )
);

drop policy if exists "members insert by self or convo-member" on public.conversation_members;
create policy "members insert by self or convo-member" on public.conversation_members
for insert to authenticated
with check (
  auth.uid() = user_id
  or exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = conversation_members.conversation_id
      and cm.user_id = auth.uid()
  )
);

-- messages policies (re-assert)
alter table public.messages enable row level security;

drop policy if exists "messages select where member" on public.messages;
create policy "messages select where member" on public.messages
for select to authenticated
using (
  exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id
      and cm.user_id = auth.uid()
  )
);

drop policy if exists "messages insert as sender member" on public.messages;
create policy "messages insert as sender member" on public.messages
for insert to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id
      and cm.user_id = auth.uid()
  )
);
