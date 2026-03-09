-- Task 2: posts + searches schema
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS posts (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
 content TEXT NOT NULL,
 post_type TEXT DEFAULT 'intent',
 visibility TEXT DEFAULT 'connections',
 signals JSONB DEFAULT '[]'::jsonb,
 created_at TIMESTAMPTZ DEFAULT now(),
 updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS searches (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
 query TEXT NOT NULL,
 results JSONB DEFAULT '[]'::jsonb,
 created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_notifications TIMESTAMPTZ;

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read public posts" ON posts;
CREATE POLICY "Users can read public posts" ON posts
 FOR SELECT USING (visibility = 'public' OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own posts" ON posts;
CREATE POLICY "Users can insert own posts" ON posts
 FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts" ON posts
 FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts" ON posts
 FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can read own searches" ON searches;
CREATE POLICY "Users can read own searches" ON searches
 FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own searches" ON searches;
CREATE POLICY "Users can insert own searches" ON searches
 FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_posts_user_created_at ON posts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_searches_user_created_at ON searches (user_id, created_at DESC);
