-- =============================================
-- Limpieza agresiva de duplicados en exchange_rates
-- =============================================

-- Paso 1: Ver qué duplicados existen (query de diagnóstico)
-- Ejecuta esto primero para ver qué tienes:
SELECT
  user_id,
  from_currency,
  to_currency,
  normalized_from,
  normalized_to,
  is_current,
  source,
  COUNT(*) as cantidad,
  STRING_AGG(id::text, ', ') as ids
FROM exchange_rates
WHERE is_current = true
GROUP BY user_id, from_currency, to_currency, normalized_from, normalized_to, is_current, source
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- Paso 2: Poblar TODAS las normalized columns (no solo user_id NULL)
UPDATE exchange_rates
SET
  normalized_from = CASE
    WHEN from_currency <= to_currency THEN from_currency
    ELSE to_currency
  END,
  normalized_to = CASE
    WHEN from_currency <= to_currency THEN to_currency
    ELSE from_currency
  END
WHERE normalized_from IS NULL OR normalized_to IS NULL;

-- Paso 3: Eliminar duplicados para TODOS los usuarios (no solo system)
-- Mantiene el más reciente de cada par normalizado por usuario
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY COALESCE(user_id::text, 'system'), normalized_from, normalized_to
    ORDER BY created_at DESC
  ) as rn
  FROM exchange_rates
  WHERE is_current = true
)
DELETE FROM exchange_rates
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Paso 4: Verificación - debe retornar 0 filas si todo está bien
SELECT
  COALESCE(user_id::text, 'SYSTEM') as user,
  normalized_from,
  normalized_to,
  COUNT(*) as cantidad
FROM exchange_rates
WHERE is_current = true
GROUP BY user_id, normalized_from, normalized_to
HAVING COUNT(*) > 1;
