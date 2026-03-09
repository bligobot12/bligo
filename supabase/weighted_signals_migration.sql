-- Weighted signals schema for Bligo

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS signals JSONB DEFAULT '[]'::jsonb;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_tier INTEGER DEFAULT 1;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS clusters JSONB DEFAULT '[]'::jsonb;

ALTER TABLE match_candidates
ADD COLUMN IF NOT EXISTS score_breakdown JSONB DEFAULT '{}'::jsonb;
