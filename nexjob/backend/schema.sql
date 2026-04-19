-- Supabase Database Schema for Joblify

-- Create JobApplications Table
CREATE TABLE IF NOT EXISTS public."JobApplications" (
    id UUID DEFAULT auth.uid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Applied', 'Interview', 'Offer', 'Rejected')),
    applied_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: We are using a UUID default gen_random_uuid() for the actual id if we want independent ids
-- Let's redefine the ID properly as a unique gen_random_uuid
DROP TABLE IF EXISTS public."JobApplications";

CREATE TABLE public."JobApplications" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Applied', 'Interview', 'Offer', 'Rejected')),
    applied_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Setup Row Level Security (RLS)
ALTER TABLE public."JobApplications" ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own job applications."
ON public."JobApplications" FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own job applications."
ON public."JobApplications" FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job applications."
ON public."JobApplications" FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job applications."
ON public."JobApplications" FOR DELETE
USING (auth.uid() = user_id);

-- Profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Usage Stats table
CREATE TABLE public.user_usage_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    resumes_optimized INTEGER DEFAULT 0,
    cover_letters_generated INTEGER DEFAULT 0,
    interview_questions_generated INTEGER DEFAULT 0,
    credits_remaining INTEGER DEFAULT 10,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Activity table
CREATE TABLE public.user_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    activity_description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own stats." ON public.user_usage_stats FOR SELECT USING (auth.uid() = user_id);
-- We allow users to update their stats for client-side decrements
CREATE POLICY "Users can update their own stats." ON public.user_usage_stats FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own activity." ON public.user_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activity." ON public.user_activity FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    initial_credits INTEGER := 10;
BEGIN
    -- Special email gets 20 credits
    IF new.email = 'naveenpandey2706@gmail.com' THEN
        initial_credits := 20;
    END IF;

    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'full_name'
    );
    
    INSERT INTO public.user_usage_stats (user_id, credits_remaining)
    VALUES (
        new.id,
        initial_credits
    );
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Waitlist Users table
CREATE TABLE IF NOT EXISTS public.waitlist_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for waitlist
ALTER TABLE public.waitlist_users ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anon) to insert into waitlist
CREATE POLICY "Anyone can join the waitlist."
    ON public.waitlist_users FOR INSERT
    WITH CHECK (true);

-- Only authenticated users can see their own entry
CREATE POLICY "Users can view their own waitlist entry."
    ON public.waitlist_users FOR SELECT
    USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

