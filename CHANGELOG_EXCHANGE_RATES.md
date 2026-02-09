# Changelog - Sistema de Tasas de Cambio Mejorado

## Versión 2.0.0 - 2026-02-09

### 🎯 Resumen de Cambios

Se implementaron 3 mejoras principales al sistema de tasas de cambio:

1. **Monedas Personalizadas** - Los usuarios ahora pueden agregar sus propias monedas
2. **Prevención de Duplicados** - Sistema normalizado que previene tasas duplicadas
3. **Calculadora Multi-Moneda** - Herramienta para conversiones rápidas

---

## ✨ Nuevas Características

### 1. Gestión de Monedas Personalizadas

#### Antes
- Solo 3 monedas hardcoded: USD, VES, USDT
- Imposible agregar nuevas monedas sin modificar código

#### Ahora
- 8 monedas del sistema pre-cargadas (USD, VES, USDT, EUR, GBP, ARS, COP, BRL)
- Usuarios pueden agregar monedas ilimitadas
- Interfaz gráfica para gestionar monedas (Botón "Monedas")
- Cada moneda tiene: código, nombre completo, símbolo

**Nuevos Archivos:**
- `src/services/currencies.js` - Servicio CRUD para monedas
- `src/pages/ExchangeRates/CurrencyManager.jsx` - Interfaz de gestión

**Base de Datos:**
- Nueva tabla `currencies` con RLS
- Migración: `20260209_create_currencies_table.sql`

---

### 2. Sistema de Normalización (Anti-Duplicados)

#### Antes
```
Usuario crea USD/VES = 95.50
Usuario crea VES/USD = 0.0105
Resultado: 2 filas en la BD (duplicado)
```

#### Ahora
```
Usuario crea USD/VES = 95.50
Sistema guarda: USD/VES = 95.50 (normalizado)

Usuario crea VES/USD = 0.0105
Sistema convierte y actualiza: USD/VES = 95.24 (1/0.0105)
Resultado: 1 fila en la BD (sin duplicados)
```

**Cómo Funciona:**
1. Todas las tasas se guardan en orden alfabético (USD/VES, nunca VES/USD)
2. Al crear VES/USD, el sistema invierte la tasa y guarda USD/VES
3. Constraint único a nivel de BD previene duplicados
4. UI muestra ambas direcciones automáticamente

**Archivos Modificados:**
- `src/services/exchangeRates.js` - Lógica de normalización en `setRate()` y `getCurrentRate()`
- `src/hooks/useCurrencyConvert.js` - Búsqueda normalizada en `getRate()`
- `src/pages/ExchangeRates/RateCard.jsx` - Muestra ambas direcciones

**Base de Datos:**
- Nuevas columnas: `normalized_from`, `normalized_to`
- Nueva función: `normalize_currency_pair()`
- Constraint único: `unique_normalized_pair_per_user`
- Migración: `20260209_prevent_duplicate_rates.sql`

---

### 3. Calculadora de Conversión Multi-Moneda

Nueva herramienta para convertir rápidamente entre todas las monedas disponibles.

**Funcionalidades:**
- Input de monto
- Selector de moneda base
- Tabla con conversiones a todas las demás monedas
- Indica qué conversiones no tienen tasa disponible
- Botón para copiar valores al portapapeles

**Nuevo Archivo:**
- `src/pages/ExchangeRates/CurrencyCalculator.jsx`

**Acceso:**
- Botón "Calculadora" en la página de Tasas de Cambio

---

## 🔧 Archivos Modificados

### Base de Datos (Migraciones)
```
supabase/migrations/
├── 20260209_create_currencies_table.sql       (NUEVO)
├── 20260209_remove_currency_constraints.sql   (NUEVO)
├── 20260209_prevent_duplicate_rates.sql       (NUEVO)
└── README.md                                   (NUEVO)
```

### Servicios
```
src/services/
├── currencies.js         (NUEVO) - CRUD de monedas
└── exchangeRates.js      (MODIFICADO) - Normalización
```

### Hooks
```
src/hooks/
└── useCurrencyConvert.js (MODIFICADO) - Búsqueda normalizada
```

### Componentes
```
src/pages/ExchangeRates/
├── ExchangeRates.jsx          (MODIFICADO) - Integración de nuevos componentes
├── RateForm.jsx               (MODIFICADO) - Selectores dinámicos de monedas
├── RateCard.jsx               (MODIFICADO) - Muestra ambas direcciones
├── CurrencyManager.jsx        (NUEVO) - Gestión de monedas
└── CurrencyCalculator.jsx     (NUEVO) - Calculadora multi-moneda
```

---

## 📊 Comparación Antes/Después

| Característica | Antes | Después |
|----------------|-------|---------|
| Monedas disponibles | 3 hardcoded | Ilimitadas |
| Agregar moneda | Modificar código | Desde UI |
| Duplicados | Sí (USD/VES y VES/USD) | No (normalizado) |
| Filas en BD por par | 2 | 1 |
| Calculadora | ❌ | ✅ |
| Conversiones inversas | Manual | Automático |

---

## 🚀 Cómo Usar las Nuevas Características

### Agregar una Moneda Personalizada

1. Ve a "Tasas de Cambio"
2. Click en botón "Monedas"
3. Click en "+ Agregar Moneda Personalizada"
4. Ingresa código (ej: MXN), nombre (ej: Peso Mexicano), símbolo (ej: $)
5. Click "Agregar"

### Crear una Tasa de Cambio

1. Click en "+ Nueva Tasa"
2. Selecciona moneda "De" y "A" (ahora son selectores dinámicos)
3. Ingresa la tasa
4. Click "Guardar Tasa"

**Nota:** No importa en qué dirección ingreses la tasa (USD→VES o VES→USD), el sistema la guardará normalizada y mostrará ambas direcciones.

### Usar la Calculadora

1. Click en botón "Calculadora"
2. Ingresa el monto a convertir
3. Selecciona la moneda base
4. Ve las conversiones automáticas a todas las demás monedas
5. Click en "Copiar" para copiar un valor

---

## ⚠️ Breaking Changes

### Para Desarrolladores

Si tienes código personalizado que usa el servicio `exchangeRates`:

**Antes:**
```javascript
const rate = await getCurrentRate('USD', 'VES')
console.log(rate.rate) // 95.50
```

**Ahora:**
```javascript
const rate = await getCurrentRate('USD', 'VES')
console.log(rate.rate) // 95.50 (puede estar invertido automáticamente)
```

El servicio ahora busca tasas normalizadas y calcula inversas automáticamente.

### Para Usuarios

- **Duplicados Existentes:** Al aplicar las migraciones, se eliminan duplicados automáticamente (se mantiene el más reciente)
- **Sin Impacto:** Las tasas existentes siguen funcionando, solo se agregan las columnas de normalización

---

## 🐛 Bugs Corregidos

- ✅ Ya no se crean tasas duplicadas al ingresar la misma conversión en ambas direcciones
- ✅ Los selectores de monedas ahora son dinámicos en lugar de hardcoded
- ✅ La búsqueda de tasas es más eficiente (1 query en lugar de 2)

---

## 📝 Notas de Migración

### Aplicar Migraciones

```bash
cd finance-app
supabase db push
```

O manualmente desde el SQL Editor de Supabase:

1. Ejecutar `20260209_create_currencies_table.sql`
2. Ejecutar `20260209_remove_currency_constraints.sql`
3. Ejecutar `20260209_prevent_duplicate_rates.sql`

### Verificación Post-Migración

```sql
-- Debe retornar 8 monedas del sistema
SELECT COUNT(*) FROM currencies WHERE is_system = true;

-- No debe haber duplicados
SELECT normalized_from, normalized_to, COUNT(*)
FROM exchange_rates
WHERE is_current = true
GROUP BY normalized_from, normalized_to
HAVING COUNT(*) > 1;
```

---

## 🔮 Mejoras Futuras Propuestas

- [ ] Conversiones cruzadas avanzadas (vía múltiples tasas intermedias)
- [ ] Importar tasas desde APIs externas para más monedas
- [ ] Gráficos históricos de tasas en la calculadora
- [ ] Exportar historial de conversiones
- [ ] Alertas cuando una tasa se desactualiza
- [ ] Sincronización automática de tasas (scheduler)

---

## 👥 Créditos

**Desarrollado por:** Claude (Sonnet 4.5)
**Fecha:** 2026-02-09
**Basado en:** Plan de Mejoras: Sistema de Tasas de Cambio

---

## 📞 Soporte

Si encuentras algún problema:

1. Verifica que las migraciones se aplicaron correctamente
2. Revisa la consola del navegador para errores de JavaScript
3. Revisa los logs de Supabase para errores de BD
4. Consulta el `README.md` en `supabase/migrations/`
