-- Add goal_id column to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES savings_goals(id) ON DELETE SET NULL;

-- Create index for goal_id lookups (only for non-null values)
CREATE INDEX idx_transactions_goal_id ON transactions(goal_id) WHERE goal_id IS NOT NULL;
