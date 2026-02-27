-- =============================================
-- Agrega columna fee a transactions
-- y actualiza el RPC create_transfer para soportar comisiones
-- =============================================

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS fee DECIMAL(15, 2) DEFAULT NULL;

-- Actualizar RPC para aceptar y almacenar la comisión
CREATE OR REPLACE FUNCTION create_transfer(
  p_user_id UUID,
  p_from_wallet_id UUID,
  p_to_wallet_id UUID,
  p_amount_out DECIMAL,
  p_amount_in DECIMAL,
  p_currency_out TEXT,
  p_currency_in TEXT,
  p_description TEXT DEFAULT NULL,
  p_date TIMESTAMPTZ DEFAULT now(),
  p_conversion_rate DECIMAL DEFAULT NULL,
  p_amount_usd_out DECIMAL DEFAULT NULL,
  p_amount_usd_in DECIMAL DEFAULT NULL,
  p_fee DECIMAL DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_out_id UUID;
  v_in_id UUID;
BEGIN
  -- Insertar transacción de salida (débito), con fee si aplica
  INSERT INTO transactions (
    user_id, wallet_id, category_id, type, amount, currency,
    conversion_rate, amount_usd, description, date, fee
  ) VALUES (
    p_user_id, p_from_wallet_id, NULL, 'transfer_out', p_amount_out,
    p_currency_out, p_conversion_rate, p_amount_usd_out, p_description, p_date, p_fee
  ) RETURNING id INTO v_out_id;

  -- Insertar transacción de entrada (crédito)
  INSERT INTO transactions (
    user_id, wallet_id, category_id, type, amount, currency,
    conversion_rate, amount_usd, linked_transaction_id, description, date
  ) VALUES (
    p_user_id, p_to_wallet_id, NULL, 'transfer_in', p_amount_in,
    p_currency_in, p_conversion_rate, p_amount_usd_in, v_out_id, p_description, p_date
  ) RETURNING id INTO v_in_id;

  -- Vincular la salida con la entrada
  UPDATE transactions SET linked_transaction_id = v_in_id WHERE id = v_out_id;

  RETURN jsonb_build_object('out_id', v_out_id, 'in_id', v_in_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
