create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid not null references public.presentations(id) on delete cascade,
  slide_id uuid not null references public.slides(id) on delete cascade,
  option_index integer not null check (option_index >= 0),
  created_at timestamptz default now()
);

-- helpful indexes
create index if not exists idx_responses_presentation on public.responses(presentation_id);
create index if not exists idx_responses_slide on public.responses(slide_id);
