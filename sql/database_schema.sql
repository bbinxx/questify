-- ============================================
-- QUESTIFY COMPLETE DATABASE SCHEMA v2.0
-- Unified setup file with all improvements
-- ============================================
-- USAGE:
--   Option 1 (Fresh Install): Run entire file
--   Option 2 (Reset): Uncomment RESET section first, then run all
--   Option 3 (Upgrade): Run only from "IMPROVEMENTS" section
-- ============================================

-- ============================================
-- SECTION 1: RESET (OPTIONAL - DESTROYS ALL DATA!)
-- ============================================
-- Uncomment below ONLY if you want to completely reset the database
/*
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
*/

-- ============================================
-- SECTION 2: PERMISSIONS & EXTENSIONS
-- ============================================
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Install required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA extensions;

-- Grant on all existing objects
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- ============================================
-- SECTION 3: CORE TABLES
-- ============================================

-- Presentation Themes
CREATE TABLE IF NOT EXISTS presentation_themes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  colors jsonb NOT NULL,
  fonts jsonb,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) UNIQUE,
  display_name text,
  avatar_url text,
  default_theme jsonb,
  created_at timestamptz DEFAULT now()
);

-- Presentations
CREATE TABLE IF NOT EXISTS presentations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  code TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}'::jsonb,
  theme_id UUID REFERENCES presentation_themes(id) ON DELETE SET NULL,
  is_template BOOLEAN DEFAULT FALSE,
  last_presented_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  current_slide INTEGER DEFAULT 0,
  show_results BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ, -- Soft delete support
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Slides
CREATE TABLE IF NOT EXISTS slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  type TEXT NOT NULL CHECK (
    type IN ('choice', 'word_cloud', 'text', 'question_only', 'scale', 'ranking', 'qa', 'quiz', 'guess_number',
             'single_choice', 'multiple_choice') -- Legacy types for backward compatibility
  ),
  options JSONB,
  "order" INTEGER NOT NULL DEFAULT 0,
  elements JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  media_url TEXT,
  time_limit INT,
  correct_answer JSONB,
  deleted_at TIMESTAMPTZ, -- Soft delete support
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Presentation Sessions (NEW - Better session management)
CREATE TABLE IF NOT EXISTS presentation_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id uuid NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  session_code text UNIQUE NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  total_participants int DEFAULT 0,
  total_responses int DEFAULT 0,
  session_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Responses
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  slide_id UUID NOT NULL REFERENCES slides(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  presentation_session_id uuid REFERENCES presentation_sessions(id) ON DELETE CASCADE, -- Link to session
  user_name TEXT,
  response_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_time INT,
  is_correct BOOLEAN,
  points INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Archived Responses (for completed sessions)
CREATE TABLE IF NOT EXISTS archived_responses (
  id UUID PRIMARY KEY,
  presentation_id UUID,
  slide_id UUID,
  user_id UUID,
  session_id TEXT,
  presentation_session_id uuid,
  user_name TEXT,
  response_data JSONB,
  response_time INT,
  is_correct BOOLEAN,
  points INT,
  created_at TIMESTAMPTZ,
  archived_at timestamptz DEFAULT now()
);

-- Socket Sessions
CREATE TABLE IF NOT EXISTS socket_sessions (
  id uuid primary key default uuid_generate_v4(),
  socket_id text not null unique,
  user_id uuid references auth.users(id) on delete cascade,
  presentation_id uuid references presentations(id) on delete cascade,
  user_name text,
  user_role text check (user_role in ('presenter', 'participant')) default 'participant',
  is_active boolean default true,
  joined_at timestamptz default now(),
  last_activity timestamptz default now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Presentation Rooms
CREATE TABLE IF NOT EXISTS presentation_rooms (
  id uuid primary key default uuid_generate_v4(),
  presentation_id uuid references presentations(id) on delete cascade unique,
  room_code text unique,
  is_active boolean default true,
  current_slide_index integer default 0,
  show_results boolean default false,
  presenter_socket_id text,
  participant_count integer default 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Socket Events
CREATE TABLE IF NOT EXISTS socket_events (
  id uuid primary key default uuid_generate_v4(),
  socket_id text,
  presentation_id uuid references presentations(id) on delete cascade,
  event_type text not null,
  event_data jsonb,
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Q&A Questions
CREATE TABLE IF NOT EXISTS qa_questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slide_id uuid REFERENCES slides(id) ON DELETE CASCADE,
  presentation_id uuid REFERENCES presentations(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  user_name text,
  question text NOT NULL,
  upvotes int DEFAULT 0,
  is_answered boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Q&A Upvotes
CREATE TABLE IF NOT EXISTS qa_upvotes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id uuid REFERENCES qa_questions(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(question_id, session_id)
);

-- Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id uuid REFERENCES presentations(id) ON DELETE CASCADE,
  slide_id uuid REFERENCES slides(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb,
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- Presentation Collaborators
CREATE TABLE IF NOT EXISTS presentation_collaborators (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id uuid REFERENCES presentations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  role text NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(presentation_id, user_id)
);

-- Media Uploads
CREATE TABLE IF NOT EXISTS presentation_media (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id uuid REFERENCES presentations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size int,
  created_at timestamptz DEFAULT now()
);

-- Audit Log (NEW - Track important changes)
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  user_id uuid,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- SECTION 4: INDEXES (Performance Optimized)
-- ============================================

-- Presentations
CREATE INDEX IF NOT EXISTS idx_presentations_user_id ON presentations(user_id);
CREATE INDEX IF NOT EXISTS idx_presentations_code ON presentations(code);
CREATE INDEX IF NOT EXISTS idx_presentations_active ON presentations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_presentations_deleted ON presentations(deleted_at) WHERE deleted_at IS NULL;

-- Slides
CREATE INDEX IF NOT EXISTS idx_slides_presentation_id ON slides(presentation_id);
CREATE INDEX IF NOT EXISTS idx_slides_order ON slides(presentation_id, "order");
CREATE INDEX IF NOT EXISTS idx_slides_deleted ON slides(deleted_at) WHERE deleted_at IS NULL;

-- Responses
CREATE INDEX IF NOT EXISTS idx_responses_presentation ON responses(presentation_id);
CREATE INDEX IF NOT EXISTS idx_responses_slide ON responses(slide_id);
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_presentation_slide ON responses(presentation_id, slide_id);
CREATE INDEX IF NOT EXISTS idx_responses_session_slide ON responses(session_id, slide_id);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_responses_presentation_session ON responses(presentation_session_id);

-- Presentation Sessions
CREATE INDEX IF NOT EXISTS idx_presentation_sessions_presentation ON presentation_sessions(presentation_id);
CREATE INDEX IF NOT EXISTS idx_presentation_sessions_code ON presentation_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_presentation_sessions_active ON presentation_sessions(ended_at) WHERE ended_at IS NULL;

-- Socket Sessions
CREATE INDEX IF NOT EXISTS idx_socket_sessions_presentation_id ON socket_sessions(presentation_id);
CREATE INDEX IF NOT EXISTS idx_socket_sessions_socket_id ON socket_sessions(socket_id);
CREATE INDEX IF NOT EXISTS idx_socket_sessions_active ON socket_sessions(is_active, last_activity) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_socket_sessions_presentation_active ON socket_sessions(presentation_id) WHERE is_active = true;

-- Presentation Rooms
CREATE INDEX IF NOT EXISTS idx_presentation_rooms_code ON presentation_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_presentation_rooms_active ON presentation_rooms(is_active, updated_at) WHERE is_active = true;

-- Q&A
CREATE INDEX IF NOT EXISTS idx_qa_questions_slide_id ON qa_questions(slide_id);
CREATE INDEX IF NOT EXISTS idx_qa_questions_presentation_id ON qa_questions(presentation_id);
CREATE INDEX IF NOT EXISTS idx_qa_upvotes_question_id ON qa_upvotes(question_id);

-- Analytics
CREATE INDEX IF NOT EXISTS idx_analytics_events_presentation_id ON analytics_events(presentation_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Audit Log
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON audit_log(record_id);

-- Themes
CREATE UNIQUE INDEX IF NOT EXISTS idx_presentation_themes_name_default ON presentation_themes(name) WHERE user_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_presentation_themes_name_user ON presentation_themes(name, user_id) WHERE user_id IS NOT NULL;

-- ============================================
-- SECTION 5: MATERIALIZED VIEWS (Analytics)
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS slide_response_stats AS
SELECT
  s.id as slide_id,
  s.presentation_id,
  COUNT(DISTINCT r.session_id) as unique_participants,
  COUNT(r.id) as total_responses,
  AVG(r.response_time) as avg_response_time,
  jsonb_object_agg(
    COALESCE(r.response_data->>'value', 'null'),
    COUNT(*)
  ) FILTER (WHERE s.type IN ('choice', 'single_choice', 'multiple_choice')) as vote_distribution,
  MAX(r.created_at) as last_response_at
FROM slides s
LEFT JOIN responses r ON s.id = r.slide_id
GROUP BY s.id, s.presentation_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_slide_response_stats_slide ON slide_response_stats(slide_id);
CREATE INDEX IF NOT EXISTS idx_slide_response_stats_presentation ON slide_response_stats(presentation_id);

-- ============================================
-- SECTION 6: VIEWS
-- ============================================

CREATE OR REPLACE VIEW active_presentations AS
SELECT 
  p.*,
  COUNT(DISTINCT s.id) as slide_count,
  pr.participant_count,
  pr.current_slide_index,
  (SELECT COUNT(*) FROM responses r WHERE r.presentation_id = p.id) as total_responses
FROM presentations p
LEFT JOIN slides s ON p.id = s.presentation_id AND s.deleted_at IS NULL
LEFT JOIN presentation_rooms pr ON p.id = pr.presentation_id
WHERE p.deleted_at IS NULL
  AND p.is_active = true
GROUP BY p.id, pr.participant_count, pr.current_slide_index;

-- ============================================
-- SECTION 7: FUNCTIONS & TRIGGERS
-- ============================================

-- Helper: Set Updated At
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Updated At Triggers
CREATE OR REPLACE TRIGGER trg_presentations_updated_at BEFORE UPDATE ON presentations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_slides_updated_at BEFORE UPDATE ON slides FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_socket_sessions_updated_at BEFORE UPDATE ON socket_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_presentation_rooms_updated_at BEFORE UPDATE ON presentation_rooms FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_presentation_sessions_updated_at BEFORE UPDATE ON presentation_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Cleanup Functions
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS int AS $$
DECLARE
  rows_deleted int;
BEGIN
  DELETE FROM socket_sessions
  WHERE last_activity < now() - interval '24 hours'
  OR (is_active = false AND updated_at < now() - interval '1 hour');
  
  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  RETURN rows_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_orphaned_rooms()
RETURNS int AS $$
DECLARE
  rows_deleted int;
BEGIN
  DELETE FROM presentation_rooms pr
  WHERE NOT EXISTS (
    SELECT 1 FROM presentations p 
    WHERE p.id = pr.presentation_id
  )
  OR (is_active = false AND updated_at < now() - interval '1 hour');
  
  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  RETURN rows_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Archive Responses
CREATE OR REPLACE FUNCTION archive_session_responses(p_session_id uuid)
RETURNS int AS $$
DECLARE
  rows_archived int;
BEGIN
  WITH moved AS (
    DELETE FROM responses
    WHERE presentation_session_id = p_session_id
    RETURNING *
  )
  INSERT INTO archived_responses SELECT *, now() FROM moved;
  
  GET DIAGNOSTICS rows_archived = ROW_COUNT;
  RETURN rows_archived;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refresh Stats
CREATE OR REPLACE FUNCTION refresh_slide_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY slide_response_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Presentation Analytics
CREATE OR REPLACE FUNCTION get_presentation_analytics(p_presentation_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_responses', (SELECT COUNT(*) FROM responses WHERE presentation_id = p_presentation_id),
    'total_participants', (SELECT COUNT(DISTINCT session_id) FROM responses WHERE presentation_id = p_presentation_id),
    'avg_response_time', (SELECT COALESCE(AVG(response_time), 0) FROM responses WHERE presentation_id = p_presentation_id AND response_time IS NOT NULL),
    'total_qa_questions', (SELECT COUNT(*) FROM qa_questions WHERE presentation_id = p_presentation_id),
    'slides_data', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'slide_id', s.id,
          'question', s.question,
          'type', s.type,
          'response_count', (SELECT COUNT(*) FROM responses WHERE slide_id = s.id),
          'avg_time', (SELECT COALESCE(AVG(response_time), 0) FROM responses WHERE slide_id = s.id)
        ) ORDER BY s."order"
      ), '[]'::jsonb)
      FROM slides s WHERE s.presentation_id = p_presentation_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Q&A Functions
CREATE OR REPLACE FUNCTION toggle_qa_answered(p_question_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE qa_questions 
  SET is_answered = NOT is_answered 
  WHERE id = p_question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_qa_upvotes(p_question_id uuid, p_session_id text)
RETURNS boolean AS $$
DECLARE
  already_upvoted boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM qa_upvotes WHERE question_id = p_question_id AND session_id = p_session_id) INTO already_upvoted;
  
  IF already_upvoted THEN
    RETURN false;
  END IF;
  
  INSERT INTO qa_upvotes (question_id, session_id) VALUES (p_question_id, p_session_id);
  UPDATE qa_questions SET upvotes = upvotes + 1 WHERE id = p_question_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SECTION 8: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE socket_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE socket_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_media ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Public read access" ON presentations;
DROP POLICY IF EXISTS "Auth insert" ON presentations;
DROP POLICY IF EXISTS "Owner update" ON presentations;  
DROP POLICY IF EXISTS "Owner delete" ON presentations;
DROP POLICY IF EXISTS "Public read access slides" ON slides;
DROP POLICY IF EXISTS "Owner insert slides" ON slides;
DROP POLICY IF EXISTS "Owner update slides" ON slides;
DROP POLICY IF EXISTS "Owner delete slides" ON slides;

-- Presentations Policies
CREATE POLICY "presentation_select" ON presentations 
  FOR SELECT USING (
    (is_public = true AND deleted_at IS NULL)
    OR user_id = auth.uid()
  );

CREATE POLICY "presentation_insert" ON presentations 
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = user_id
  );

CREATE POLICY "presentation_update" ON presentations 
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM presentation_collaborators 
      WHERE presentation_id = id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'editor')
    )
  );

CREATE POLICY "presentation_delete" ON presentations 
  FOR DELETE USING (auth.uid() = user_id);

-- Slides Policies
CREATE POLICY "slides_select" ON slides 
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "slides_insert" ON slides 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM presentations WHERE id = presentation_id AND user_id = auth.uid())
  );

CREATE POLICY "slides_update" ON slides 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM presentations WHERE id = presentation_id AND user_id = auth.uid())
  );

CREATE POLICY "slides_delete" ON slides 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM presentations WHERE id = presentation_id AND user_id = auth.uid())
  );

-- Responses Policies
CREATE POLICY "Public read responses" ON responses FOR SELECT USING (true);
CREATE POLICY "Public insert responses" ON responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Owner delete responses" ON responses FOR DELETE USING (
  EXISTS (SELECT 1 FROM presentations WHERE id = presentation_id AND user_id = auth.uid())
);

-- Presentation Rooms
CREATE POLICY "Public read rooms" ON presentation_rooms FOR SELECT USING (true);
CREATE POLICY "Owner manage rooms" ON presentation_rooms FOR ALL USING (
  EXISTS (SELECT 1 FROM presentations WHERE id = presentation_id AND user_id = auth.uid())
);

-- Socket Sessions
CREATE POLICY "Users manage own session" ON socket_sessions FOR ALL USING (true);

-- Q&A
CREATE POLICY "Public all qa" ON qa_questions FOR ALL USING (true);
CREATE POLICY "Public all upvotes" ON qa_upvotes FOR ALL USING (true);

-- Themes
CREATE POLICY "Public read themes" ON presentation_themes FOR SELECT USING (true);
CREATE POLICY "Owner manage themes" ON presentation_themes FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- SECTION 9: SEED DATA
-- ============================================

-- Default Themes
INSERT INTO presentation_themes (name, colors, fonts, is_public)
SELECT 'Mentimeter Classic', '{\"primary\": \"#007AFF\", \"secondary\": \"#5856D6\", \"background\": \"#FFFFFF\", \"text\": \"#000000\"}'::jsonb, '{\"heading\": \"Inter\", \"body\": \"Inter\"}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM presentation_themes WHERE name = 'Mentimeter Classic' AND user_id IS NULL);

INSERT INTO presentation_themes (name, colors, fonts, is_public)
SELECT 'Dark Mode', '{\"primary\": \"#0A84FF\", \"secondary\": \"#5E5CE6\", \"background\": \"#1C1C1E\", \"text\": \"#FFFFFF\"}'::jsonb, '{\"heading\": \"Inter\", \"body\": \"Inter\"}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM presentation_themes WHERE name = 'Dark Mode' AND user_id IS NULL);

INSERT INTO presentation_themes (name, colors, fonts, is_public)
SELECT 'Vibrant Green', '{\"primary\": \"#34C759\", \"secondary\": \"#30D158\", \"background\": \"#FFFFFF\", \"text\": \"#000000\"}'::jsonb, '{\"heading\": \"Inter\", \"body\": \"Inter\"}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM presentation_themes WHERE name = 'Vibrant Green' AND user_id IS NULL);

-- ============================================
-- SECTION 10: PERFORMANCE TUNING
-- ============================================

-- Analyze tables
ANALYZE presentations;
ANALYZE slides;
ANALYZE responses;
ANALYZE socket_sessions;
ANALYZE presentation_rooms;
ANALYZE presentation_sessions;

-- Add table/column comments
COMMENT ON SCHEMA public IS 'Questify v2.0 - Complete schema with improvements';
COMMENT ON TABLE presentation_sessions IS 'Tracks individual presentation sessions for analytics and response isolation';
COMMENT ON TABLE archived_responses IS 'Archived responses for completed sessions';
COMMENT ON TABLE audit_log IS 'Audit trail for important table changes';
COMMENT ON COLUMN presentations.deleted_at IS 'Soft delete timestamp - allows recovery';
COMMENT ON COLUMN responses.presentation_session_id IS 'Links response to specific presentation session';
COMMENT ON MATERIALIZED VIEW slide_response_stats IS 'Pre-aggregated stats for faster queries';
COMMENT ON VIEW active_presentations IS 'Active presentations with aggregated stats';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Questify schema v2.0 setup complete!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify tables: SELECT tablename FROM pg_tables WHERE schemaname = ''public'';';
  RAISE NOTICE '2. Refresh stats: SELECT refresh_slide_stats();';
  RAISE NOTICE '3. Test connection from your app';
END $$;
