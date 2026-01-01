-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. presentations table
-- Combined from previous schema and 001_alter_presentations.sql
CREATE TABLE IF NOT EXISTS public.presentations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    code TEXT UNIQUE, -- Made unique, but not NOT NULL initially to allow for updates
    current_slide INTEGER DEFAULT 0,
    show_results BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT FALSE -- From 001_alter_presentations.sql
);

-- Add columns from 001_alter_presentations.sql if they don't exist
ALTER TABLE IF EXISTS public.presentations
  ADD COLUMN IF NOT EXISTS code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS current_slide INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS show_results BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();


-- 2. slides table
-- Assuming slides table was created elsewhere or needs to be created here
CREATE TABLE IF NOT EXISTS public.slides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    presentation_id UUID REFERENCES public.presentations(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    elements JSONB NOT NULL, -- Stores question, type, options, settings for the slide
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. responses table
-- Combined from previous schema and 002_create_responses.sql
CREATE TABLE IF NOT EXISTS public.responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
    slide_id UUID NOT NULL REFERENCES public.slides(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    option_index INTEGER, -- For multiple/single choice questions
    text_response TEXT,    -- For text questions
    word_cloud_response TEXT, -- For word cloud questions (stores the submitted words as a string)
    guess_response INTEGER,   -- For guess number questions
    created_at TIMESTAMPTZ DEFAULT now()
);

-- helpful indexes from 002_create_responses.sql
CREATE INDEX IF NOT EXISTS idx_responses_presentation ON public.responses(presentation_id);
CREATE INDEX IF NOT EXISTS idx_responses_slide ON public.responses(slide_id);


-- 4. socket_sessions table
-- From 004_socket_sessions.sql
CREATE TABLE IF NOT EXISTS public.socket_sessions (
  id uuid primary key default uuid_generate_v4(),
  socket_id text not null unique,
  user_id uuid references auth.users(id) on delete cascade,
  presentation_id uuid references public.presentations(id) on delete cascade,
  user_name text,
  user_role text check (user_role in ('presenter', 'participant')) default 'participant',
  is_active boolean default true,
  joined_at timestamptz default now(),
  last_activity timestamptz default now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_socket_sessions_presentation_id ON public.socket_sessions(presentation_id);
CREATE INDEX IF NOT EXISTS idx_socket_sessions_socket_id ON public.socket_sessions(socket_id);
CREATE INDEX IF NOT EXISTS idx_socket_sessions_user_id ON public.socket_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_socket_sessions_active ON public.socket_sessions(is_active);

-- 5. presentation_rooms table
-- From 004_socket_sessions.sql
CREATE TABLE IF NOT EXISTS public.presentation_rooms (
  id uuid primary key default uuid_generate_v4(),
  presentation_id uuid references public.presentations(id) on delete cascade unique,
  room_code text unique,
  is_active boolean default true,
  current_slide_index integer default 0,
  show_results boolean default false,
  presenter_socket_id text,
  participant_count integer default 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for room queries
CREATE INDEX IF NOT EXISTS idx_presentation_rooms_code ON public.presentation_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_presentation_rooms_active ON public.presentation_rooms(is_active);

-- 6. socket_events table
-- From 004_socket_sessions.sql
CREATE TABLE IF NOT EXISTS public.socket_events (
  id uuid primary key default uuid_generate_v4(),
  socket_id text,
  presentation_id uuid references public.presentations(id) on delete cascade,
  event_type text not null,
  event_data jsonb,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Index for events
CREATE INDEX IF NOT EXISTS idx_socket_events_presentation_id ON public.socket_events(presentation_id);
CREATE INDEX IF NOT EXISTS idx_socket_events_timestamp ON public.socket_events(timestamp);

-- Update triggers (from 001_alter_presentations.sql and 004_socket_sessions.sql)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
DROP TRIGGER IF EXISTS trg_presentations_updated_at ON public.presentations;
CREATE TRIGGER trg_presentations_updated_at
BEFORE UPDATE ON public.presentations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_slides_updated_at ON public.slides;
CREATE TRIGGER trg_slides_updated_at
BEFORE UPDATE ON public.slides
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_socket_sessions_updated_at ON public.socket_sessions;
CREATE TRIGGER trg_socket_sessions_updated_at
BEFORE UPDATE ON public.socket_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_presentation_rooms_updated_at ON public.presentation_rooms;
CREATE TRIGGER trg_presentation_rooms_updated_at
BEFORE UPDATE ON public.presentation_rooms
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Function to clean up inactive sessions (from 004_socket_sessions.sql)
CREATE OR REPLACE FUNCTION public.cleanup_inactive_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.socket_sessions
  WHERE last_activity < now() - interval '1 hour'
  OR is_active = false;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies (combined from 003_rls_policies.sql and 004_socket_sessions.sql)

-- Enable RLS for all tables
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.socket_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.socket_events ENABLE ROW LEVEL SECURITY;

-- RLS for presentations
-- More specific RLS for presentations (from previous comprehensive schema)
DROP POLICY IF EXISTS "Enable read access for all users on presentations" ON public.presentations;
CREATE POLICY "Enable read access for all users on presentations"
  ON public.presentations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only on presentations" ON public.presentations;
CREATE POLICY "Enable insert for authenticated users only on presentations"
  ON public.presentations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for users based on user_id on presentations" ON public.presentations;
CREATE POLICY "Enable update for users based on user_id on presentations"
  ON public.presentations FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete for users based on user_id on presentations" ON public.presentations;
CREATE POLICY "Enable delete for users based on user_id on presentations"
  ON public.presentations FOR DELETE
  USING (auth.uid() = user_id);


-- RLS for slides
-- More specific RLS for slides (from previous comprehensive schema)
DROP POLICY IF EXISTS "Enable read access for all users on slides" ON public.slides;
CREATE POLICY "Enable read access for all users on slides"
  ON public.slides FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Enable insert for users based on presentation_id on slides" ON public.slides;
CREATE POLICY "Enable insert for users based on presentation_id on slides"
  ON public.slides FOR INSERT
  WITH CHECK (EXISTS ( SELECT 1 FROM public.presentations WHERE presentations.id = slides.presentation_id AND presentations.user_id = auth.uid() ));

DROP POLICY IF EXISTS "Enable update for users based on presentation_id on slides" ON public.slides;
CREATE POLICY "Enable update for users based on presentation_id on slides"
  ON public.slides FOR UPDATE
  USING (EXISTS ( SELECT 1 FROM public.presentations WHERE presentations.id = slides.presentation_id AND presentations.user_id = auth.uid() ));

DROP POLICY IF EXISTS "Enable delete for users based on presentation_id on slides" ON public.slides;
CREATE POLICY "Enable delete for users based on presentation_id on slides"
  ON public.slides FOR DELETE
  USING (EXISTS ( SELECT 1 FROM public.presentations WHERE presentations.id = slides.presentation_id AND presentations.user_id = auth.uid() ));


-- RLS for responses
-- More specific RLS for responses (from previous comprehensive schema)
DROP POLICY IF EXISTS "Enable read access for all users on responses" ON public.responses;
CREATE POLICY "Enable read access for all users on responses"
  ON public.responses FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only on responses" ON public.responses;
CREATE POLICY "Enable insert for authenticated users only on responses"
  ON public.responses FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for users based on user_id on responses" ON public.responses;
CREATE POLICY "Enable delete for users based on user_id on responses"
  ON public.responses FOR DELETE
  USING (auth.uid() = user_id);


-- RLS for socket_sessions (from 004_socket_sessions.sql)
DROP POLICY IF EXISTS "Users can view sessions for presentations they have access to" ON public.socket_sessions;
CREATE POLICY "Users can view sessions for presentations they have access to"
  ON public.socket_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.presentations p
      WHERE p.id = socket_sessions.presentation_id
      AND (p.user_id = auth.uid() OR p.is_public = true)
    )
  );

DROP POLICY IF EXISTS "Users can insert their own session" ON public.socket_sessions;
CREATE POLICY "Users can insert their own session"
  ON public.socket_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own session" ON public.socket_sessions;
CREATE POLICY "Users can update their own session"
  ON public.socket_sessions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own session" ON public.socket_sessions;
CREATE POLICY "Users can delete their own session"
  ON public.socket_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS for presentation_rooms (from 004_socket_sessions.sql)
DROP POLICY IF EXISTS "Anyone can view active rooms" ON public.presentation_rooms;
CREATE POLICY "Anyone can view active rooms"
  ON public.presentation_rooms FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Presentation owners can manage rooms" ON public.presentation_rooms;
CREATE POLICY "Presentation owners can manage rooms"
  ON public.presentation_rooms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.presentations p
      WHERE p.id = presentation_rooms.presentation_id
      AND p.user_id = auth.uid()
    )
  );

-- RLS for socket_events (from 004_socket_sessions.sql)
DROP POLICY IF EXISTS "Users can view events for presentations they have access to" ON public.socket_events;
CREATE POLICY "Users can view events for presentations they have access to"
  ON public.socket_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.presentations p
      WHERE p.id = socket_events.presentation_id
      AND (p.user_id = auth.uid() OR p.is_public = true)
    )
  );

DROP POLICY IF EXISTS "Users can insert events for presentations they have access to" ON public.socket_events;
CREATE POLICY "Users can insert events for presentations they have access to"
  ON public.socket_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.presentations p
      WHERE p.id = socket_events.presentation_id
      AND (p.user_id = auth.uid() OR p.is_public = true)
    )
  );