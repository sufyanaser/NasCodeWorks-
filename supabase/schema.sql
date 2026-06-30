create table if not exists public.site_content (
  key text primary key,
  content_json jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.intake_submissions (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  contact text,
  problem_type text,
  description text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.site_content enable row level security;
alter table public.intake_submissions enable row level security;

-- The website API uses SUPABASE_SERVICE_ROLE_KEY from Vercel serverless functions.
-- Do not expose the service role key in browser code.
