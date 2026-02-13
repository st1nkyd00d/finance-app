-- =============================================
-- Bug Fix 1: Arreglar constraint de tipos de transacción
-- Problema: El constraint solo permitía income/expense/savings
--           pero las transferencias usan transfer_out/transfer_in
-- Solución: Incluir todos los tipos válidos en el constraint
-- =============================================

-- Drop y recrear el constraint con todos los tipos válidos
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions
ADD CONSTRAINT transactions_type_check
CHECK (type IN ('income', 'expense', 'savings', 'transfer_out', 'transfer_in'));

-- Actualizar comentario para reflejar todos los tipos
COMMENT ON COLUMN transactions.type IS 'Transaction type: income (money in), expense (money out), savings (money set aside for goals), transfer_out (outgoing transfer), transfer_in (incoming transfer)';
