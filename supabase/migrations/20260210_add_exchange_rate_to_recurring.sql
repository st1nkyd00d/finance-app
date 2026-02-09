-- =============================================
-- Agregar exchange_rate a recurring_transactions
-- Fecha: 2026-02-10
-- Permite almacenar la tasa de cambio para
-- transacciones recurrentes en bolívares (VES)
-- =============================================

ALTER TABLE recurring_transactions
ADD COLUMN exchange_rate DECIMAL(15, 6);

-- Comentario: La tasa se guardará cuando se crea la recurrente
-- y se usará al procesar automáticamente las transacciones
