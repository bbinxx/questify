alter table public.presentations enable row level security;
alter table public.slides enable row level security;
alter table public.responses enable row level security;

-- For demo: allow anyone to read/write. Tighten in production and add auth.
do $$
begin
  if not exists (select 1 from pg_policies where polname = 'presentations_all') then
    create policy presentations_all on public.presentations for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where polname = 'slides_all') then
    create policy slides_all on public.slides for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where polname = 'responses_all') then
    create policy responses_all on public.responses for all using (true) with check (true);
  end if;
end $$;
