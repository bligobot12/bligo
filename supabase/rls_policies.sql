drop policy if exists "profiles selectable by all auth users" on public.profiles;
create policy "profiles selectable by all auth users" on public.profiles
for select to authenticated using (true);

drop policy if exists "profiles insert self" on public.profiles;
create policy "profiles insert self" on public.profiles
for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles
for update to authenticated using (auth.uid() = id);

drop policy if exists "posts select all auth" on public.posts;
create policy "posts select all auth" on public.posts
for select to authenticated using (true);

drop policy if exists "posts insert self" on public.posts;
create policy "posts insert self" on public.posts
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "posts delete self" on public.posts;
create policy "posts delete self" on public.posts
for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "members select own memberships" on public.conversation_members;
create policy "members select own memberships" on public.conversation_members
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "members insert self" on public.conversation_members;
create policy "members insert self" on public.conversation_members
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "messages select where member" on public.messages;
create policy "messages select where member" on public.messages
for select to authenticated using (
 exists (
 select 1 from public.conversation_members cm
 where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()
 )
);

drop policy if exists "messages insert as sender member" on public.messages;
create policy "messages insert as sender member" on public.messages
for insert to authenticated with check (
 auth.uid() = sender_id and exists (
 select 1 from public.conversation_members cm
 where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()
 )
);

drop policy if exists "bot select self" on public.bot_connections;
create policy "bot select self" on public.bot_connections
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "bot upsert self" on public.bot_connections;
create policy "bot upsert self" on public.bot_connections
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "bot update self" on public.bot_connections;
create policy "bot update self" on public.bot_connections
for update to authenticated using (auth.uid() = user_id);

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
on storage.objects for select
to public
using (bucket_id = 'avatars');

drop policy if exists "avatars upload own folder" on storage.objects;
create policy "avatars upload own folder"
on storage.objects for insert
to authenticated
with check (
bucket_id = 'avatars'
and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars update own folder" on storage.objects;
create policy "avatars update own folder"
on storage.objects for update
to authenticated
using (
bucket_id = 'avatars'
and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
bucket_id = 'avatars'
and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars delete own folder" on storage.objects;
create policy "avatars delete own folder"
on storage.objects for delete
to authenticated
using (
bucket_id = 'avatars'
and (storage.foldername(name))[1] = auth.uid()::text
);
-- Vertical Slice 3: conversations + messages policies (recursion-safe)

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

-- conversation_members policies (avoid self-referential recursion)
alter table public.conversation_members enable row level security;

drop policy if exists "members select own memberships" on public.conversation_members;
drop policy if exists "members insert self" on public.conversation_members;
drop policy if exists "members select in own conversations" on public.conversation_members;
drop policy if exists "members insert by self or convo-member" on public.conversation_members;

drop policy if exists "members insert auth" on public.conversation_members;
create policy "members insert auth"
on public.conversation_members
for insert to authenticated
with check (true);

create policy "members insert auth"
on public.conversation_members
for insert to authenticated
with check (true);

-- messages policies
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