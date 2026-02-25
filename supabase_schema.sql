-- ==============================================================================
-- AGS ProjectHub V3 Supabase Schema Migration
-- Run this SQL in the Supabase SQL Editor to create the necessary tables.
-- ==============================================================================

-- 1. Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    client TEXT,
    start_date TEXT,
    end_date TEXT,
    manager TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    owner_id TEXT,
    start_date TEXT,
    due_date TEXT,
    status TEXT NOT NULL,
    priority TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    dependencies TEXT[],
    tags TEXT[],
    parent_id TEXT,
    is_milestone BOOLEAN DEFAULT FALSE,
    workstream TEXT,
    related_milestone_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Issues
CREATE TABLE IF NOT EXISTS public.issues (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL,
    owner_id TEXT,
    due_date TEXT,
    status TEXT NOT NULL,
    related_task_id TEXT,
    related_release_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to auto-update 'updated_at' column (Postgres Generic)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON public.issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- Enable Row Level Security (RLS)
-- For MVP, we allow all authenticated users (or anon if needed) to read/write 
-- ==============================================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Note: Depending on next-auth MVP setup, if you query Supabase with ANON key from client:
CREATE POLICY "Enable read access for all users" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Enable all access for all users" ON public.projects FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Enable all access for all users" ON public.tasks FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON public.issues FOR SELECT USING (true);
CREATE POLICY "Enable all access for all users" ON public.issues FOR ALL USING (true);
