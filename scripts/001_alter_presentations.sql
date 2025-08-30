-- Adds join code and live control fields
alter table if exists public.presentations
  add column if not exists code text unique,
  add column if not exists is_active boolean not null default false,
  add column if not exists current_slide integer not null default 0,
  add column if not exists show_results boolean not null default false;

-- Ensure timestamps exist
alter table if exists public.presentations
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_presentations_updated_at on public.presentations;
create trigger trg_presentations_updated_at
before update on public.presentations
for each row execute function public.set_updated_at();
