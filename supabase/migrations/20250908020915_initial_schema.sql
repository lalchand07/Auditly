-- Create a table for public user profiles
create table public.users (
  id uuid not null primary key references auth.users(id) on delete cascade,
  email text unique,
  name text,
  role text default 'member',
  plan text default 'starter' -- For pricing logic
);

-- Function to create a public user profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function when a new user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a table for workspaces
create table public.workspaces (
  id uuid not null primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text,
  brand_color text,
  logo_url text
);

-- Create a junction table for workspace members
create table public.members (
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  role text,
  primary key (user_id, workspace_id)
);

-- Create a table for scan jobs
create table public.scan_jobs (
  id uuid not null primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  url text not null,
  status text not null default 'pending', -- pending, running, done, failed
  started_at timestamptz,
  finished_at timestamptz,
  summary_json jsonb,
  pdf_url text
);

-- Create a table for proposal templates
create table public.proposal_templates (
  id uuid not null primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text,
  currency text,
  sections_json jsonb,
  default_price_min int,
  default_price_max int
);

-- Create a table for proposals
create table public.proposals (
  id uuid not null primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  job_id uuid references public.scan_jobs(id) on delete set null, -- A proposal might exist without a scan
  template_id uuid not null references public.proposal_templates(id) on delete cascade,
  client_name text,
  pdf_url text,
  sent_at timestamptz
);

-- Enable RLS for all tables
alter table public.users enable row level security;
alter table public.workspaces enable row level security;
alter table public.members enable row level security;
alter table public.scan_jobs enable row level security;
alter table public.proposal_templates enable row level security;
alter table public.proposals enable row level security;

-- Policies for users
create policy "Users can view their own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.users for update using (auth.uid() = id);

-- Policies for workspaces
create policy "Users can view workspaces they are a member of" on public.workspaces for select using (
  id in (select workspace_id from public.members where user_id = auth.uid())
);
create policy "Users can create workspaces" on public.workspaces for insert with check (auth.uid() = owner_id);
create policy "Workspace owners can update their workspaces" on public.workspaces for update using (auth.uid() = owner_id);
create policy "Workspace owners can delete their workspaces" on public.workspaces for delete using (auth.uid() = owner_id);

-- Policies for members
create policy "Users can view members of workspaces they belong to" on public.members for select using (
  workspace_id in (select workspace_id from public.members where user_id = auth.uid())
);
-- Add more policies for members (e.g., inviting, removing) as needed.

-- Policies for scan_jobs
create policy "Users can view scan jobs in their workspaces" on public.scan_jobs for select using (
  workspace_id in (select workspace_id from public.members where user_id = auth.uid())
);
create policy "Users can create scan jobs in their workspaces" on public.scan_jobs for insert with check (
  workspace_id in (select workspace_id from public.members where user_id = auth.uid())
);

-- Policies for proposal_templates
create policy "Users can view proposal templates in their workspaces" on public.proposal_templates for select using (
  workspace_id in (select workspace_id from public.members where user_id = auth.uid())
);
create policy "Users can create proposal templates in their workspaces" on public.proposal_templates for insert with check (
  workspace_id in (select workspace_id from public.members where user_id = auth.uid())
);

-- Policies for proposals
create policy "Users can view proposals in their workspaces" on public.proposals for select using (
  workspace_id in (select workspace_id from public.members where user_id = auth.uid())
);
create policy "Users can create proposals in their workspaces" on public.proposals for insert with check (
  workspace_id in (select workspace_id from public.members where user_id = auth.uid())
);
