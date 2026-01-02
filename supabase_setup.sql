-- ============================================
-- QUESTIFY COMPLETE SCHEMA SETUP
-- ============================================

-- --------------------------------------------
-- CONFIGURATION
-- --------------------------------------------
SET search_path TO public, extensions; 

-- 1. Setup & Permissions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA extensions;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- --------------------------------------------
-- 2. Create Tables & Ensure Columns Exist
-- --------------------------------------------

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
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Ensure columns exist (in case table already existed with older schema)
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS theme_id UUID REFERENCES presentation_themes(id) ON DELETE SET NULL;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS last_presented_at TIMESTAMPTZ;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS current_slide INTEGER DEFAULT 0;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS show_results BOOLEAN DEFAULT FALSE;


-- Slides
CREATE TABLE IF NOT EXISTS slides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    type TEXT NOT NULL,
    options JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    elements JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    media_url TEXT,
    time_limit INT,
    correct_answer JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Ensure columns exist
ALTER TABLE slides ADD COLUMN IF NOT EXISTS elements JSONB DEFAULT '{}'::jsonb;
ALTER TABLE slides ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE slides ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE slides ADD COLUMN IF NOT EXISTS time_limit INT;
ALTER TABLE slides ADD COLUMN IF NOT EXISTS correct_answer JSONB;


-- Responses
CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    presentation_id UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
    slide_id UUID NOT NULL REFERENCES slides(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    user_name TEXT,
    response_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    response_time INT,
    is_correct BOOLEAN,
    points INT,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Ensure columns exist - THIS IS LIKELY THE FIX for "column session_id does not exist"
ALTER TABLE responses ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS response_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS response_time INT;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS is_correct BOOLEAN;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS points INT;

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
  role text NOT NULL, -- 'owner', 'editor', 'viewer'
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


-- --------------------------------------------
-- 3. Indexes
-- --------------------------------------------
CREATE INDEX IF NOT EXISTS idx_presentations_user_id ON presentations(user_id);
CREATE INDEX IF NOT EXISTS idx_presentations_code ON presentations(code);
CREATE INDEX IF NOT EXISTS idx_slides_presentation_id ON slides(presentation_id);
CREATE INDEX IF NOT EXISTS idx_responses_presentation ON responses(presentation_id);
CREATE INDEX IF NOT EXISTS idx_responses_slide ON responses(slide_id);
-- This index caused the error if session_id didn't exist
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON responses(session_id);

CREATE INDEX IF NOT EXISTS idx_socket_sessions_presentation_id ON socket_sessions(presentation_id);
CREATE INDEX IF NOT EXISTS idx_socket_sessions_socket_id ON socket_sessions(socket_id);
CREATE INDEX IF NOT EXISTS idx_presentation_rooms_code ON presentation_rooms(room_code);

CREATE INDEX IF NOT EXISTS idx_qa_questions_slide_id ON qa_questions(slide_id);
CREATE INDEX IF NOT EXISTS idx_qa_questions_presentation_id ON qa_questions(presentation_id);
CREATE INDEX IF NOT EXISTS idx_qa_upvotes_question_id ON qa_upvotes(question_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_presentation_id ON analytics_events(presentation_id);

-- Themes unique names per scope
CREATE UNIQUE INDEX IF NOT EXISTS idx_presentation_themes_name_default ON presentation_themes(name) WHERE user_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_presentation_themes_name_user ON presentation_themes(name, user_id) WHERE user_id IS NOT NULL;


-- --------------------------------------------
-- 4. Triggers and Helper Functions
-- --------------------------------------------

-- Helper Function: Set Updated At
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Set Updated At Trigger
CREATE OR REPLACE TRIGGER trg_presentations_updated_at BEFORE UPDATE ON presentations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_slides_updated_at BEFORE UPDATE ON slides FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_socket_sessions_updated_at BEFORE UPDATE ON socket_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_presentation_rooms_updated_at BEFORE UPDATE ON presentation_rooms FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Helper Function: Cleanup Inactive Sessions
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM socket_sessions
  WHERE last_activity < now() - interval '1 hour'
  OR is_active = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function: Get Presentation Analytics
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

-- Helper Function: Toggle QA Answered
CREATE OR REPLACE FUNCTION toggle_qa_answered(p_question_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE qa_questions 
  SET is_answered = NOT is_answered 
  WHERE id = p_question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function: Increment QA Upvotes
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

-- Helper Function: Get Top QA Questions
CREATE OR REPLACE FUNCTION get_top_qa_questions(p_slide_id uuid, p_limit int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  question text,
  user_name text,
  upvotes int,
  is_answered boolean,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT q.id, q.question, q.user_name, q.upvotes, q.is_answered, q.created_at
  FROM qa_questions q
  WHERE q.slide_id = p_slide_id
  ORDER BY q.upvotes DESC, q.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function: Get Presentation Full
CREATE OR REPLACE FUNCTION get_presentation_full(p_presentation_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'presentation', row_to_json(p.*),
    'slides', (SELECT COALESCE(jsonb_agg(row_to_json(s.*) ORDER BY s."order"), '[]'::jsonb) FROM slides s WHERE s.presentation_id = p_presentation_id),
    'room', (SELECT row_to_json(pr.*) FROM presentation_rooms pr WHERE pr.presentation_id = p_presentation_id),
    'analytics', get_presentation_analytics(p_presentation_id)
  ) INTO result
  FROM presentations p
  WHERE p.id = p_presentation_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function: Get Presentation By Code (For Participants)
CREATE OR REPLACE FUNCTION get_presentation_by_code(p_code text)
RETURNS TABLE (
  id uuid,
  title text,
  code text,
  slides json
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.code,
    json_agg(
      json_build_object(
        'id', s.id,
        'question', s.question,
        'type', s.type,
        'options', s.options,
        'order', s."order"
      ) ORDER BY s."order"
    ) as slides
  FROM presentations p
  LEFT JOIN slides s ON p.id = s.presentation_id
  WHERE p.code = p_code
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- --------------------------------------------
-- 5. RLS Policies
-- --------------------------------------------
-- Enable RLS
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

-- Basic Policies

-- Presentations
CREATE POLICY "Public read access" ON presentations FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON presentations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owner update" ON presentations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner delete" ON presentations FOR DELETE USING (auth.uid() = user_id);

-- Slides
CREATE POLICY "Public read access slides" ON slides FOR SELECT USING (true);
CREATE POLICY "Owner insert slides" ON slides FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM presentations WHERE id = presentation_id AND user_id = auth.uid()));
CREATE POLICY "Owner update slides" ON slides FOR UPDATE USING (EXISTS (SELECT 1 FROM presentations WHERE id = presentation_id AND user_id = auth.uid()));
CREATE POLICY "Owner delete slides" ON slides FOR DELETE USING (EXISTS (SELECT 1 FROM presentations WHERE id = presentation_id AND user_id = auth.uid()));

-- Responses
CREATE POLICY "Public read responses" ON responses FOR SELECT USING (true);
CREATE POLICY "Public insert responses" ON responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Owner delete responses" ON responses FOR DELETE USING (EXISTS (SELECT 1 FROM presentations WHERE id = presentation_id AND user_id = auth.uid()));

-- Presentation Rooms
CREATE POLICY "Public read rooms" ON presentation_rooms FOR SELECT USING (true);
CREATE POLICY "Owner manage rooms" ON presentation_rooms FOR ALL USING (EXISTS (SELECT 1 FROM presentations WHERE id = presentation_id AND user_id = auth.uid()));

-- Socket Sessions
CREATE POLICY "Users can manage own session" ON socket_sessions FOR ALL USING (auth.uid() = user_id OR user_id IS NULL OR socket_id = current_setting('request.headers', true)::json->>'x-socket-id' OR true); 

-- QA Questions/Upvotes
CREATE POLICY "Public all qa" ON qa_questions FOR ALL USING (true);
CREATE POLICY "Public all upvotes" ON qa_upvotes FOR ALL USING (true);

-- Themes
CREATE POLICY "Public read themes" ON presentation_themes FOR SELECT USING (true);
CREATE POLICY "Owner manage themes" ON presentation_themes FOR ALL USING (auth.uid() = user_id);


-- --------------------------------------------
-- 6. Seed Data (Themes)
-- --------------------------------------------
INSERT INTO presentation_themes (name, colors, fonts, is_public)
SELECT 'Mentimeter Classic', '{"primary": "#007AFF", "secondary": "#5856D6", "background": "#FFFFFF", "text": "#000000"}'::jsonb, '{"heading": "Inter", "body": "Inter"}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM presentation_themes WHERE name = 'Mentimeter Classic' AND user_id IS NULL);

INSERT INTO presentation_themes (name, colors, fonts, is_public)
SELECT 'Dark Mode', '{"primary": "#0A84FF", "secondary": "#5E5CE6", "background": "#1C1C1E", "text": "#FFFFFF"}'::jsonb, '{"heading": "Inter", "body": "Inter"}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM presentation_themes WHERE name = 'Dark Mode' AND user_id IS NULL);

INSERT INTO presentation_themes (name, colors, fonts, is_public)
SELECT 'Vibrant Green', '{"primary": "#34C759", "secondary": "#30D158", "background": "#FFFFFF", "text": "#000000"}'::jsonb, '{"heading": "Inter", "body": "Inter"}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM presentation_themes WHERE name = 'Vibrant Green' AND user_id IS NULL);
