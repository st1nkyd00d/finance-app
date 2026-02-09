-- =============================================
-- 2.6: Agregar CHECK constraint en transactions.currency
-- Asegura que solo se acepten monedas válidas (VES, USDT, USD)
-- =============================================

ALTER TABLE transactions
ADD CONSTRAINT transactions_currency_check
CHECK (currency IN ('VES', 'USDT', 'USD'));

-- =============================================
-- 2.7: Cambiar linked_transaction_id a ON DELETE CASCADE
-- Cuando se borra una mitad de la transferencia, se borra la otra
-- =============================================

ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_linked_transaction_id_fkey;

ALTER TABLE transactions
ADD CONSTRAINT transactions_linked_transaction_id_fkey
  FOREIGN KEY (linked_transaction_id)
  REFERENCES transactions(id)
  ON DELETE CASCADE;
