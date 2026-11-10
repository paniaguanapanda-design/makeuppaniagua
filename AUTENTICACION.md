# Acceso a NEUSTA

El acceso requiere una cuenta con correo y contraseña. El formulario de
recuperación envía el enlace al correo de la cuenta; el enlace caduca en una
hora y solo puede usarse una vez. Al cambiar la contraseña se cierran las
sesiones existentes.

## Configuración en Vercel

Configura estas variables en el entorno que corresponda (Preview o Production)
y vuelve a desplegar después de modificarlas:

- `DATABASE_URL`: conexión a una base PostgreSQL persistente. El despliegue
  ejecuta las migraciones, incluida la de cuentas.
- `BETTER_AUTH_SECRET`: secreto aleatorio y exclusivo de la aplicación, de al
  menos 32 caracteres. No debe compartirse ni incluirse en el repositorio.
- `BETTER_AUTH_URL`: dirección HTTPS completa de la aplicación en ese entorno,
  sin barra final. Debe coincidir con la dirección desde la que se accede.
- `VITE_AUTH_ENABLED`: `true` (o dejar sin definir); no debe ser `false`.
- `RESEND_API_KEY`: clave de Resend.
- `FEEDBACK_EMAIL_FROM`: remitente de Resend con un dominio verificado.

Si falta la base de datos o la configuración principal de autenticación en
Vercel, el acceso queda deshabilitado en lugar de guardar cuentas temporalmente.
Sin Resend y un remitente, la recuperación informa que no está disponible.
Los fallos del proveedor de correo se registran en el servidor; el formulario
no revela si una dirección tiene cuenta.

Las opiniones siguen guardándose sin asociar el identificador de la cuenta.
La solicitud de envío requiere una sesión, por lo que la infraestructura
puede registrar datos técnicos de la conexión.
