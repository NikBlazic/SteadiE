-- Enable Row Level Security on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_basic_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Allow users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to insert their own data
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_basic_info table
-- Allow users to read their own data
CREATE POLICY "Users can read own basic info"
  ON user_basic_info
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own data
CREATE POLICY "Users can insert own basic info"
  ON user_basic_info
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own data
CREATE POLICY "Users can update own basic info"
  ON user_basic_info
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
