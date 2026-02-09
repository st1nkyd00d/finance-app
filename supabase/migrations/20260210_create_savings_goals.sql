-- Create savings_goals table
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(15, 2) NOT NULL CHECK (target_amount > 0),
  description TEXT,
  deadline DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for user_id lookups
CREATE INDEX idx_savings_goals_user_id ON savings_goals(user_id);

-- Enable Row Level Security
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own savings goals"
  ON savings_goals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own savings goals"
  ON savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings goals"
  ON savings_goals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings goals"
  ON savings_goals FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER savings_goals_updated_at
  BEFORE UPDATE ON savings_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
