-- Eliminar CHECK constraints de monedas hardcoded
ALTER TABLE wallets
  DROP CONSTRAINT IF EXISTS wallets_currency_check;

ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_currency_check;

-- No hay constraint en exchange_rates para from/to currency
-- (nunca hubo CHECK constraints, era solo validación en frontend)
