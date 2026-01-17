alter table users add column onboarding_status text default '';

-- Enable Row Level Security on all user-related tables
ALTER TABLE user_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addiction_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mental_health_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_motivation ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lifestyle_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_support_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_emergency_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_reason table
CREATE POLICY "Users can read own reason"
  ON user_reasons
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reason"
  ON user_reasons
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reason"
  ON user_reasons
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reason"
  ON user_reasons
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_addiction_info table
CREATE POLICY "Users can read own addiction info"
  ON user_addiction_info
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addiction info"
  ON user_addiction_info
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addiction info"
  ON user_addiction_info
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own addiction info"
  ON user_addiction_info
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_mental_health_info table
CREATE POLICY "Users can read own mental health info"
  ON user_mental_health_info
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mental health info"
  ON user_mental_health_info
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mental health info"
  ON user_mental_health_info
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mental health info"
  ON user_mental_health_info
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_motivation table
CREATE POLICY "Users can read own motivation"
  ON user_motivation
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own motivation"
  ON user_motivation
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own motivation"
  ON user_motivation
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own motivation"
  ON user_motivation
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_lifestyle_factors table
CREATE POLICY "Users can read own lifestyle factors"
  ON user_lifestyle_factors
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lifestyle factors"
  ON user_lifestyle_factors
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lifestyle factors"
  ON user_lifestyle_factors
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own lifestyle factors"
  ON user_lifestyle_factors
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_support_preferences table
CREATE POLICY "Users can read own support preferences"
  ON user_support_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own support preferences"
  ON user_support_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own support preferences"
  ON user_support_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own support preferences"
  ON user_support_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_emergency_contacts table
CREATE POLICY "Users can read own emergency contact"
  ON user_emergency_contacts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emergency contact"
  ON user_emergency_contacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emergency contact"
  ON user_emergency_contacts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own emergency contact"
  ON user_emergency_contacts
  FOR DELETE
  USING (auth.uid() = user_id);
