CREATE TABLE IF NOT EXISTS messages (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
 to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
 content TEXT NOT NULL,
 read BOOLEAN DEFAULT false,
 read_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own messages" ON messages;
CREATE POLICY "Users can read own messages" ON messages
 FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages
 FOR INSERT WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "Users can mark messages read" ON messages;
CREATE POLICY "Users can mark messages read" ON messages
 FOR UPDATE USING (auth.uid() = to_user_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (
 LEAST(from_user_id::text, to_user_id::text),
 GREATEST(from_user_id::text, to_user_id::text),
 created_at DESC
);

CREATE INDEX IF NOT EXISTS idx_messages_to_unread ON messages (to_user_id, read) WHERE read = false;
