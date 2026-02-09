# PLAN DE DESARROLLO - Finance App

---

# AUDITORÍA COMPLETA Y PLAN DE CORRECCIONES

> Auditoría realizada el 2026-02-06 sobre todo el código fuente del proyecto.
> Organizada en 6 fases de implementación, ordenadas por criticidad.
> Cada fase debe completarse antes de pasar a la siguiente.
>
> **ESTADO: TODAS LAS 6 FASES COMPLETADAS (2026-02-08)**

---

## FASE 1 — Seguridad y Protección de Datos

> **Prioridad: CRÍTICA**
> Estos problemas exponen datos de usuarios, permiten ataques, o causan
> vulnerabilidades de seguridad reales. En una app multi-usuario son inaceptables.

---

### 1.1 — Caché del Service Worker almacena tokens de autenticación

**Archivo:** `vite.config.js` (líneas 44-58)

**El problema:**
El service worker (PWA) está configurado con un regex que cachea TODAS las respuestas
de Supabase:

```javascript
urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
```

Esto incluye endpoints de autenticación como `/auth/v1/token` y `/auth/v1/session`.
En un dispositivo compartido (o navegador compartido), si el Usuario A inicia sesión
y luego cierra sesión, su token queda almacenado en el caché del service worker.
Cuando el Usuario B inicia sesión, el service worker podría servirle datos cacheados
del Usuario A (el caché dura 24 horas).

**La solución:**
Excluir los endpoints de `/auth/` del patrón de caché. Cambiar el regex a algo como:

```javascript
urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
```

O agregar una condición que excluya rutas que contengan `/auth/`.
También se debería considerar reducir `maxAgeSeconds` de 24 horas a algo más razonable
como 5 minutos para datos que cambian frecuentemente.

**Además:** `devOptions.enabled: true` (línea 62) mantiene el service worker activo en
desarrollo, lo que causa problemas de caché al desarrollar. Debería ser `false`.

---

### 1.2 — Inyección de fórmulas en exportación CSV

**Archivo:** `src/services/export.js` (líneas 44-57)

**El problema:**
La función de escape CSV solo maneja comas y comillas dobles, pero NO escapa celdas
que comienzan con caracteres especiales de fórmulas: `=`, `+`, `-`, `@`, `\t`, `\r`.

Si un usuario crea una transacción con descripción:
```
=HYPERLINK("http://sitio-malicioso.com","Haz click aquí")
```

Al exportar a CSV y abrir en Excel/Google Sheets, eso se ejecuta como fórmula.
Esto se conoce como "CSV Injection" o "Formula Injection" y es un ataque conocido
(OWASP lo documenta).

**La solución:**
Antes de escribir cada celda en el CSV, verificar si el primer carácter es uno de
`= + - @ \t \r`. Si lo es, prefijar la celda con una comilla simple `'` que Excel
interpreta como texto literal:

```javascript
function escapeCSVCell(value) {
  let str = String(value)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str
  }
  // ... resto del escape existente de comas y comillas
}
```

---

### 1.3 — XSS en el reporte "PDF"

**Archivo:** `src/services/export.js` (líneas 380-468)

**El problema:**
`generatePDFReport` construye HTML interpolando directamente datos del usuario:

```javascript
${cat}          // nombre de categoría (línea 436)
${w.name}       // nombre de wallet (línea 456)
${monthName}    // nombre del mes (línea 385)
```

Si alguien nombra una categoría `<img src=x onerror=alert(document.cookie)>`,
ese HTML se inyecta directamente via `document.write()` en una ventana nueva.
Es un ataque XSS almacenado (Stored XSS).

**La solución:**
Crear una función helper para escapar HTML:

```javascript
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
```

Aplicarla a TODOS los valores interpolados en el template HTML.

---

### 1.4 — Importación JSON sin validación

**Archivo:** `src/services/export.js` (líneas 188-343) y `src/pages/Settings/Settings.jsx`

**El problema:**
La importación acepta cualquier archivo JSON sin validar:
- No hay límite de tamaño del archivo (un archivo de 2 GB crashea el navegador)
- No se valida el esquema/estructura del JSON
- No se validan tipos de datos (amount podría ser un string, type cualquier cosa)
- No se validan rangos (cantidades negativas, números gigantes)
- No se validan longitudes de strings

**La solución:**
1. En `Settings.jsx`: validar tamaño máximo del archivo (ej: 10 MB) antes de leerlo
2. En `export.js`: validar que el JSON tenga la estructura esperada (`data.wallets`,
   `data.categories`, `data.transactions` como arrays)
3. Validar tipos y rangos básicos de cada registro antes de insertarlo

---

### 1.5 — Null user en todos los servicios (sesión expirada = crash)

**Archivos afectados:**
- `src/services/transactions.js` (líneas 65, 136)
- `src/services/wallets.js` (línea 25)
- `src/services/categories.js` (línea 14)
- `src/services/budgets.js` (línea 18)
- `src/services/exchangeRates.js` (línea 28)
- `src/services/recurring.js` (líneas 29, 120)
- `src/services/export.js` (línea 203)

**El problema:**
Todos los servicios hacen:

```javascript
const { data: { user } } = await supabase.auth.getUser()
```

Si la sesión ha expirado, `user` es `null`. La siguiente línea accede a `user.id`,
lo que lanza `TypeError: Cannot read properties of null (reading 'id')`.

El usuario ve un error genérico o la app se rompe silenciosamente.

**La solución:**
Crear un helper centralizado en `src/utils/auth.js`:

```javascript
export async function getAuthenticatedUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.')
  }
  return user
}
```

Reemplazar TODAS las llamadas a `supabase.auth.getUser()` por este helper.
En los componentes, capturar este error específico y redirigir al login.

---

## FASE 2 — Integridad de Datos

> **Prioridad: ALTA**
> Estos bugs causan datos corruptos, inconsistentes o perdidos.
> Pueden pasar desapercibidos hasta que el usuario nota que sus números no cuadran.

---

### 2.1 — Transferencias no son atómicas (el dinero puede desaparecer)

**Archivo:** `src/services/transactions.js` (líneas 139-213)

**El problema:**
`createTransfer` ejecuta 3 operaciones secuenciales:
1. Inserta la transacción de salida (débito) → línea 168
2. Inserta la transacción de entrada (crédito) → línea 188
3. Vincula ambas transacciones → línea 209

Si el paso 2 falla (error de red, constraint de BD, etc.), el débito ya existe
en la base de datos. El dinero "desapareció" del wallet de origen pero nunca
llegó al destino. No hay rollback ni compensación.

**La solución:**
Crear una función RPC (stored procedure) en Supabase que ejecute las 3 operaciones
dentro de una transacción de base de datos:

```sql
CREATE OR REPLACE FUNCTION create_transfer(
  p_user_id UUID,
  p_from_wallet_id UUID,
  p_to_wallet_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_date TIMESTAMPTZ,
  p_exchange_rate DECIMAL DEFAULT NULL,
  p_amount_usd DECIMAL DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_out_id UUID;
  v_in_id UUID;
BEGIN
  -- Insertar débito
  INSERT INTO transactions (...) VALUES (...) RETURNING id INTO v_out_id;
  -- Insertar crédito
  INSERT INTO transactions (...) VALUES (...) RETURNING id INTO v_in_id;
  -- Vincular ambas
  UPDATE transactions SET linked_transaction_id = v_in_id WHERE id = v_out_id;
  UPDATE transactions SET linked_transaction_id = v_out_id WHERE id = v_in_id;
  -- Si cualquier paso falla, PostgreSQL hace rollback automático
  RETURN jsonb_build_object('out_id', v_out_id, 'in_id', v_in_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

En el frontend, llamar `supabase.rpc('create_transfer', {...})`.

---

### 2.2 — Eliminación de transacciones vinculadas no verifica errores

**Archivo:** `src/services/transactions.js` (líneas 227-238)

**El problema:**
Al borrar una transacción que es parte de una transferencia, se desvincula y borra
la transacción vinculada, pero sin verificar errores en ningún paso:

```javascript
// Estas 3 operaciones no tienen verificación de error:
await supabase.from('transactions').update({linked_transaction_id: null})...
await supabase.from('transactions').update({linked_transaction_id: null})...
await supabase.from('transactions').delete()...
```

Si alguna falla, se borra la transacción principal pero queda una transacción
huérfana en la base de datos.

**La solución:**
Verificar el resultado de cada operación. Idealmente, también mover esto a una
stored procedure para hacerlo atómico. Alternativamente, verificar cada `error`:

```javascript
const { error: e1 } = await supabase.from('transactions')...
if (e1) throw new Error('Error al desvincular transacciones')
```

---

### 2.3 — No se valida que la tasa de cambio sea mayor que cero

**Archivo:** `src/services/exchangeRates.js` (línea 46)

**El problema:**
`setRate` inserta la tasa directamente sin validarla. Una tasa de `0` causa
división por cero en `transactions.js` línea 102 (`amount / exchangeRate`).
Una tasa negativa corrompe todas las conversiones.

**La solución:**
Agregar validación antes del insert:

```javascript
if (!rate || rate <= 0 || !isFinite(rate)) {
  throw new Error('La tasa de cambio debe ser un número positivo')
}
```

---

### 2.4 — Se puede cambiar la moneda de un wallet existente

**Archivo:** `src/pages/Wallets/WalletForm.jsx` (líneas 88-92)

**El problema:**
El formulario de edición de wallet permite cambiar la moneda. Si un wallet tiene
transacciones en VES y el usuario cambia la moneda a USD, todas las transacciones
existentes siguen registradas en VES pero ahora el wallet dice ser USD. Los cálculos
de balance se corrompen.

**La solución:**
Deshabilitar el campo `<select>` de moneda cuando se está editando un wallet
existente (`wallet` prop está presente):

```jsx
<select disabled={!!wallet} ...>
```

Agregar un texto explicativo tipo "La moneda no se puede cambiar después de crear
el wallet" cuando está en modo edición.

---

### 2.5 — Tasa de cambio = 0 en el formulario produce Infinity

**Archivo:** `src/pages/Transactions/TransactionForm.jsx`

**El problema:**
Si el usuario borra el campo de tasa de cambio:

```javascript
onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
```

`parseFloat("")` es `NaN`, luego `NaN || 0` da `0`. Después, la conversión a USD
hace `amount / 0 = Infinity`, que se muestra al usuario.

**La solución:**
Usar un valor mínimo en lugar de 0:

```javascript
onChange={(e) => setExchangeRate(Math.max(0.0001, parseFloat(e.target.value) || 0.0001))}
```

Y agregar validación antes de enviar: no permitir enviar si la tasa es 0 o menor.

---

### 2.6 — `transactions.currency` no tiene CHECK constraint

**Archivo:** `supabase/schema.sql` (línea 87)

**El problema:**
`wallets.currency` tiene `CHECK (currency IN ('VES', 'USDT', 'USD'))` pero
`transactions.currency` acepta cualquier string. Una inserción con `currency = 'EUR'`
o `currency = ''` es válida para la BD pero rompe toda la lógica de conversión.

**La solución:**
Agregar migration:

```sql
ALTER TABLE transactions
ADD CONSTRAINT transactions_currency_check
CHECK (currency IN ('VES', 'USDT', 'USD'));
```

---

### 2.7 — `linked_transaction_id ON DELETE SET NULL` crea transferencias huérfanas

**Archivo:** `supabase/schema.sql` (línea 91)

**El problema:**
Cuando se borra una transacción que es parte de una transferencia, la transacción
vinculada queda con `linked_transaction_id = NULL`. Ahora es un `transfer_in` o
`transfer_out` sin contraparte, sin forma de detectar que está huérfana.

**La solución:**
Cambiar a `ON DELETE CASCADE` para que al borrar una mitad de la transferencia,
se borre la otra automáticamente:

```sql
ALTER TABLE transactions
DROP CONSTRAINT transactions_linked_transaction_id_fkey,
ADD CONSTRAINT transactions_linked_transaction_id_fkey
  FOREIGN KEY (linked_transaction_id)
  REFERENCES transactions(id)
  ON DELETE CASCADE;
```

**Nota:** Esto requiere cuidado — un CASCADE en ambas direcciones podría causar
un loop. Hay que probar que PostgreSQL maneje esto correctamente (normalmente sí,
ya que SET NULL rompe el ciclo).

---

### 2.8 — La importación pierde `amount_usd` y vínculos de transferencia

**Archivo:** `src/services/export.js` (líneas 267-283)

**El problema:**
El mapeo de transacciones durante la importación no incluye `amount_usd` ni
`linked_transaction_id`:

```javascript
// Campos que se mapean:
user_id, wallet_id, category_id, type, amount, currency,
exchange_rate, description, date
// Campos que se PIERDEN:
amount_usd, linked_transaction_id
```

Después de importar, todas las transferencias aparecen como transacciones
individuales sin vínculo, y las analíticas que dependen de `amount_usd`
muestran $0 para transacciones VES.

**La solución:**
Incluir `amount_usd` directamente en el mapeo. Para `linked_transaction_id`,
se necesita un paso adicional post-inserción que re-vincule las transferencias
usando el `idMap` generado durante la importación.

---

## FASE 3 — Lógica de Negocio Rota

> **Prioridad: ALTA**
> Estos bugs hacen que funcionalidades enteras muestren datos incorrectos.
> El usuario ve números que no cuadran, gráficas vacías, o comportamientos inesperados.

---

### 3.1 — `convertToUSD` en presupuestos NO encuentra tasas

**Archivo:** `src/services/budgets.js` (líneas 112-131)

**El problema:**
La función `convertToUSD` en presupuestos busca tasas así:

```javascript
// Busca: from_currency === 'VES' (directo)
const directRate = rates.find(r => r.from_currency === currency && r.to_currency === 'USD')
// Busca: from_currency === 'USD' && to_currency === 'VES' (inverso)
const inverseRate = rates.find(r => r.from_currency === 'USD' && r.to_currency === currency)
```

Pero la base de datos almacena tasas como `USD → VES` (ej: rate = 36.5).
El paso "directo" busca `VES → USD` que NO EXISTE.
El paso "inverso" busca `USD → VES` y SÍ lo encuentra, pero hace `amount / rate`,
lo cual es correcto solo si la tasa es VES-por-USD.

**Mientras tanto, en `analytics.js`** (línea 178), `convertToUSD` tiene una
implementación DIFERENTE que busca solo `from_currency === 'USD'`, y si no
encuentra tasa, devuelve el monto SIN convertir (tratando VES como si fuera USD).

**La solución:**
Crear UNA SOLA función `convertToUSD` en `src/utils/currency.js`:

```javascript
export function convertToUSD(amount, currency, rates) {
  if (currency === 'USD' || currency === 'USDT') return amount

  // Buscar tasa directa: USD → VES (la dirección que se guarda en la BD)
  const rate = rates.find(r =>
    r.from_currency === 'USD' && r.to_currency === currency && r.is_current
  )
  if (rate && parseFloat(rate.rate) > 0) {
    return amount / parseFloat(rate.rate)
  }

  // Buscar inversa: VES → USD
  const inverse = rates.find(r =>
    r.from_currency === currency && r.to_currency === 'USD' && r.is_current
  )
  if (inverse && parseFloat(inverse.rate) > 0) {
    return amount * parseFloat(inverse.rate)
  }

  return null // Explícitamente indicar que no se pudo convertir
}
```

Reemplazar las dos implementaciones existentes por esta.

---

### 3.2 — Transacciones VES sin `amount_usd` se excluyen de analíticas

**Archivo:** `src/services/analytics.js` (líneas 37-39, 87-89, 143-145, 221-223)

**El problema:**
El patrón se repite 4 veces en analytics:

```javascript
const amountUsd = tx.amount_usd != null
  ? parseFloat(tx.amount_usd)
  : (tx.currency === 'USD' || tx.currency === 'USDT' ? parseFloat(tx.amount) : 0)
```

Si una transacción VES no tiene `amount_usd` (porque no había tasa al crearla),
contribuye `0` a las estadísticas. El usuario no recibe ningún aviso de que sus
gastos en VES están siendo ignorados.

**La solución:**
1. Usar la función unificada `convertToUSD` de la Fase 3.1 como fallback
2. Cuando la conversión no es posible, acumular esas transacciones y mostrar un
   aviso al usuario: "X transacciones en VES no se pudieron convertir a USD"

---

### 3.3 — Click en gráfica de categorías no filtra transacciones

**Archivo:** `src/pages/Analytics/Analytics.jsx` (línea 68)

**El problema:**

```javascript
navigate(`/transactions?category=${category.id}`)
//                       ^^^^^^^^ singular
```

Pero `TransactionFilters` / `parseFiltersFromUrl` espera el parámetro `categories`
(plural). El filtro simplemente se ignora y el usuario ve todas las transacciones.

**La solución:**
Cambiar a:

```javascript
navigate(`/transactions?categories=${category.id}`)
```

---

### 3.4 — Loop de recurrentes sin límite + overflow de meses

**Archivo:** `src/services/recurring.js` (líneas 119-183)

**El problema 1 — Loop sin límite:**
Si un recurrente diario se creó hace un año y nunca se procesó, el `while` loop
intenta crear 365 transacciones, una por una, secuencialmente. Esto puede tardar
minutos y crear cientos de transacciones que el usuario no esperaba.

**El problema 2 — Overflow de meses:**
`date.setMonth(date.getMonth() + 1)` con día 31 de enero produce 3 de marzo
(JavaScript hace overflow). Un recurrente mensual del día 31 salta febrero.

**La solución para el loop:**
Agregar un máximo de transacciones por ejecución (ej: 30) y un log al usuario
de cuántas se procesaron:

```javascript
const MAX_BATCH = 30
let count = 0
while (currentDate <= today && count < MAX_BATCH) {
  // ... crear transacción
  count++
}
```

**La solución para el overflow:**
Usar una función que respete el último día del mes:

```javascript
function addMonths(date, months) {
  const result = new Date(date)
  const day = result.getDate()
  result.setMonth(result.getMonth() + months)
  // Si el día cambió (overflow), usar último día del mes anterior
  if (result.getDate() !== day) {
    result.setDate(0) // último día del mes anterior
  }
  return result
}
```

---

### 3.5 — Dashboard compara fechas como strings

**Archivo:** `src/pages/Dashboard/Dashboard.jsx` (línea 51)

**El problema:**

```javascript
const thisMonth = allTx.filter((t) => t.date >= startOfMonth)
```

`t.date` puede ser `"2026-02-01"` (solo fecha) y `startOfMonth` puede ser
`"2026-02-01T00:00:00.000Z"` (ISO completo). La comparación lexicográfica
de strings da resultados incorrectos porque `"2026-02-01" < "2026-02-01T..."`.

**La solución:**
Comparar como objetos Date:

```javascript
const thisMonth = allTx.filter((t) => new Date(t.date) >= new Date(startOfMonth))
```

---

### 3.6 — Cálculos de período en presupuestos tienen bugs de DST y overflow

**Archivo:** `src/services/budgets.js` (líneas 65-101)

**Los problemas:**
1. **DST (línea 73):** El cálculo semanal divide por `24 * 60 * 60 * 1000` (exactamente
   24 horas). Pero al cruzar DST, un día puede tener 23 o 25 horas, desfasando el
   cálculo de `daysSinceStart` y por ende toda la semana.

2. **Overflow mensual (línea 81-88):** Mismo bug que en recurring.js. Si `start_date`
   es enero 31 y el mes actual es febrero, `new Date(year, month, 31)` da marzo 3.

3. **Período desconocido (línea 65):** Si `period` no es 'weekly', 'monthly' o 'yearly',
   `periodStart` y `periodEnd` quedan `undefined`, y `.toISOString()` en la línea 141
   lanza `TypeError`.

**La solución:**
- Usar la misma función `addMonths` de 3.4 para el cálculo mensual
- Para semanal, usar `Math.round` en vez de `Math.floor` para compensar DST
- Agregar un `default` case que lance un error descriptivo

---

### 3.7 — Función scheduled de BCV completamente rota

**Archivo:** `supabase/migrations/20260205_scheduled_bcv_rate.sql`

**Hay 3 problemas independientes:**

**Problema 1 — Extensión incorrecta (líneas 2-3 vs 27):**
Se habilita `pg_net` pero se usa `http_get()` que pertenece a la extensión `http`.
La función falla en runtime con `function http_get(text) does not exist`.

**Problema 2 — Tasa guardada bajo un solo usuario (línea 18):**
```sql
SELECT id INTO system_user_id FROM auth.users LIMIT 1;
```
La tasa BCV se guarda con el `user_id` del primer usuario de la tabla. Por RLS,
los demás usuarios NUNCA ven esta tasa. La función es inútil para todos excepto uno.

**Problema 3 — Solo actualiza USD → VES (líneas 38-43):**
No hay scheduled job para USDT → VES. Las tasas de USDT siempre requieren
actualización manual.

**La solución:**
Reescribir completamente la función. Opciones:
- **Opción A:** Crear una tabla `global_exchange_rates` sin `user_id` ni RLS,
  y que la función scheduled la actualice. Los servicios del frontend leen de ahí.
- **Opción B:** La función scheduled inserta la tasa para TODOS los usuarios activos
  (loop sobre `auth.users`). Más sencillo pero no escala.
- **Opción C:** Las tasas automáticas se guardan con `user_id = NULL` y una política
  RLS permite a todos leer tasas con `user_id IS NULL OR user_id = auth.uid()`.

La Opción C es probablemente la más limpia.

---

## FASE 4 — UX y Estabilidad de la App

> **Prioridad: MEDIA**
> Estos problemas degradan la experiencia del usuario, causan confusión visual,
> o hacen que la app se quede colgada en ciertas situaciones.

---

### 4.1 — La app se cuelga si hay error de red al iniciar

**Archivo:** `src/contexts/AuthContext.jsx` (líneas 10-15)

**El problema:**
```javascript
supabase.auth.getSession().then(({ data: { session } }) => {
  setUser(session?.user ?? null)
  setLoading(false)
})
// No hay .catch() — si falla, setLoading(false) nunca se ejecuta
```

Si hay un error de red al cargar la app, `getSession()` falla y `loading` se queda
en `true` para siempre. El usuario ve un spinner infinito sin explicación.

**La solución:**
```javascript
supabase.auth.getSession()
  .then(({ data: { session } }) => {
    setUser(session?.user ?? null)
  })
  .catch((err) => {
    console.error('Error al obtener sesión:', err)
  })
  .finally(() => {
    setLoading(false)
  })
```

---

### 4.2 — No hay ruta 404

**Archivo:** `src/App.jsx` (líneas 28-44)

**El problema:**
Si el usuario navega a `/ruta-que-no-existe`, React Router no encuentra ninguna
`<Route>` que coincida y renderiza nada. El usuario ve una página completamente en
blanco dentro del layout.

**La solución:**
Agregar una ruta catch-all al final:

```jsx
<Route path="*" element={<NotFound />} />
```

Crear un componente simple `NotFound.jsx` que muestre un mensaje amigable con
un enlace de vuelta al dashboard.

---

### 4.3 — No hay Error Boundary global

**Archivo:** `src/main.jsx`

**El problema:**
Si cualquier componente lanza un error durante el render (TypeError, error de
datos inesperados, etc.), toda la app crashea a una pantalla blanca.
React no se recupera de errores de render sin un Error Boundary.

**La solución:**
Crear un componente `ErrorBoundary.jsx` y envolver `<App />` con él:

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h1>Algo salió mal</h1>
          <p>Intenta recargar la página</p>
          <button onClick={() => window.location.reload()}>Recargar</button>
        </div>
      )
    }
    return this.props.children
  }
}
```

---

### 4.4 — Búsqueda sin debounce genera una petición API por tecla

**Archivo:** `src/pages/Transactions/TransactionFilters.jsx` (línea 100)

**El problema:**
```javascript
onChange={(e) => onChange({ ...filters, search: e.target.value || null })}
```

Cada carácter que el usuario escribe dispara `onChange` → actualiza `filters` →
el `useEffect` de `Transactions.jsx` llama a `loadTransactions`. Si el usuario
escribe "comida" (6 caracteres), se hacen 6 peticiones API en ~1 segundo.

**La solución:**
Implementar debounce con un state local para el input y un `useEffect` con timer:

```javascript
const [searchInput, setSearchInput] = useState(filters.search || '')

useEffect(() => {
  const timer = setTimeout(() => {
    onChange({ ...filters, search: searchInput || null })
  }, 300)
  return () => clearTimeout(timer)
}, [searchInput])
```

El `<input>` usa `searchInput` / `setSearchInput`, y el filtro real solo se
actualiza 300ms después de que el usuario deja de escribir.

---

### 4.5 — Dashboard carga 1000 transacciones innecesariamente

**Archivo:** `src/pages/Dashboard/Dashboard.jsx` (línea 38)

**El problema:**
```javascript
const { data: allTx } = await fetchTransactions({ limit: 1000 })
```

El dashboard solo necesita:
- 5 transacciones recientes (para la lista)
- Totales del mes actual (ingreso/gasto)

Pero carga las últimas 1000 transacciones y las procesa en el frontend.

**La solución:**
Hacer 2 queries separados y más pequeños:
1. `fetchTransactions({ limit: 5 })` para las transacciones recientes
2. `fetchTransactions({ dateFrom: startOfMonth, dateTo: endOfMonth })` para los
   totales del mes, o idealmente una query agregada con `SUM` en el backend.

---

### 4.6 — Posible loop infinito de renders en TransactionForm

**Archivo:** `src/pages/Transactions/TransactionForm.jsx` (líneas 73-78)

**El problema:**
```javascript
useEffect(() => {
  const valid = filteredCategories.find((c) => c.id === categoryId)
  if (!valid && filteredCategories.length > 0) {
    setCategoryId(filteredCategories[0].id)
  }
}, [type, filteredCategories])
```

`filteredCategories` es `categories.filter(...)` que crea un array NUEVO en cada
render. Como la referencia cambia en cada render, el `useEffect` se ejecuta en cada
render. Si `setCategoryId` dispara un re-render, se crea un ciclo.

**La solución:**
Memoizar `filteredCategories`:

```javascript
const filteredCategories = useMemo(
  () => categories.filter((c) => c.type === type),
  [categories, type]
)
```

---

### 4.7 — Dark mode automático no funciona

**Archivo:** `src/contexts/ThemeContext.jsx` (líneas 42-55)

**El problema:**
El primer `useEffect` (línea 27-39) SIEMPRE escribe en `localStorage`:

```javascript
localStorage.setItem('theme', theme)
```

Luego, el listener de preferencia del sistema (línea 42-55) verifica:

```javascript
const savedTheme = localStorage.getItem('theme')
if (!savedTheme) { // <— NUNCA es null, siempre hay un valor guardado
  setTheme(e.matches ? 'dark' : 'light')
}
```

Como `localStorage` siempre tiene un valor (guardado por el primer effect), la
condición `!savedTheme` siempre es `false`, y el listener nunca cambia el tema.

**La solución:**
Diferenciar entre "el usuario eligió un tema manualmente" y "el tema se estableció
automáticamente". Por ejemplo, guardar en localStorage solo cuando el usuario
hace toggle explícitamente (en `toggleTheme`), no en el effect de sincronización.

---

## FASE 5 — Código Duplicado y Mantenibilidad

> **Prioridad: MEDIA-BAJA**
> Estos no son bugs per se, pero hacen que el código sea frágil, difícil de mantener,
> e inconsistente. Arreglarlos facilita todo el trabajo futuro.

---

### 5.1 — Crear `src/utils/currency.js`

**Código duplicado a centralizar:**

```
CURRENCY_SYMBOLS = { VES: 'Bs', USD: '$', USDT: 'USDT' }
```
Definido independientemente en:
- `Dashboard.jsx`
- `WalletCard.jsx`
- `TransactionItem.jsx`
- `RecurringCard.jsx`

```
formatAmount(value) → parseFloat(value).toLocaleString('es-VE', {...})
```
Definido en 7+ archivos.

```
convertToUSD(amount, currency, rates)
```
2 implementaciones incompatibles en `budgets.js` y `analytics.js`.

**La solución:**
Crear `src/utils/currency.js` con las 3 funciones exportadas. Reemplazar todas
las definiciones locales por imports de este archivo.

---

### 5.2 — Crear `src/utils/auth.js`

Como se describió en la Fase 1.5, centralizar `getAuthenticatedUser()` y
reemplazar las 7+ llamadas directas a `supabase.auth.getUser()`.

---

### 5.3 — Crear `src/utils/date.js`

**Funciones a centralizar:**
- `addMonths(date, months)` — con manejo correcto de overflow
- `getStartOfMonth(date)` / `getEndOfMonth(date)`
- `getStartOfWeek(date, startDay)` — con lunes como inicio para locale español
- `compareDates(a, b)` — comparación segura que funciona con strings ISO y Date
- `getCurrentPeriodRange(period, startDate)` — extraer de `budgets.js`

**Nota sobre la semana:** `TransactionFilters.jsx` usa domingo como inicio de
semana (`getDay()` retorna 0 para domingo). Para usuarios en Venezuela y
Latinoamérica, la semana debería empezar en lunes.

---

### 5.4 — Agregar `useCallback` en handlers pasados como props

**Archivos afectados:** Wallets.jsx, Categories.jsx, Budgets.jsx, Recurring.jsx

Actualmente, funciones como `onEdit`, `onDelete`, `onToggle` se definen como
funciones regulares dentro del componente. Cada render crea nuevas referencias,
causando re-renders innecesarios en los componentes hijos (Cards).

No es crítico con pocas entradas, pero se vuelve notable con listas largas.

---

### 5.5 — Corregir patrón de delete optimista con stale closures

**Archivos:** `Budgets.jsx` (línea 57), `Recurring.jsx` (línea 78)

**El problema:**
```javascript
setBudgets(budgets.filter((b) => b.id !== deleteConfirm.id))
```

`budgets` es el valor capturado en el closure al momento de definir la función.
Si el estado cambió desde entonces (ej: por un `loadData()` concurrente), el
filter opera sobre datos obsoletos.

**La solución:**
Usar la forma funcional del setter:

```javascript
setBudgets(prev => prev.filter((b) => b.id !== deleteConfirm.id))
```

O simplemente llamar `loadData()` después del delete, como hacen `handleCreate`
y `handleUpdate`.

---

## FASE 6 — Accesibilidad (WCAG)

> **Prioridad: BAJA (pero importante para usuarios con discapacidades)**
> Estos problemas impiden que la app sea usable con lectores de pantalla,
> navegación por teclado, o alto contraste.

---

### 6.1 — Botones de solo ícono sin `aria-label`

**Archivos afectados:**
- `WalletCard.jsx` (líneas 39-56)
- `CategoryItem.jsx` (líneas 13-30)
- `BudgetCard.jsx` (líneas 76-153)
- `RecurringCard.jsx`

Todos los botones de editar/eliminar solo tienen un `title` pero no `aria-label`.
Los lectores de pantalla leen el contenido del SVG (nada útil) o simplemente "botón".

**La solución:**
Agregar `aria-label` a cada botón:

```jsx
<button aria-label="Editar wallet" title="Editar" ...>
<button aria-label="Eliminar wallet" title="Eliminar" ...>
```

---

### 6.2 — Modal sin accesibilidad de teclado ni ARIA

**Archivo:** `src/components/ui/Modal.jsx`

**Problemas:**
1. No tiene `role="dialog"` ni `aria-modal="true"`
2. No se cierra con la tecla Escape
3. No tiene focus trap (el usuario puede Tab fuera del modal hacia la página de atrás)
4. No mueve el foco al modal al abrirlo

**La solución:**
Agregar:
- `role="dialog"` y `aria-modal="true"` al contenedor
- `aria-labelledby` apuntando al título
- Handler de `onKeyDown` para Escape → `onClose()`
- Focus trap usando `useEffect` + `useRef` que capture Tab
- Auto-focus al primer elemento interactivo o al contenedor al abrir

---

### 6.3 — Mensajes de error dinámicos sin `aria-live`

**Archivos afectados:** Login.jsx, Register.jsx, todos los formularios

Cuando aparece un error (ej: "Credenciales incorrectas"), el mensaje se renderiza
dinámicamente pero no tiene `aria-live="polite"`. Los lectores de pantalla no
anuncian el error.

**La solución:**
Envolver los contenedores de error con:

```jsx
<div role="alert" aria-live="polite">
  {error && <p className="text-red-500">{error}</p>}
</div>
```

---

### 6.4 — Color picker sin nombres accesibles

**Archivo:** `src/pages/Categories/CategoryForm.jsx` (líneas 122-133)

Los botones de selección de color no tienen texto, `aria-label`, ni `title`.
Un usuario con lector de pantalla no puede saber qué color está seleccionando.

**La solución:**
Agregar `aria-label` con el nombre del color:

```jsx
<button aria-label={`Color ${colorName}`} ...>
```

Se necesitaría un mapeo de hex a nombre legible (ej: `#ef4444` → "Rojo").

---

### 6.5 — Loading spinners ignoran dark mode

**Archivos:** `ProtectedRoute.jsx`, `PublicRoute.jsx` (línea 9)

```jsx
<div className="min-h-screen flex items-center justify-center bg-gray-50">
```

No hay clase `dark:bg-gray-900`. En dark mode, el usuario ve un flash blanco
brillante durante la carga inicial.

**La solución:**
Agregar:
```jsx
<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
```

---

## NOTAS ADICIONALES

### Cosas menores que no son bugs pero vale la pena considerar:

1. **Export CSV limitado a 10,000 transacciones silenciosamente**
   (`Settings.jsx` línea 32). Si el usuario tiene más, el export es incompleto
   sin aviso.

2. **Gráficas con grid invisible en dark mode**
   (`IncomeExpenseChart.jsx` y `BalanceLineChart.jsx` usan `stroke="#f0f0f0"`
   que es invisible sobre fondo oscuro).

3. **`getTimeAgo()` en `exchangeRates.js`** es una función de presentación/UI
   en un archivo de servicio/datos. Debería estar en un utils.

4. **`generatePDFReport` no genera un PDF** — genera HTML y abre diálogo de
   impresión. El nombre es engañoso. Además `window.open` puede ser bloqueado
   por el popup blocker.

5. **La función `exportToCSV` está marcada como `async`** pero no tiene ningún
   `await`. El `async` es innecesario.

6. **Colores de chart se repiten** con más de 6 wallets
   (`WalletDistributionChart.jsx` solo tiene 6 colores en el array).

7. **`processRecurringTransactions` se ejecuta en cada mount** del Dashboard,
   incluyendo double-mount de React StrictMode en desarrollo. No hay idempotencia
   del lado cliente.

8. **TransactionItem muestra el mismo color azul** para `transfer_in` y
   `transfer_out` — el ternario tiene ambas ramas idénticas.

9. **Errores silenciados con `.catch(() => {})`** en TransactionFilters,
   TransferForm, TransactionForm, Budgets, Recurring, Analytics.

10. **`ratesLoading` se obtiene del hook pero nunca se usa** en Dashboard —
    los totales se calculan mientras las tasas aún están cargando.
