-- =============================================================
-- Fix: Función scheduled de BCV (3.7)
-- Problemas corregidos:
--   1. Usa extensión http (no pg_net) para http_get() sincrónico
--   2. Tasas del sistema con user_id = NULL (visibles para todos via RLS)
--   3. Inserta tanto USD→VES como USDT→VES
-- =============================================================

-- 1. Habilitar extensión http (la que provee http_get)
CREATE EXTENSION IF NOT EXISTS http;

-- 2. Permitir user_id NULL para tasas del sistema
ALTER TABLE exchange_rates ALTER COLUMN user_id DROP NOT NULL;

-- 3. Actualizar politica SELECT para incluir tasas del sistema
DROP POLICY IF EXISTS "Users can view own exchange rates" ON exchange_rates;
CREATE POLICY "Users can view own and system exchange rates"
  ON exchange_rates FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 4. Reescribir función scheduled
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
  UPDATE exchange_rates
  SET is_current = false
  WHERE user_id IS NULL
    AND source = 'bcv'
    AND is_current = true;

  -- Insertar tasa USD → VES (del sistema, visible para todos)
  INSERT INTO exchange_rates (user_id, from_currency, to_currency, rate, source, is_current)
  VALUES (NULL, 'USD', 'VES', bcv_rate, 'bcv', true);

  -- Insertar tasa USDT → VES (misma tasa BCV como referencia base)
  INSERT INTO exchange_rates (user_id, from_currency, to_currency, rate, source, is_current)
  VALUES (NULL, 'USDT', 'VES', bcv_rate, 'bcv', true);

  RAISE NOTICE 'Tasa BCV actualizada: % (USD→VES y USDT→VES)', bcv_rate;
END;
$$;

-- 5. Reprogramar cron job
SELECT cron.unschedule('update-bcv-rate-daily');
SELECT cron.schedule(
  'update-bcv-rate-daily',
  '0 13 * * *',  -- 13:00 UTC = 9:00 AM Venezuela
  'SELECT fetch_and_save_bcv_rate()'
);
