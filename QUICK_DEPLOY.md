# Guía Rápida de Despliegue

## 📋 Checklist Pre-Despliegue

- [x] Git inicializado
- [x] Commit inicial creado
- [x] vercel.json configurado
- [x] .env protegido
- [x] Build exitoso
- [ ] Repositorio GitHub creado
- [ ] Código subido a GitHub
- [ ] Cuenta Vercel creada
- [ ] Proyecto importado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Aplicación desplegada
- [ ] Tests de verificación completados

## 🚀 Comandos Esenciales

### Subir a GitHub (Primera vez)
```bash
# Reemplaza TU_USUARIO con tu usuario de GitHub
git remote add origin https://github.com/TU_USUARIO/finance-app.git
git branch -M main
git push -u origin main
```

### Actualizaciones Futuras
```bash
# Después de hacer cambios
git add .
git commit -m "Descripción del cambio"
git push origin main
# Vercel despliega automáticamente
```

### Test Local
```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

## 🔑 Variables de Entorno para Vercel

Copia y pega estas variables exactamente como están:

### Variable 1
```
Name: VITE_SUPABASE_URL
Value: https://uujfmkcmpetpslrcleip.supabase.co
Environments: Production, Preview, Development (todas)
```

### Variable 2
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1amZta2NtcGV0cHNscmNsZWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNDQ1MjYsImV4cCI6MjA4NTgyMDUyNn0.YIrRtSe_l0hKVqWVZKVVwRXeTPjmoOjeu6x94REdzv8
Environments: Production, Preview, Development (todas)
```

## 📱 Mensaje para Compartir

```
¡Hola! Te comparto mi app de finanzas personales:
https://tu-app.vercel.app

Para instalarla:
📱 Android: Chrome → Menú → "Añadir a pantalla de inicio"
🍎 iOS: Safari → Compartir → "Añadir a inicio"

¡Regístrate para empezar!
```

## 🔗 Links Importantes

- GitHub Nuevo Repo: https://github.com/new
- Vercel Signup: https://vercel.com/signup
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard
- Generar QR Code: https://qr.io/

## ⚡ Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| Variables no funcionan | Vercel → Settings → Environment Variables → Redeploy |
| 404 al refrescar | Verificar que vercel.json existe |
| Service Worker viejo | Ctrl+Shift+R (hard refresh) |
| Build falla | Revisar logs en Vercel Dashboard → Deployments |
| Git push rechazado | Usar Personal Access Token como password |

## 📊 Límites Gratuitos

- Vercel: 100GB bandwidth/mes
- Supabase: 500MB DB + 500k requests/mes
- **Para 5-20 usuarios**: Muy por debajo del límite

## ⏱️ Tiempos Estimados

- GitHub setup: 5 min
- Vercel setup: 10 min
- Verificación: 5 min
- **Total**: ~20 min

---

**Siguiente paso**: Lee `DEPLOYMENT_GUIDE.md` para instrucciones detalladas.
