-- Socket.IO Session Management Tables
-- This table tracks active Socket.IO connections and their associated presentations
create table if not exists public.socket_sessions (
  id uuid primary key default gen_random_uuid(),
  socket_id text not null unique,
  user_id uuid references auth.users(id) on delete cascade,
  presentation_id uuid references public.presentations(id) on delete cascade,
  user_name text,
  user_role text check (user_role in ('presenter', 'participant')) default 'participant',
  is_active boolean default true,
  joined_at timestamptz default now(),
  last_activity timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for efficient queries
create index if not exists idx_socket_sessions_presentation_id on public.socket_sessions(presentation_id);
create index if not exists idx_socket_sessions_socket_id on public.socket_sessions(socket_id);
create index if not exists idx_socket_sessions_user_id on public.socket_sessions(user_id);
create index if not exists idx_socket_sessions_active on public.socket_sessions(is_active);

-- Room activity tracking
create table if not exists public.presentation_rooms (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid references public.presentations(id) on delete cascade unique,
  room_code text unique,
  is_active boolean default true,
  current_slide_index integer default 0,
  show_results boolean default false,
  presenter_socket_id text,
  participant_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for room queries
create index if not exists idx_presentation_rooms_code on public.presentation_rooms(room_code);
create index if not exists idx_presentation_rooms_active on public.presentation_rooms(is_active);

-- Real-time events log for debugging and analytics
create table if not exists public.socket_events (
  id uuid primary key default gen_random_uuid(),
  socket_id text,
  presentation_id uuid references public.presentations(id) on delete cascade,
  event_type text not null,
  event_data jsonb,
  timestamp timestamptz default now()
);

-- Index for events
create index if not exists idx_socket_events_presentation_id on public.socket_events(presentation_id);
create index if not exists idx_socket_events_timestamp on public.socket_events(timestamp);

-- Update triggers
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply triggers to new tables
drop trigger if exists trg_socket_sessions_updated_at on public.socket_sessions;
create trigger trg_socket_sessions_updated_at
before update on public.socket_sessions
for each row execute function public.set_updated_at();

drop trigger if exists trg_presentation_rooms_updated_at on public.presentation_rooms;
create trigger trg_presentation_rooms_updated_at
before update on public.presentation_rooms
for each row execute function public.set_updated_at();

-- Function to clean up inactive sessions
create or replace function public.cleanup_inactive_sessions()
returns void as $$
begin
  delete from public.socket_sessions 
  where last_activity < now() - interval '1 hour' 
  or is_active = false;
end;
$$ language plpgsql;

-- RLS Policies for socket_sessions
alter table public.socket_sessions enable row level security;

create policy "Users can view sessions for presentations they have access to"
  on public.socket_sessions for select
  using (
    exists (
      select 1 from public.presentations p
      where p.id = socket_sessions.presentation_id
      and (p.user_id = auth.uid() or p.is_public = true)
    )
  );

create policy "Users can insert their own session"
  on public.socket_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own session"
  on public.socket_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own session"
  on public.socket_sessions for delete
  using (auth.uid() = user_id);

-- RLS Policies for presentation_rooms
alter table public.presentation_rooms enable row level security;

create policy "Anyone can view active rooms"
  on public.presentation_rooms for select
  using (is_active = true);

create policy "Presentation owners can manage rooms"
  on public.presentation_rooms for all
  using (
    exists (
      select 1 from public.presentations p
      where p.id = presentation_rooms.presentation_id
      and p.user_id = auth.uid()
    )
  );

-- RLS Policies for socket_events
alter table public.socket_events enable row level security;

create policy "Users can view events for presentations they have access to"
  on public.socket_events for select
  using (
    exists (
      select 1 from public.presentations p
      where p.id = socket_events.presentation_id
      and (p.user_id = auth.uid() or p.is_public = true)
    )
  );

create policy "Users can insert events for presentations they have access to"
  on public.socket_events for insert
  with check (
    exists (
      select 1 from public.presentations p
      where p.id = socket_events.presentation_id
      and (p.user_id = auth.uid() or p.is_public = true)
    )
  );
