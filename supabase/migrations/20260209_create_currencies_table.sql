-- Tabla de monedas personalizadas
CREATE TABLE currencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,  -- USD, EUR, VES, etc.
  name TEXT NOT NULL,  -- Dólar Estadounidense, Euro, etc.
  symbol TEXT,         -- $, €, Bs, etc.
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraint: code único por usuario (o sistema)
  CONSTRAINT unique_currency_per_user UNIQUE(user_id, code)
);

-- Índice
CREATE INDEX idx_currencies_user ON currencies(user_id);

-- RLS
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own currencies and system currencies"
  ON currencies FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create own currencies"
  ON currencies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own currencies"
  ON currencies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own currencies"
  ON currencies FOR DELETE
  USING (auth.uid() = user_id);

-- Monedas del sistema (predefinidas)
INSERT INTO currencies (user_id, code, name, symbol, is_system) VALUES
  (NULL, 'USD', 'Dólar Estadounidense', '$', true),
  (NULL, 'VES', 'Bolívar Venezolano', 'Bs', true),
  (NULL, 'USDT', 'Tether', '₮', true),
  (NULL, 'EUR', 'Euro', '€', true),
  (NULL, 'GBP', 'Libra Esterlina', '£', true),
  (NULL, 'ARS', 'Peso Argentino', '$', true),
  (NULL, 'COP', 'Peso Colombiano', '$', true),
  (NULL, 'BRL', 'Real Brasileño', 'R$', true);
