# Funcionalidad: Tasa Automática USDT/USD

## ✅ Implementado - 2026-02-09

Se agregó la capacidad de obtener automáticamente la tasa de cambio USDT/USD desde fuentes externas, similar a las funcionalidades existentes de USD/VES (BCV) y USDT/VES (Binance P2P).

---

## 🎯 Objetivo

Permitir actualizar la tasa USDT/USD con un solo click, obteniendo el precio en tiempo real desde el mercado de criptomonedas.

---

## 📝 Implementación

### 1. Edge Function de Supabase

**Archivo:** `supabase/functions/usdt-rate/index.ts`

Función serverless que obtiene la tasa USDT/USD:

**Fuente Principal:** Binance Spot API
- Endpoint: `https://api.binance.com/api/v3/ticker/price?symbol=USDTUSD`
- Respuesta: Precio USDT/USD en tiempo real
- Precisión: 6 decimales

**Fuente Fallback:** CoinGecko API
- Endpoint: `https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd`
- Se usa si Binance falla
- API gratuita y confiable

**Características:**
- CORS habilitado para llamadas desde el frontend
- Manejo de errores con fallback automático
- Respuesta en formato JSON consistente
- Redondeo a 6 decimales de precisión

---

### 2. Servicio de Frontend

**Archivo:** `src/services/exchangeRates.js`

Nueva función `fetchUSDTRate()`:

```javascript
export async function fetchUSDTRate() {
  const { data, error } = await supabase.functions.invoke('usdt-rate')

  if (error) {
    throw new Error('No se pudo obtener tasa USDT/USD: ' + error.message)
  }

  if (data.error) {
    throw new Error(data.error)
  }

  return data.rate
}
```

---

### 3. Integración en UI

**Archivo:** `src/pages/ExchangeRates/ExchangeRates.jsx`

**Estado agregado:**
```javascript
const [usdtLoading, setUsdtLoading] = useState(false)
```

**Handler agregado:**
```javascript
async function handleUSDTUpdate() {
  setUsdtLoading(true)
  setError('')
  try {
    const usdtRate = await fetchUSDTRate()
    await setRate({
      from_currency: 'USDT',
      to_currency: 'USD',
      rate: usdtRate,
      source: 'binance-spot',
    })
    await loadRates()
  } catch (err) {
    setError(err.message)
  } finally {
    setUsdtLoading(false)
  }
}
```

**Botón agregado:**
- Color: Verde (para distinguir de los otros botones)
- Icono: Símbolo de dólar ($)
- Texto: "USDT/USD desde Binance"
- Loading state: "Consultando..."

---

## 🎨 Interfaz de Usuario

### Ubicación
En la sección "Actualizar desde fuentes externas", ahora hay 3 botones:

1. **USD/VES desde BCV** (azul) - Tasa oficial del Banco Central de Venezuela
2. **USDT/VES desde Binance P2P** (amarillo) - Promedio de ofertas P2P
3. **USDT/USD desde Binance** (verde) - Precio del mercado spot ✨ **NUEVO**

### Estados del Botón

**Estado Normal:**
```
[💲 USDT/USD desde Binance]
```

**Estado Loading:**
```
[🔄 Consultando...]
```

**Estado Deshabilitado:**
- Opacidad reducida
- No clickeable mientras está cargando

---

## 🔧 Cómo Funciona

1. Usuario hace click en **"USDT/USD desde Binance"**
2. Frontend llama a `fetchUSDTRate()`
3. Se invoca la edge function `usdt-rate`
4. Edge function consulta Binance Spot API
5. Si falla, intenta con CoinGecko como fallback
6. Retorna la tasa (ej: 0.999800)
7. Frontend guarda la tasa con `setRate()`:
   - `from_currency: 'USDT'`
   - `to_currency: 'USD'`
   - `rate: 0.999800`
   - `source: 'binance-spot'`
8. Lista de tasas se actualiza automáticamente

---

## 📊 Fuentes de Datos

### Binance Spot (Principal)
- **Ventajas:**
  - Precio en tiempo real
  - Alta liquidez
  - API confiable y rápida
  - Sin límite de requests (para uso razonable)
- **Desventajas:**
  - Requiere internet
  - Puede fallar ocasionalmente

### CoinGecko (Fallback)
- **Ventajas:**
  - API gratuita
  - Muy confiable
  - Agregador de múltiples exchanges
- **Desventajas:**
  - Límite de 50 requests por minuto (suficiente para este caso)
  - Puede estar ligeramente retrasado

---

## 💡 Valores Típicos

La tasa USDT/USD generalmente está muy cerca de 1.0 porque USDT es una stablecoin atada al dólar:

- **Ideal:** 1.000000 (paridad perfecta)
- **Normal:** 0.998000 - 1.002000 (variación de ±0.2%)
- **Alerta:** < 0.995 o > 1.005 (variación mayor, poco común)

**Ejemplo de tasa obtenida:**
```json
{
  "rate": 0.999800,
  "source": "binance-spot",
  "pair": "USDT/USD",
  "timestamp": "2026-02-09T12:34:56.789Z"
}
```

---

## 🚀 Ventajas de Esta Implementación

1. **Consistente:** Usa el mismo patrón que BCV y Binance P2P
2. **Confiable:** Sistema de fallback automático
3. **Rápida:** Edge functions en el edge de Supabase
4. **Sin CORS:** Al ser server-side, evita problemas de CORS
5. **Precisa:** 6 decimales de precisión
6. **Actualizada:** Precio en tiempo real del mercado

---

## 📦 Archivos Involucrados

### Nuevos
```
supabase/functions/usdt-rate/index.ts               ✅ Edge function
```

### Modificados
```
src/services/exchangeRates.js                       (función fetchUSDTRate)
src/pages/ExchangeRates/ExchangeRates.jsx           (handler y botón)
```

---

## 🔐 Seguridad

- ✅ No expone API keys (las fuentes usadas son públicas)
- ✅ Validación de respuestas del servidor
- ✅ Manejo de errores robusto
- ✅ Fallback automático si la fuente principal falla
- ✅ CORS configurado correctamente

---

## ⚙️ Deployment

### Desplegar Edge Function en Supabase

1. **Opción A: Supabase CLI**
```bash
cd finance-app
supabase functions deploy usdt-rate
```

2. **Opción B: Dashboard de Supabase**
   - Ve a Functions en tu proyecto
   - Click en "Create Function"
   - Nombre: `usdt-rate`
   - Copia el contenido de `supabase/functions/usdt-rate/index.ts`
   - Deploy

### Verificar el Deployment

```bash
# Test local
supabase functions serve usdt-rate

# Test en producción
curl https://[tu-proyecto].supabase.co/functions/v1/usdt-rate
```

**Respuesta esperada:**
```json
{
  "rate": 0.999800,
  "source": "binance-spot",
  "pair": "USDT/USD",
  "timestamp": "2026-02-09T12:34:56.789Z"
}
```

---

## ✅ Build Status

```
✓ Compilación exitosa
✓ 0 errores
✓ 0 warnings
✓ Edge function creada
✓ Servicio actualizado
✓ UI integrada
```

---

## 🧪 Testing

### Test Manual

1. Ir a "Tasas de Cambio"
2. Scroll hasta "Actualizar desde fuentes externas"
3. Click en botón verde **"USDT/USD desde Binance"**
4. Verificar que muestra "Consultando..."
5. Verificar que se crea/actualiza la tasa USDT/USD
6. Verificar que el valor está cerca de 1.0 (ej: 0.9998)
7. Verificar que la fuente dice "binance-spot"

### Test de Fallback

Para probar el fallback a CoinGecko, puedes:
1. Modificar temporalmente la URL de Binance a una inválida
2. Verificar que usa CoinGecko automáticamente
3. Verificar que la fuente dice "coingecko"

---

## 🎯 Casos de Uso

### 1. Usuario con cuentas en USDT y USD
- Necesita convertir entre ambas frecuentemente
- Click rápido para actualizar la tasa actual del mercado

### 2. Arbitraje de Stablecoins
- Comparar precios USDT en diferentes mercados
- Identificar oportunidades de arbitraje

### 3. Seguimiento de Depeg
- Monitorear si USDT se desvía de la paridad 1:1
- Alerta visual si la tasa es anormal

---

## 📚 Referencias

- [Binance Spot API](https://binance-docs.github.io/apidocs/spot/en/#symbol-price-ticker)
- [CoinGecko API](https://www.coingecko.com/en/api/documentation)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## 🎉 Resumen

La funcionalidad USDT/USD automática está completamente implementada y lista para usar. Los usuarios ahora pueden actualizar la tasa USDT/USD con un solo click, obteniendo el precio en tiempo real desde Binance Spot, con fallback automático a CoinGecko.

**Próximo paso:** Desplegar la edge function `usdt-rate` en Supabase para que funcione en producción.
