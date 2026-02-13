-- =============================================
-- Eliminar sistema de tasas automáticas BCV
-- Razón: Confunde al usuario mezclar tasas del sistema
--        con tasas manuales. Mejor que el usuario
--        use el botón "USD/VES desde BCV" cuando quiera.
-- =============================================

-- 1. Desactivar y eliminar el cron job de BCV
SELECT cron.unschedule('update-bcv-rate-daily');

-- 2. Eliminar todas las tasas del sistema (user_id = NULL)
DELETE FROM exchange_rates
WHERE user_id IS NULL;

-- 3. Revertir política RLS para que solo muestre tasas del usuario
DROP POLICY IF EXISTS "Users can view own and system exchange rates" ON exchange_rates;
CREATE POLICY "Users can view own exchange rates"
  ON exchange_rates FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Hacer user_id NOT NULL de nuevo (todas las tasas deben tener dueño)
ALTER TABLE exchange_rates ALTER COLUMN user_id SET NOT NULL;

-- 5. Comentario explicativo
COMMENT ON TABLE exchange_rates IS 'User exchange rates. Users update rates manually via UI buttons (BCV, Binance, etc). No system-wide automatic rates.';
