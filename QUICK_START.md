# Guía Rápida - Sistema de Tasas de Cambio Mejorado

## 🚀 Inicio Rápido (5 minutos)

### Paso 1: Aplicar Migraciones en Supabase

**Opción A: Desde Supabase Dashboard (Más fácil)**

1. Abre [app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Copia y pega el contenido de cada archivo en orden:
   - `supabase/migrations/20260209_create_currencies_table.sql`
   - `supabase/migrations/20260209_remove_currency_constraints.sql`
   - `supabase/migrations/20260209_prevent_duplicate_rates.sql`
5. Ejecuta cada script (botón **Run**)

**Opción B: Usando Supabase CLI**

```bash
cd finance-app
supabase db push
```

### Paso 2: Verificar la Migración

Ejecuta en el SQL Editor de Supabase:

```sql
-- Debe retornar 8 monedas del sistema
SELECT * FROM currencies WHERE is_system = true;

-- No debe retornar filas (sin duplicados)
SELECT normalized_from, normalized_to, COUNT(*)
FROM exchange_rates
WHERE is_current = true
GROUP BY normalized_from, normalized_to
HAVING COUNT(*) > 1;
```

✅ Si el primer query retorna 8 filas y el segundo retorna 0 filas, ¡todo está bien!

### Paso 3: Probar la Aplicación

```bash
npm run dev
```

Abre `http://localhost:5173` y:

1. Ve a **Tasas de Cambio**
2. Prueba el botón **Monedas** (agregar una moneda personalizada)
3. Prueba el botón **Calculadora** (convertir entre monedas)
4. Crea una tasa de cambio con las nuevas monedas

---

## 🎯 ¿Qué cambió?

### Antes
- Solo 3 monedas: USD, VES, USDT
- Crear USD/VES y VES/USD generaba 2 filas (duplicado)
- No había calculadora

### Ahora
- **8 monedas del sistema** + monedas personalizadas ilimitadas
- **Sin duplicados**: USD/VES y VES/USD son la misma tasa
- **Calculadora integrada**: Convierte entre todas las monedas

---

## 📱 Cómo Usar las Nuevas Funcionalidades

### 1. Agregar una Moneda Personalizada

```
Tasas de Cambio → Botón "Monedas" → + Agregar Moneda Personalizada
```

Ejemplo:
- Código: `EUR`
- Nombre: `Euro`
- Símbolo: `€`

### 2. Crear una Tasa de Cambio

```
Tasas de Cambio → + Nueva Tasa
```

Ahora puedes seleccionar cualquier moneda disponible en los selectores.

**Importante:** No importa si creas USD/VES o VES/USD, el sistema guardará solo una versión y mostrará ambas direcciones automáticamente.

### 3. Usar la Calculadora

```
Tasas de Cambio → Botón "Calculadora"
```

1. Ingresa un monto (ej: 100)
2. Selecciona la moneda base (ej: USD)
3. Ve las conversiones automáticas a todas las demás monedas
4. Click en "Copiar" para copiar un valor

---

## ❓ Preguntas Frecuentes

### ¿Qué pasa con mis tasas existentes?

✅ Siguen funcionando perfectamente. La migración solo agrega nuevas columnas, no modifica las tasas existentes.

### ¿Se eliminaron mis tasas duplicadas?

⚠️ Si tenías USD/VES y VES/USD al mismo tiempo, la migración eliminó uno automáticamente (mantuvo el más reciente).

### ¿Puedo eliminar monedas del sistema?

❌ No. Las monedas del sistema (USD, VES, USDT, EUR, etc.) están protegidas. Solo puedes eliminar monedas personalizadas que tú hayas creado.

### ¿Puedo crear tasas entre cualquier par de monedas?

✅ Sí. Puedes crear tasas entre cualquier combinación de monedas (ej: EUR/ARS, GBP/COP, etc.).

### ¿Cómo funciona la normalización?

El sistema guarda todas las tasas en orden alfabético. Si creas VES/USD, el sistema lo convierte automáticamente a USD/VES (invirtiendo la tasa: 1/rate). Esto previene duplicados.

### ¿Afecta esto a mis transacciones existentes?

✅ No. Las transacciones usan las monedas de wallets, y eso no cambió. El sistema solo agregó flexibilidad para las tasas de cambio.

---

## 🐛 Solución de Problemas

### Error: "relation currencies does not exist"

**Causa:** Las migraciones no se aplicaron.

**Solución:** Aplica las migraciones siguiendo el Paso 1 de esta guía.

### Error: "duplicate key value violates unique constraint"

**Causa:** Intentas crear una tasa duplicada.

**Solución:** Ya existe una tasa para ese par de monedas. Actualízala en lugar de crear una nueva.

### No veo el botón "Monedas" o "Calculadora"

**Causa:** El build no se actualizó.

**Solución:**
```bash
npm run build
# O si estás en desarrollo:
npm run dev
```

### Las conversiones en la calculadora muestran "Sin tasa"

**Causa:** No hay tasas creadas para esas monedas.

**Solución:** Crea tasas de cambio para los pares que necesitas.

---

## 📚 Documentación Completa

- `CHANGELOG_EXCHANGE_RATES.md` - Todos los cambios detallados
- `IMPLEMENTATION_SUMMARY.md` - Resumen técnico de implementación
- `supabase/migrations/README.md` - Documentación de migraciones

---

## ✅ Checklist de Verificación

Después de aplicar las migraciones, verifica que todo funciona:

- [ ] Query de verificación retorna 8 monedas del sistema
- [ ] Query de duplicados retorna 0 filas
- [ ] Botón "Monedas" aparece en Tasas de Cambio
- [ ] Botón "Calculadora" aparece en Tasas de Cambio
- [ ] Puedes agregar una moneda personalizada
- [ ] Selectores de RateForm muestran todas las monedas
- [ ] Puedes crear una tasa de cambio
- [ ] RateCard muestra ambas direcciones de conversión
- [ ] Calculadora convierte entre todas las monedas con tasas
- [ ] Build termina sin errores: `npm run build`

---

## 🎉 ¡Listo!

Si completaste todos los pasos, el sistema está funcionando correctamente.

**Disfruta de:**
- 🌍 Monedas ilimitadas
- 🚫 Sin duplicados
- 🧮 Calculadora multi-moneda

---

**¿Necesitas ayuda?** Revisa los archivos de documentación o los comentarios en el código.
