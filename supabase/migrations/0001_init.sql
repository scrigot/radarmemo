-- radarmemo — initial schema (Stage 2)
-- workspaces → sources → issues → articles
-- RLS enabled with permissive public-read. Writes happen via service_role.

create extension if not exists "pgcrypto";

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  email_recipients text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  url text not null,
  type text not null check (type in ('rss')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table issues (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  week_of date not null,
  summary_markdown text not null,
  article_count int not null default 0,
  published_at timestamptz not null default now(),
  unique (workspace_id, week_of)
);

create table articles (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  source_id uuid references sources(id) on delete set null,
  title text not null,
  link text not null,
  raw_content text,
  published_at timestamptz,
  included_in_summary boolean not null default true
);

create index idx_sources_workspace on sources(workspace_id) where active;
create index idx_issues_workspace_week on issues(workspace_id, week_of desc);
create index idx_articles_issue on articles(issue_id);

alter table workspaces enable row level security;
alter table sources enable row level security;
alter table issues enable row level security;
alter table articles enable row level security;

-- Stage 2: everything is public-readable (dashboard + share links).
-- Writes happen only via service_role key (server-side cron + CLI).
create policy "public read workspaces" on workspaces for select using (true);
create policy "public read sources" on sources for select using (true);
create policy "public read issues" on issues for select using (true);
create policy "public read articles" on articles for select using (true);
