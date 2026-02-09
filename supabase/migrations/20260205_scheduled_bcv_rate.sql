-- Habilitar extensiones necesarias para scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Crear función para llamar a la Edge Function de BCV y guardar la tasa
CREATE OR REPLACE FUNCTION fetch_and_save_bcv_rate()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bcv_response jsonb;
  bcv_rate numeric;
  system_user_id uuid;
BEGIN
  -- Obtener el primer usuario como "sistema" para guardar tasas automáticas
  -- En producción, podrías crear un usuario especial para esto
  SELECT id INTO system_user_id FROM auth.users LIMIT 1;

  IF system_user_id IS NULL THEN
    RAISE NOTICE 'No hay usuarios en el sistema, saltando actualización de tasa BCV';
    RETURN;
  END IF;

  -- Llamar a la Edge Function
  SELECT content::jsonb INTO bcv_response
  FROM http_get('https://uujfmkcmpetpslrcleip.supabase.co/functions/v1/bcv-rate');

  -- Extraer la tasa
  bcv_rate := (bcv_response->>'rate')::numeric;

  IF bcv_rate IS NULL OR bcv_rate <= 0 THEN
    RAISE NOTICE 'Tasa BCV inválida: %', bcv_response;
    RETURN;
  END IF;

  -- Marcar tasas anteriores como no actuales
  UPDATE exchange_rates
  SET is_current = false
  WHERE from_currency = 'USD'
    AND to_currency = 'VES'
    AND source = 'bcv'
    AND is_current = true;

  -- Insertar nueva tasa
  INSERT INTO exchange_rates (user_id, from_currency, to_currency, rate, source, is_current)
  VALUES (system_user_id, 'USD', 'VES', bcv_rate, 'bcv', true);

  RAISE NOTICE 'Tasa BCV actualizada: %', bcv_rate;
END;
$$;

-- Programar la ejecución diaria a las 9:00 AM (hora de Venezuela, UTC-4)
-- 13:00 UTC = 9:00 AM Venezuela
SELECT cron.schedule(
  'update-bcv-rate-daily',           -- nombre del job
  '0 13 * * *',                       -- cron: todos los días a las 13:00 UTC (9:00 AM VE)
  'SELECT fetch_and_save_bcv_rate()'  -- comando SQL a ejecutar
);

-- Verificar que el job se creó
-- SELECT * FROM cron.job;
