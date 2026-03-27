-- Sessions
create table sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_id uuid references auth.users(id),
  title text,
  status text default 'draft', -- draft, open, closed
  created_at timestamp default now()
);

-- Responses (anonymous submissions)
create table responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  user_id uuid, -- null for anonymous
  text text not null,
  created_at timestamp default now()
);

-- Themes (real-time partial)
create table themes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  theme1_3 text, -- Risk & Concerns / Supporting Comments / Neutral Comments
  confidence numeric,
  theme2_9 text,
  updated_at timestamp default now()
);

-- Enable Realtime
alter publication supabase_realtime add table responses, themes;
