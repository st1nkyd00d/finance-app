# Guía de Resolución de Problemas

## 🚨 Problemas Comunes y Soluciones

### 1. Variables de Entorno No Funcionan

**Síntoma**: La app no se conecta a Supabase, errores de "undefined" en console.

**Solución**:
```bash
# 1. Verificar en Vercel
- Ve a tu proyecto en Vercel
- Settings → Environment Variables
- Verifica que ambas variables estén presentes:
  * VITE_SUPABASE_URL
  * VITE_SUPABASE_ANON_KEY
- Verifica que NO haya espacios extra al copiar

# 2. Redesplegar
- Deployments → Click en "..." del último deploy → Redeploy
```

**Prevención**: Copia las variables directamente desde `QUICK_DEPLOY.md`.

---

### 2. Error 404 al Refrescar Página

**Síntoma**: Al refrescar cualquier página que no sea `/`, obtienes 404.

**Solución**:
```bash
# Verificar que vercel.json existe
cd "C:\Users\Stinky\Desktop\Ahorros Personales\finance-app"
cat vercel.json

# Si no existe o está mal, recrearlo:
# Copiar el contenido de DEPLOYMENT_GUIDE.md sección vercel.json
```

**Causa**: Vercel necesita rewrites para SPA routing.

---

### 3. Service Worker No Actualiza

**Síntoma**: Cambios no se reflejan en la PWA instalada.

**Solución**:

**Desktop:**
```
1. Abrir DevTools (F12)
2. Application → Service Workers
3. Click "Unregister"
4. Hard refresh: Ctrl + Shift + R (Windows) o Cmd + Shift + R (Mac)
```

**Móvil:**
```
Android:
1. Configuración → Apps → Finance App
2. Almacenamiento → Borrar datos
3. Reinstalar desde el navegador

iOS:
1. Settings → Safari → Clear History and Website Data
2. Reinstalar desde Safari
```

---

### 4. Build Falla en Vercel

**Síntoma**: Deploy falla con error de build.

**Diagnóstico**:
```bash
# 1. Verificar build local
cd "C:\Users\Stinky\Desktop\Ahorros Personales\finance-app"
npm run build

# Si falla localmente, leer el error
# Causas comunes:
# - Dependencias faltantes
# - Errores de sintaxis
# - Importaciones incorrectas
```

**Solución según error**:

**Error: "Module not found"**
```bash
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push origin main
```

**Error: "Build failed with exit code 1"**
```bash
# Revisar logs en Vercel Dashboard
# Buscar línea específica del error
# Arreglar el archivo indicado
```

---

### 5. Git Push Rechazado

**Síntoma**: `git push` pide password pero no acepta tu password de GitHub.

**Solución**:

GitHub ya no acepta passwords. Necesitas un Personal Access Token:

```bash
# 1. Crear token
# - Ve a https://github.com/settings/tokens
# - "Generate new token" → "Classic"
# - Selecciona: repo (todas las opciones)
# - Copia el token (aparece solo una vez)

# 2. Usar el token como password
git push origin main
# Username: tu_usuario_github
# Password: [pega_tu_token_aquí]

# 3. (Opcional) Guardar credenciales
git config --global credential.helper store
# Próximo push guardará el token
```

---

### 6. PWA No Se Puede Instalar

**Síntoma**: No aparece botón de "Instalar" en el navegador.

**Diagnóstico**:
```bash
# Desktop: F12 → Console
# Buscar errores relacionados con:
# - manifest.webmanifest
# - Service Worker

# Lighthouse audit
# F12 → Lighthouse → Run audit → PWA
```

**Soluciones**:

**Error: "Manifest failed to load"**
```bash
# Verificar que vercel.json tiene headers para manifest
# Ver DEPLOYMENT_GUIDE.md para configuración correcta
```

**Error: "Service Worker failed to register"**
```bash
# Hard refresh: Ctrl + Shift + R
# Verificar que sw.js existe en dist/
npm run build
ls dist/sw.js
```

**Error: "Not served over HTTPS"**
```bash
# En producción Vercel da HTTPS automático
# En desarrollo usa: npm run dev (no npm run preview)
```

---

### 7. "Cannot read property of undefined" en Console

**Síntoma**: Errores de JavaScript en la consola al usar la app.

**Diagnóstico**:
```javascript
// Ejemplo de error:
// Cannot read property 'map' of undefined

// Significa que un array/objeto esperado es undefined
```

**Solución**:
```bash
# 1. Verificar que Supabase está funcionando
# Ve a https://supabase.com/dashboard
# Tu proyecto → Table editor
# Verifica que las tablas existen

# 2. Verificar variables de entorno
# Vercel → Settings → Environment Variables

# 3. Revisar RLS (Row Level Security)
# Supabase → Authentication → Policies
# Cada tabla debe tener políticas para SELECT/INSERT/UPDATE/DELETE
```

---

### 8. Datos No Se Guardan

**Síntoma**: Puedes crear wallets/transacciones pero no se guardan.

**Causa más común**: Row Level Security bloqueando inserts.

**Solución**:
```sql
-- En Supabase SQL Editor:

-- Verificar usuario actual
SELECT auth.uid();

-- Ver políticas de una tabla
SELECT * FROM pg_policies WHERE tablename = 'wallets';

-- Crear política básica (ejemplo para wallets)
CREATE POLICY "Users can insert own wallets"
ON wallets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Repetir para SELECT, UPDATE, DELETE según necesites
```

**Políticas necesarias**:
- `wallets`: INSERT, SELECT, UPDATE, DELETE basado en `user_id`
- `transactions`: INSERT, SELECT, UPDATE, DELETE basado en `user_id`
- `categories`: INSERT, SELECT, UPDATE, DELETE basado en `user_id`
- `budgets`: INSERT, SELECT, UPDATE, DELETE basado en `user_id`
- `recurring_transactions`: INSERT, SELECT, UPDATE, DELETE basado en `user_id`
- `exchange_rates`: SELECT (todos), INSERT/UPDATE/DELETE (solo owner)

---

### 9. "Quota exceeded" Error

**Síntoma**: Error al usar la app en móvil offline.

**Causa**: Cache del Service Worker lleno.

**Solución**:
```
Android:
1. Chrome → Menú → Settings → Privacy
2. "Clear browsing data"
3. Seleccionar solo "Cached images and files"
4. Reinstalar PWA

iOS:
1. Settings → Safari
2. "Clear History and Website Data"
3. Reinstalar PWA desde Safari
```

---

### 10. Deploy Muy Lento o "Queued"

**Síntoma**: Deploy en Vercel tarda mucho o queda en cola.

**Solución**:
```bash
# 1. Verificar status de Vercel
# Ve a https://www.vercel-status.com/

# 2. Si el servicio está normal, cancelar y reintentar
# Vercel Dashboard → Deployments → Cancel → Redeploy

# 3. Si persiste, optimizar build
# En vite.config.js, ajustar opciones de build
```

---

## 🔍 Comandos de Diagnóstico

### Verificar Estado Local
```bash
cd "C:\Users\Stinky\Desktop\Ahorros Personales\finance-app"

# Estado de Git
git status
git log --oneline -5

# Test de build
npm run build

# Test de preview
npm run preview
# Abrir http://localhost:4173
```

### Verificar Estado en Vercel
```bash
# Instalar Vercel CLI (opcional)
npm i -g vercel

# Login
vercel login

# Ver deployments
vercel ls

# Ver logs del último deploy
vercel logs [url]
```

### Verificar Estado en Supabase
```bash
# En Supabase Dashboard:
1. Database → Tables → Verificar estructura
2. Authentication → Users → Ver usuarios registrados
3. API → Verificar que las URLs coinciden
4. Logs → Buscar errores recientes
```

---

## 📞 Obtener Ayuda

### Logs de Vercel
1. Dashboard → Tu proyecto
2. Deployments → Click en el deploy problemático
3. Ver "Build Logs" o "Runtime Logs"
4. Copiar error para buscar solución

### Logs de Supabase
1. Dashboard → Tu proyecto
2. Logs → Seleccionar tipo (Postgres, API, Auth)
3. Filtrar por tiempo del error
4. Ver detalles del error

### Community Support
- **Vercel**: https://github.com/vercel/vercel/discussions
- **Supabase**: https://discord.supabase.com
- **React**: https://react.dev/community
- **Vite**: https://github.com/vitejs/vite/discussions

---

## 🛠️ Kit de Herramientas de Debug

### DevTools (Chrome/Edge)
```
F12 → Console      # Ver errores JavaScript
F12 → Network      # Ver requests HTTP fallidas
F12 → Application  # Inspeccionar Service Worker, Cache, LocalStorage
F12 → Lighthouse   # Auditar PWA, Performance, SEO
```

### Verificar PWA en Producción
```bash
# Lighthouse CLI
npm install -g lighthouse

lighthouse https://tu-app.vercel.app \
  --only-categories=pwa \
  --view

# Debe dar score >90
```

### Verificar Variables de Entorno en Build
```bash
# En un archivo temporal, agregar console.log
# src/services/supabase.js (temporal)
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

# Hacer deploy
# Ver en Vercel Runtime Logs si aparece la URL
# REMOVER el console.log después
```

---

## 📋 Checklist Antes de Reportar un Bug

- [ ] ¿Probaste en modo incógnito? (elimina extensiones)
- [ ] ¿Hiciste hard refresh? (Ctrl+Shift+R)
- [ ] ¿Verificaste las variables de entorno?
- [ ] ¿Funciona en desarrollo local? (`npm run dev`)
- [ ] ¿Revisaste la consola de DevTools?
- [ ] ¿Revisaste los logs de Vercel?
- [ ] ¿Verificaste el status de Supabase?
- [ ] ¿Probaste en otro navegador/dispositivo?

Si todas las respuestas son sí y aún no funciona, documenta:
1. Pasos exactos para reproducir
2. Screenshots del error
3. Logs de consola
4. URL del deployment problemático

---

**Última actualización**: 2026-02-09
