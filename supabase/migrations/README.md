# Migraciones de Base de Datos - Sistema de Tasas de Cambio

Este directorio contiene las migraciones necesarias para implementar el sistema mejorado de tasas de cambio con monedas personalizadas y prevención de duplicados.

## Orden de Ejecución

Las migraciones deben ejecutarse en el siguiente orden:

1. `20260209_create_currencies_table.sql` - Crea la tabla de monedas personalizadas
2. `20260209_remove_currency_constraints.sql` - Elimina constraints hardcoded
3. `20260209_prevent_duplicate_rates.sql` - Previene duplicados mediante normalización

## Cómo Aplicar las Migraciones

### Opción 1: Usando Supabase CLI (Recomendado)

```bash
# Asegúrate de estar en el directorio del proyecto
cd finance-app

# Aplicar todas las migraciones pendientes
supabase db push
```

### Opción 2: Manual desde Supabase Dashboard

1. Abre el panel de Supabase (https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a SQL Editor
4. Copia y pega el contenido de cada archivo .sql en orden
5. Ejecuta cada script

### Opción 3: Usando psql

```bash
psql -h db.xxxxx.supabase.co -U postgres -d postgres -f supabase/migrations/20260209_create_currencies_table.sql
psql -h db.xxxxx.supabase.co -U postgres -d postgres -f supabase/migrations/20260209_remove_currency_constraints.sql
psql -h db.xxxxx.supabase.co -U postgres -d postgres -f supabase/migrations/20260209_prevent_duplicate_rates.sql
```

## ¿Qué hace cada migración?

### 1. Create Currencies Table
- Crea tabla `currencies` con monedas del sistema y personalizadas
- Configura RLS (Row Level Security)
- Pre-carga monedas comunes: USD, VES, USDT, EUR, GBP, ARS, COP, BRL

### 2. Remove Currency Constraints
- Elimina constraints hardcoded de las tablas `wallets` y `transactions`
- Permite usar cualquier moneda registrada en `currencies`

### 3. Prevent Duplicate Rates
- Agrega columnas `normalized_from` y `normalized_to` a `exchange_rates`
- Crea función `normalize_currency_pair()` para ordenar alfabéticamente
- Elimina duplicados existentes (mantiene el más reciente)
- Crea constraint único para prevenir futuros duplicados

## Verificación Post-Migración

Después de aplicar las migraciones, verifica que todo funcionó correctamente:

```sql
-- Verificar que la tabla currencies existe
SELECT * FROM currencies ORDER BY is_system DESC, code;

-- Verificar que las columnas normalized_* existen
SELECT normalized_from, normalized_to, from_currency, to_currency
FROM exchange_rates
WHERE is_current = true;

-- Verificar que no hay duplicados
SELECT normalized_from, normalized_to, COUNT(*)
FROM exchange_rates
WHERE is_current = true
GROUP BY normalized_from, normalized_to
HAVING COUNT(*) > 1;
```

El último query debería retornar 0 filas (sin duplicados).

## Rollback

Si necesitas revertir los cambios:

```sql
-- Eliminar tabla de monedas
DROP TABLE IF EXISTS currencies CASCADE;

-- Eliminar columnas normalizadas
ALTER TABLE exchange_rates
  DROP COLUMN IF EXISTS normalized_from,
  DROP COLUMN IF EXISTS normalized_to;

-- Eliminar función
DROP FUNCTION IF EXISTS normalize_currency_pair(TEXT, TEXT);

-- Eliminar índice único
DROP INDEX IF EXISTS unique_normalized_pair_per_user;
```

⚠️ **Advertencia**: El rollback eliminará todas las monedas personalizadas creadas por los usuarios.

## Soporte

Si tienes problemas al aplicar las migraciones, verifica:

1. Tienes permisos de administrador en la base de datos
2. No hay conexiones activas bloqueando las tablas
3. Las tablas `wallets`, `transactions` y `exchange_rates` existen
4. La extensión `uuid-ossp` está habilitada (debería estar por defecto en Supabase)
