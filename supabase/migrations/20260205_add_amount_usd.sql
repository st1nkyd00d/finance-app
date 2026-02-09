-- Agregar columna amount_usd para normalizar todas las transacciones a USD
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount_usd DECIMAL(15, 2);

-- Actualizar transacciones existentes:
-- USD y USDT ya están en dólares (1:1)
UPDATE transactions
SET amount_usd = amount
WHERE currency IN ('USD', 'USDT') AND amount_usd IS NULL;

-- VES necesita conversión usando la tasa guardada
UPDATE transactions
SET amount_usd = CASE
  WHEN exchange_rate > 0 THEN ROUND(amount / exchange_rate, 2)
  ELSE NULL
END
WHERE currency = 'VES' AND amount_usd IS NULL;

-- Crear índice para consultas de analytics
CREATE INDEX IF NOT EXISTS idx_transactions_amount_usd ON transactions(amount_usd);

COMMENT ON COLUMN transactions.amount_usd IS 'Monto equivalente en USD. Para VES se usa exchange_rate (USDT/VES).';
