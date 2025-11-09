-- Enable HTTP extension
create extension if not exists http with schema extensions;

-- Create tables
create table presentations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  code text not null unique,
  user_id uuid references auth.users(id) not null,
  created_at timestamptz default now()
);

create table slides (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid references presentations(id) on delete cascade,
  question text not null,
  type text not null, -- 'multiple_choice', 'word_cloud', 'question_only'
  options jsonb,
  "order" int not null,
  created_at timestamptz default now()
);

create table responses (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid references presentations(id) on delete cascade,
  slide_id uuid references slides(id) on delete cascade,
  session_id text not null, -- Using socket.id as session_id
  user_name text,
  response_data jsonb not null,
  created_at timestamptz default now()
);

create table presentation_rooms (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid references presentations(id) on delete cascade unique,
  room_code text not null unique,
  is_active boolean default true,
  current_slide_index int default 0,
  show_results boolean default false,
  participant_count int default 0,
  presenter_socket_id text,
  created_at timestamptz default now()
);

create table socket_sessions (
  id uuid primary key default gen_random_uuid(),
  socket_id text not null unique,
  user_id uuid references auth.users(id),
  presentation_id uuid references presentations(id) on delete cascade,
  user_name text,
  user_role text not null, -- 'presenter' or 'participant'
  is_active boolean default true,
  joined_at timestamptz default now(),
  last_activity timestamptz default now()
);

create table socket_events (
  id uuid primary key default gen_random_uuid(),
  socket_id text not null,
  presentation_id uuid references presentations(id) on delete cascade,
  event_type text not null,
  event_data jsonb,
  created_at timestamptz default now()
);

-- Policies for RLS
alter table presentations enable row level security;
create policy "Users can see their own presentations" on presentations for select using (auth.uid() = user_id);
create policy "Users can create presentations" on presentations for insert with check (auth.uid() = user_id);
create policy "Users can update their own presentations" on presentations for update using (auth.uid() = user_id);
create policy "Users can delete their own presentations" on presentations for delete using (auth.uid() = user_id);

alter table slides enable row level security;
create policy "Users can see slides for presentations they own" on slides for select using (
  exists (select 1 from presentations where presentations.id = slides.presentation_id and presentations.user_id = auth.uid())
);
create policy "Users can create slides for presentations they own" on slides for insert with check (
  exists (select 1 from presentations where presentations.id = slides.presentation_id and presentations.user_id = auth.uid())
);
create policy "Users can update slides for presentations they own" on slides for update using (
  exists (select 1 from presentations where presentations.id = slides.presentation_id and presentations.user_id = auth.uid())
);
create policy "Users can delete slides for presentations they own" on slides for delete using (
  exists (select 1 from presentations where presentations.id = slides.presentation_id and presentations.user_id = auth.uid())
);

-- Public access for participants
create policy "Anyone can view a presentation by code" on presentations for select using (true);
create policy "Anyone can view slides of a presentation" on slides for select using (true);

alter table responses enable row level security;
create policy "Anyone can submit a response" on responses for insert with check (true);
create policy "Users can see responses for their presentations" on responses for select using (
  exists (
    select 1 from slides
    join presentations on slides.presentation_id = presentations.id
    where slides.id = responses.slide_id and presentations.user_id = auth.uid()
  )
);

alter table presentation_rooms enable row level security;
create policy "Presenters can manage their rooms" on presentation_rooms for all using (
  exists (select 1 from presentations where presentations.id = presentation_rooms.presentation_id and presentations.user_id = auth.uid())
);
create policy "Anyone can read room info" on presentation_rooms for select using (true);

alter table socket_sessions enable row level security;
create policy "Users can manage their own socket sessions" on socket_sessions for all using (auth.uid() = user_id);
create policy "Anyone can read active sessions for a presentation" on socket_sessions for select using (true);

alter table socket_events enable row level security;
create policy "Users can read their own socket events" on socket_events for select using (auth.uid() = user_id);
create policy "Presenters can read events for their presentations" on socket_events for select using (
  exists (select 1 from presentations where presentations.id = socket_events.presentation_id and presentations.user_id = auth.uid())
);
create policy "Anyone can insert socket events" on socket_events for insert with check (true);

-- Function to get presentation by code
create or replace function get_presentation_by_code(p_code text)
returns table (
  id uuid,
  title text,
  code text,
  slides json
) as $$
begin
  return query
  select
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
      ) order by s."order"
    ) as slides
  from presentations p
  left join slides s on p.id = s.presentation_id
  where p.code = p_code
  group by p.id;
end;
$$ language plpgsql;