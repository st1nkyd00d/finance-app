-- Add 'savings' transaction type to existing transactions
-- This allows users to explicitly save money towards their goals

-- First, check if we need to modify the type constraint
-- The type column might be using a CHECK constraint or an ENUM

-- Option 1: If using CHECK constraint, we need to drop and recreate it
DO $$
BEGIN
  -- Try to drop the constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'transactions' AND constraint_name LIKE '%type%'
  ) THEN
    ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
  END IF;
END $$;

-- Add new CHECK constraint that includes 'savings'
ALTER TABLE transactions
ADD CONSTRAINT transactions_type_check
CHECK (type IN ('income', 'expense', 'savings'));

-- Comment explaining the new type
COMMENT ON COLUMN transactions.type IS 'Transaction type: income (money in), expense (money out), savings (money set aside for goals)';
