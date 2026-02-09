# Configuración de Supabase Post-Deploy

## 📧 Configurar Email de Recuperación de Contraseña

Después de desplegar en Vercel, debes configurar Supabase para que los emails de recuperación funcionen correctamente.

### Paso 1: URL Configuration (CRÍTICO)

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. **Authentication → URL Configuration**

Configura estas URLs (reemplaza `tu-app.vercel.app` con tu URL real de Vercel):

```
Site URL:
https://tu-app.vercel.app

Redirect URLs:
https://tu-app.vercel.app/reset-password
https://tu-app.vercel.app/**
```

**Por qué es importante:** Sin esto, el link del email no funcionará.

### Paso 2: Email Template

1. **Authentication → Email Templates**
2. Click en **"Reset Password"** (o "Change Password")
3. Reemplaza el contenido con este template en español:

```html
<h2>Restablecer Contraseña - Finance App</h2>

<p>Hola,</p>

<p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>

<p><a href="{{ .ConfirmationURL }}">Haz click aquí para restablecer tu contraseña</a></p>

<p>O copia y pega este enlace en tu navegador:</p>
<p>{{ .ConfirmationURL }}</p>

<p>Si no solicitaste este cambio, puedes ignorar este email de forma segura.</p>

<p><strong>Este enlace expira en 24 horas.</strong></p>

<p>Saludos,<br>
Finance App</p>
```

4. Click **"Save"**

### Paso 3: SMTP Settings (Opcional - Recomendado para Producción)

Por defecto, Supabase usa su propio SMTP que tiene límites:
- **100 emails/hora** en el plan gratuito
- Los emails pueden ir a spam

Para mejorar la entrega:

#### Opción 1: Gmail (Fácil, Gratis para bajo volumen)

1. **Authentication → Settings → SMTP Settings**
2. Click **"Enable Custom SMTP"**

```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: tu-email@gmail.com
SMTP Password: [App Password de Gmail]
Sender Email: tu-email@gmail.com
Sender Name: Finance App
```

**Cómo obtener App Password de Gmail:**
1. Ve a https://myaccount.google.com/apppasswords
2. Genera una contraseña de aplicación
3. Úsala en el campo SMTP Password

#### Opción 2: SendGrid (Profesional, 100 emails/día gratis)

1. Crear cuenta gratis en https://sendgrid.com
2. Obtener API Key
3. En Supabase SMTP Settings:

```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [Tu SendGrid API Key]
Sender Email: tu-email-verificado@dominio.com
Sender Name: Finance App
```

#### Opción 3: Usar SMTP por defecto de Supabase

Si es solo para 5-20 amigos, el SMTP por defecto es suficiente. Saltea este paso.

### Paso 4: Configurar Confirmación de Email (Opcional)

Decide si quieres que los usuarios confirmen su email al registrarse:

1. **Authentication → Providers → Email**

**Opción A: Sin confirmación (más fácil para amigos)**
```
✅ Enable Email provider
❌ Confirm email
```

Los usuarios pueden usar la app inmediatamente después de registrarse.

**Opción B: Con confirmación (más seguro)**
```
✅ Enable Email provider
✅ Confirm email
```

Los usuarios deben confirmar su email antes de usar la app.

**Recomendación:** Para uso con amigos, desactiva la confirmación. Para uso público, actívala.

### Paso 5: Verificar RLS (Row Level Security)

Asegúrate de que las políticas de seguridad están habilitadas:

1. **Database → Tables**
2. Para cada tabla (`wallets`, `transactions`, `categories`, etc.):
   - Click en la tabla
   - Tab "RLS" (Row Level Security)
   - Verifica que haya políticas activas

**Políticas básicas necesarias:**

```sql
-- Ejemplo para tabla wallets
-- (Ya deben estar creadas, solo verifica)

-- SELECT: Ver solo tus wallets
CREATE POLICY "Users can view own wallets"
ON wallets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Crear solo en tu cuenta
CREATE POLICY "Users can create own wallets"
ON wallets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Actualizar solo tus wallets
CREATE POLICY "Users can update own wallets"
ON wallets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Eliminar solo tus wallets
CREATE POLICY "Users can delete own wallets"
ON wallets FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

**Si no existen:** Cópialas en el SQL Editor y ejecútalas para cada tabla.

### Paso 6: Probar el Flujo Completo

1. **Registrar usuario de prueba**
   - Ve a tu app desplegada
   - Registra una cuenta con tu email real

2. **Probar recuperación de contraseña**
   - Logout
   - Click "¿Olvidaste tu contraseña?"
   - Ingresa tu email
   - Espera 1-2 minutos
   - Revisa tu bandeja de entrada (y spam)

3. **Verificar el email**
   - Debe llegar de `noreply@mail.app.supabase.io` (o tu SMTP custom)
   - Subject: "Restablecer Contraseña - Finance App"

4. **Click en el link**
   - Debe redirigir a `https://tu-app.vercel.app/reset-password`
   - Si aparece error, verifica la configuración de URLs en Paso 1

5. **Establecer nueva contraseña**
   - Ingresa nueva contraseña (8+ caracteres, incluir número)
   - Click "Actualizar Contraseña"
   - Debe redirigir a `/login`

6. **Login con nueva contraseña**
   - Ingresa email y nueva contraseña
   - Debe funcionar correctamente

## 🐛 Troubleshooting

### Email no llega

**Problema:** No recibo el email de recuperación.

**Soluciones:**
1. Revisa la carpeta de spam
2. Espera 5 minutos (puede haber delay)
3. Verifica en Supabase → Authentication → Logs si hay errores
4. Verifica que el email existe en Authentication → Users
5. Intenta con otro email (Gmail, Outlook)

### Link redirige a página incorrecta

**Problema:** El link del email me lleva a otra página o da error.

**Soluciones:**
1. Verifica que agregaste la URL en Authentication → URL Configuration → Redirect URLs
2. Asegúrate de que la URL tiene el formato correcto: `https://tu-app.vercel.app/reset-password`
3. No uses `http://`, siempre `https://`

### Error "Invalid token" al resetear

**Problema:** Al intentar establecer nueva contraseña, sale "Invalid token".

**Causas:**
1. El link expiró (24 horas)
2. El link ya fue usado
3. Hay un espacio extra al copiar/pegar el link

**Solución:** Solicita un nuevo email de recuperación.

### Usuarios no reciben email de confirmación

**Problema:** Al registrarse, no llega el email de confirmación.

**Solución:**
1. Si no necesitas confirmación: Authentication → Providers → Email → Desactiva "Confirm email"
2. Si la necesitas: Sigue los pasos de SMTP custom (Paso 3)

## 📋 Checklist Final

Después de configurar todo:

- [ ] Site URL configurada en Supabase
- [ ] Redirect URL para `/reset-password` agregada
- [ ] Email template de "Reset Password" actualizado
- [ ] (Opcional) SMTP custom configurado
- [ ] (Opcional) Confirmación de email configurada según preferencia
- [ ] RLS policies verificadas
- [ ] Flujo completo probado con email real
- [ ] Email de recuperación llega correctamente
- [ ] Link del email funciona
- [ ] Nueva contraseña se puede establecer
- [ ] Login funciona con nueva contraseña

## 🔒 Seguridad Adicional

### Rate Limiting

Supabase tiene rate limiting por defecto:
- **30 solicitudes/hora** por IP para reset password
- **Previene abuse** de la función de recuperación

### Session Tokens

- Los tokens de sesión expiran después de **7 días** por defecto
- Los refresh tokens duran **60 días**
- Usuarios son forzados a re-autenticarse después de este periodo

### Password Requirements

Ya implementados en el frontend:
- Mínimo 8 caracteres
- Al menos 1 número
- Al menos 1 letra

---

**Tiempo estimado de configuración:** 10-15 minutos

**Prioridad:** ALTA - Sin esto, la recuperación de contraseña no funcionará

**Próximo paso:** Deploy en Vercel, luego regresa aquí para configurar Supabase
