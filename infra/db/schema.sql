create extension if not exists "uuid-ossp";

create table orgs(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table users(
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id),
  email text unique not null,
  hashed_password text,                        -- null for SSO/Keycloak users
  role text check (role in ('admin','contributor','auditor')) default 'contributor'
);

create table ai_systems(
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id),
  name text, purpose text, sector text,
  owner uuid references users(id),
  created_at timestamptz default now()
);

create table survey_sessions(
  id uuid primary key default gen_random_uuid(),
  system_id uuid references ai_systems(id),
  answers jsonb default '{}'::jsonb,
  status text default 'in_progress',
  created_at timestamptz default now()
);

create table risk_assessments(
  id uuid primary key default gen_random_uuid(),
  system_id uuid references ai_systems(id),
  session_id uuid references survey_sessions(id),
  risk_level text check (risk_level in ('minimal','limited','high','prohibited')),
  rationale text,
  created_at timestamptz default now()
);

create table documents(
  id uuid primary key default gen_random_uuid(),
  system_id uuid references ai_systems(id),
  session_id uuid references survey_sessions(id),
  type text, url text,
  created_at timestamptz default now()
);

create table audit_logs(
  id bigserial primary key,
  org_id uuid, actor text,
  action text, payload jsonb,
  created_at timestamptz default now()
);

-- Row-Level Security (enable for production with a dedicated app role).
-- Tenant isolation is enforced at the application layer.
-- To enable: set app.org_id = '<uuid>' in each DB session and uncomment below.
--
-- alter table ai_systems enable row level security;
-- create policy org_isolation_ai_systems on ai_systems
--   using (org_id = current_setting('app.org_id', true)::uuid);
