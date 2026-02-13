-- =============================================
-- Bug Fix 2: Normalizar tasas BCV automáticas
-- Problema: La función BCV scheduled no normaliza pares de monedas
--           causando duplicados y problemas con el unique index
-- Solución: Actualizar función para normalizar como lo hace setRate()
-- =============================================

-- Paso 1: Poblar normalized columns en tasas BCV existentes (user_id = NULL)
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
WHERE user_id IS NULL AND (normalized_from IS NULL OR normalized_to IS NULL);

-- Paso 2: Eliminar duplicados BCV si existen (mantener más reciente)
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY user_id, normalized_from, normalized_to
    ORDER BY created_at DESC
  ) as rn
  FROM exchange_rates
  WHERE user_id IS NULL AND is_current = true
)
DELETE FROM exchange_rates
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Paso 3: Reescribir función BCV para normalizar al insertar
CREATE OR REPLACE FUNCTION fetch_and_save_bcv_rate()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response record;
  bcv_rate numeric;
BEGIN
  -- Llamar a la Edge Function de BCV usando extensión http
  SELECT * INTO response
  FROM http_get('https://uujfmkcmpetpslrcleip.supabase.co/functions/v1/bcv-rate');

  IF response.status != 200 THEN
    RAISE NOTICE 'Error HTTP al obtener tasa BCV: status %', response.status;
    RETURN;
  END IF;

  -- Extraer la tasa del JSON de respuesta
  bcv_rate := (response.content::jsonb->>'rate')::numeric;

  IF bcv_rate IS NULL OR bcv_rate <= 0 THEN
    RAISE NOTICE 'Tasa BCV invalida: %', response.content;
    RETURN;
  END IF;

  -- Marcar tasas BCV del sistema anteriores como no actuales
  -- Ahora filtramos por normalized_from/to en vez de from/to para consistencia
  UPDATE exchange_rates
  SET is_current = false
  WHERE user_id IS NULL
    AND source = 'bcv'
    AND is_current = true
    AND (
      (normalized_from = 'USD' AND normalized_to = 'VES') OR
      (normalized_from = 'USDT' AND normalized_to = 'VES')
    );

  -- Insertar tasa USD → VES normalizada (del sistema, visible para todos)
  INSERT INTO exchange_rates (
    user_id,
    from_currency,
    to_currency,
    normalized_from,
    normalized_to,
    rate,
    source,
    is_current
  ) VALUES (
    NULL,
    'USD',
    'VES',
    'USD',  -- Normalizado: USD < VES alfabéticamente
    'VES',
    bcv_rate,
    'bcv',
    true
  );

  -- Insertar tasa USDT → VES normalizada (misma tasa BCV como referencia base)
  INSERT INTO exchange_rates (
    user_id,
    from_currency,
    to_currency,
    normalized_from,
    normalized_to,
    rate,
    source,
    is_current
  ) VALUES (
    NULL,
    'USDT',
    'VES',
    'USDT',  -- Normalizado: USDT < VES alfabéticamente
    'VES',
    bcv_rate,
    'bcv',
    true
  );

  RAISE NOTICE 'Tasa BCV actualizada y normalizada: % (USD→VES y USDT→VES)', bcv_rate;
END;
$$;
