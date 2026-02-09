-- Función para normalizar pares de monedas
-- Siempre almacena en orden alfabético: USD/VES (no VES/USD)
CREATE OR REPLACE FUNCTION normalize_currency_pair(curr1 TEXT, curr2 TEXT)
RETURNS TABLE(from_curr TEXT, to_curr TEXT) AS $$
BEGIN
  IF curr1 <= curr2 THEN
    RETURN QUERY SELECT curr1, curr2;
  ELSE
    RETURN QUERY SELECT curr2, curr1;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Agregar columnas normalizadas
ALTER TABLE exchange_rates
  ADD COLUMN IF NOT EXISTS normalized_from TEXT,
  ADD COLUMN IF NOT EXISTS normalized_to TEXT;

-- Poblar columnas existentes
UPDATE exchange_rates
SET normalized_from = CASE
    WHEN from_currency <= to_currency THEN from_currency
    ELSE to_currency
  END,
  normalized_to = CASE
    WHEN from_currency <= to_currency THEN to_currency
    ELSE from_currency
  END
WHERE normalized_from IS NULL;

-- Si hay duplicados actuales, mantener solo uno (el más reciente)
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY user_id, normalized_from, normalized_to
    ORDER BY created_at DESC
  ) as rn
  FROM exchange_rates
  WHERE is_current = true
)
UPDATE exchange_rates
SET is_current = false
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Constraint: solo un par normalizado por usuario
CREATE UNIQUE INDEX IF NOT EXISTS unique_normalized_pair_per_user
  ON exchange_rates(user_id, normalized_from, normalized_to)
  WHERE is_current = true;
