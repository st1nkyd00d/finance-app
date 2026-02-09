# Guía de Despliegue - Finance App PWA

## Estado Actual ✅

Tu aplicación está lista para desplegarse:

- ✅ Repositorio Git inicializado
- ✅ Commit inicial creado
- ✅ `vercel.json` configurado para PWA y SPA
- ✅ `.env` protegido (no se sube a GitHub)
- ✅ Build de producción verificado

## Próximos Pasos

### 1. Crear Repositorio en GitHub (5 minutos)

1. Ve a https://github.com/new
2. Configuración recomendada:
   - **Nombre**: `finance-app` (o el que prefieras)
   - **Visibilidad**: **Private** (recomendado para app de finanzas)
   - **NO marques**: "Add a README file"
   - **NO marques**: "Add .gitignore"
3. Click "Create repository"

### 2. Subir Código a GitHub (2 minutos)

Copia y pega estos comandos en tu terminal (reemplaza `TU_USUARIO` con tu usuario de GitHub):

```bash
cd "C:\Users\Stinky\Desktop\Ahorros Personales\finance-app"
git remote add origin https://github.com/TU_USUARIO/finance-app.git
git branch -M main
git push -u origin main
```

**Nota**: Si te pide credenciales, usa tu username de GitHub y un [Personal Access Token](https://github.com/settings/tokens) como password.

### 3. Desplegar en Vercel (10 minutos)

#### 3.1 Crear Cuenta

1. Ve a https://vercel.com/signup
2. Click "Continue with GitHub"
3. Autoriza el acceso a Vercel

#### 3.2 Importar Proyecto

1. En el dashboard de Vercel, click "Add New..." → "Project"
2. Encuentra y selecciona tu repositorio `finance-app`
3. Click "Import"

#### 3.3 Configurar Build

Vercel detectará automáticamente la configuración correcta:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

**NO cambies nada** - déjalo como está.

#### 3.4 Configurar Variables de Entorno

En la sección "Environment Variables", agrega estas dos variables:

**Variable 1:**
- Name: `VITE_SUPABASE_URL`
- Value: `https://uujfmkcmpetpslrcleip.supabase.co`
- Environments: Selecciona las 3 opciones (Production, Preview, Development)

**Variable 2:**
- Name: `VITE_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1amZta2NtcGV0cHNscmNsZWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNDQ1MjYsImV4cCI6MjA4NTgyMDUyNn0.YIrRtSe_l0hKVqWVZKVVwRXeTPjmoOjeu6x94REdzv8`
- Environments: Selecciona las 3 opciones (Production, Preview, Development)

#### 3.5 Desplegar

1. Click "Deploy"
2. Espera 1-2 minutos
3. ¡Listo! Recibirás una URL tipo: `https://finance-app-xxxxx.vercel.app`

### 4. Verificar Despliegue (5 minutos)

#### Test Básico
1. Abre la URL de Vercel en tu navegador
2. Abre DevTools (F12) → Console
3. Verifica que no hay errores
4. Regístrate con un email de prueba
5. Crea una wallet y una transacción

#### Test PWA en Desktop
1. En Chrome/Edge, busca el ícono "Instalar" en la barra de direcciones
2. Click "Install Finance App"
3. Verifica que se abre como aplicación independiente

#### Test PWA en Móvil

**Android (Chrome):**
1. Abre la URL en Chrome móvil
2. Menú (⋮) → "Añadir a pantalla de inicio"
3. Verifica el ícono en tu home screen
4. Ábrelo y prueba

**iOS (Safari):**
1. Abre la URL en Safari
2. Tap botón Compartir → "Añadir a inicio"
3. Verifica y prueba

#### Test Modo Offline
1. DevTools → Application → Service Workers
2. Marca "Offline"
3. Refresca la página
4. Navega entre páginas (debe funcionar con caché)

## Compartir con Amigos

### Opción 1: URL Directa

```
¡Hola! Te comparto mi app de finanzas personales:
https://tu-app.vercel.app

Para instalarla en tu móvil:
📱 Android: Abre en Chrome → Menú → "Añadir a pantalla de inicio"
🍎 iOS: Abre en Safari → Compartir → "Añadir a inicio"

¡Regístrate con tu email para empezar!
```

### Opción 2: Código QR (Recomendado)

1. Ve a https://qr.io/
2. Ingresa tu URL de Vercel
3. Descarga el código QR
4. Compártelo por WhatsApp/Telegram
5. Tus amigos escanean e instalan

## Actualizar la Aplicación

Cada vez que hagas cambios:

```bash
# 1. Hacer cambios en el código
# 2. Probar localmente
npm run dev

# 3. Commit y push
git add .
git commit -m "Descripción de los cambios"
git push origin main

# Vercel despliega automáticamente en 1-2 minutos
```

## Monitoreo

### Uso de Vercel
- Dashboard → Analytics
- Límite gratuito: 100GB bandwidth/mes
- Para 5-20 usuarios: ~5-10% de uso

### Uso de Supabase
- Ve a tu proyecto en https://supabase.com
- Dashboard → Database
- Límite gratuito: 500MB + 500k requests/mes

## Rollback (Si algo sale mal)

1. Ve a Vercel Dashboard → Deployments
2. Encuentra el último deployment que funcionaba
3. Click "..." → "Promote to Production"
4. Rollback instantáneo (sin rebuild)

## Límites del Plan Gratuito

**Vercel:**
- ✅ 100GB bandwidth/mes
- ✅ Builds ilimitados
- ✅ Dominios custom gratuitos
- ✅ SSL automático

**Supabase:**
- ✅ 500MB base de datos
- ✅ 500k API requests/mes
- ✅ 2GB bandwidth
- ✅ 50MB almacenamiento

**Proyección:**
- 5-20 usuarios: Totalmente gratis
- 50 usuarios: Seguirás en tier gratuito
- 100+ usuarios: Probablemente seguirás gratis
- 500+ usuarios: Considera Supabase Pro ($25/mes)

## Configuración de Dominio Personalizado (Opcional)

Si quieres usar tu propio dominio:

1. Compra un dominio en Namecheap, GoDaddy, etc.
2. Vercel Dashboard → Settings → Domains
3. Add domain y sigue las instrucciones
4. SSL se configura automáticamente

## Soporte

Si tienes problemas:

**Variables de entorno no funcionan:**
- Vercel → Settings → Environment Variables
- Verifica que estén bien escritas
- Click "Redeploy" para aplicar cambios

**404 al refrescar página:**
- Verifica que `vercel.json` existe en la raíz
- Debe contener la configuración de rewrites

**Service Worker no actualiza:**
- Hard refresh: Ctrl + Shift + R (Windows) o Cmd + Shift + R (Mac)
- O borra caché en DevTools → Application → Clear storage

**Más ayuda:**
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs

## Seguridad ✅

- ✅ `.env` no se sube a GitHub
- ✅ HTTPS automático con Vercel
- ✅ Headers de seguridad configurados
- ✅ Supabase anon key es segura (diseñada para uso público)
- ⚠️ Verifica que RLS (Row Level Security) esté habilitado en Supabase

## Arquitectura del Despliegue

```
Usuario → Vercel (CDN + Hosting) → Supabase (Backend + DB)
           ↓
     PWA Installable
     Service Worker
     Offline Cache
```

---

¡Tu aplicación está lista para desplegarse! Sigue los pasos y en ~20 minutos tendrás tu Finance App en producción. 🚀
