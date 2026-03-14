-- Vertical Slice 9: groups + memberships + join requests + group posts support
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  privacy TEXT NOT NULL CHECK (privacy IN ('public', 'private')),
  creator_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  location TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  status TEXT NOT NULL CHECK (status IN ('active')) DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.group_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL
);

-- Prevent duplicate active requests per user/group
CREATE UNIQUE INDEX IF NOT EXISTS idx_group_join_requests_pending_unique
  ON public.group_join_requests (group_id, user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_groups_privacy ON public.groups (privacy);
CREATE INDEX IF NOT EXISTS idx_groups_creator ON public.groups (creator_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members (user_id);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_group_status ON public.group_join_requests (group_id, status);

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_posts_group_created_at ON public.posts (group_id, created_at DESC);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "groups selectable by authenticated" ON public.groups;
CREATE POLICY "groups selectable by authenticated"
ON public.groups FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "groups insert by authenticated" ON public.groups;
CREATE POLICY "groups insert by authenticated"
ON public.groups FOR INSERT TO authenticated
WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "groups update by admin" ON public.groups;
CREATE POLICY "groups update by admin"
ON public.groups FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = groups.id
      AND gm.user_id = auth.uid()
      AND gm.status = 'active'
      AND gm.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = groups.id
      AND gm.user_id = auth.uid()
      AND gm.status = 'active'
      AND gm.role IN ('owner', 'admin')
  )
);

DROP POLICY IF EXISTS "group members selectable by authenticated" ON public.group_members;
CREATE POLICY "group members selectable by authenticated"
ON public.group_members FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "group members insert self" ON public.group_members;
CREATE POLICY "group members insert self"
ON public.group_members FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "group members update by admin" ON public.group_members;
CREATE POLICY "group members update by admin"
ON public.group_members FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.status = 'active'
      AND gm.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.status = 'active'
      AND gm.role IN ('owner', 'admin')
  )
);

DROP POLICY IF EXISTS "group join requests selectable" ON public.group_join_requests;
CREATE POLICY "group join requests selectable"
ON public.group_join_requests FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = group_join_requests.group_id
      AND gm.user_id = auth.uid()
      AND gm.status = 'active'
      AND gm.role IN ('owner', 'admin')
  )
);

DROP POLICY IF EXISTS "group join requests insert self" ON public.group_join_requests;
CREATE POLICY "group join requests insert self"
ON public.group_join_requests FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "group join requests update by admin" ON public.group_join_requests;
CREATE POLICY "group join requests update by admin"
ON public.group_join_requests FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = group_join_requests.group_id
      AND gm.user_id = auth.uid()
      AND gm.status = 'active'
      AND gm.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = group_join_requests.group_id
      AND gm.user_id = auth.uid()
      AND gm.status = 'active'
      AND gm.role IN ('owner', 'admin')
  )
);
