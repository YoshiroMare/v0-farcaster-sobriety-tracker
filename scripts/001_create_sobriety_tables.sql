-- Create users table to store Farcaster users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid BIGINT UNIQUE NOT NULL,
  username TEXT,
  display_name TEXT,
  pfp_url TEXT,
  sobriety_start_date DATE,
  total_points INTEGER DEFAULT 0,
  total_checkins INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create checkins table to track daily check-ins
CREATE TABLE IF NOT EXISTS public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  fid BIGINT NOT NULL,
  checkin_date DATE NOT NULL,
  points_earned INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(fid, checkin_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_fid ON public.users(fid);
CREATE INDEX IF NOT EXISTS idx_users_total_points ON public.users(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON public.checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_fid_date ON public.checkins(fid, checkin_date);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- Create policies for users table (allow all operations via service key)
CREATE POLICY "Allow all for service role" ON public.users FOR ALL USING (true);

-- Create policies for checkins table (allow all operations via service key)
CREATE POLICY "Allow all for service role" ON public.checkins FOR ALL USING (true);
