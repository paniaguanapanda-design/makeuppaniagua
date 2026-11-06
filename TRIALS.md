# Piloto: tres pruebas por cuenta

- El registro por correo y contraseña inicia una cuenta con tres pruebas de por vida.
- Capturar/elegir una foto y pedir el catálogo reserva una prueba. Cada prueba permite una solicitud a Grok por cada uno de los tres looks (máximo nueve solicitudes por cuenta).
- La reserva se asocia en servidor con cuenta, ocasión y hash de la foto; no se almacena la foto. El contador y los intentos se guardan en Postgres, no en el navegador ni en memoria.
- Las reservas repetidas con el mismo requestId son idempotentes. Cada plaza se consume antes de llamar a Grok: también cuenta si el proveedor falla o responde tarde. No hay reintentos automáticos ni devolución automática de crédito. Cerrar la página puede perder los resultados (las fotos no se guardan).
- Las peticiones sin sesión, con crédito agotado, con otra foto o que repiten un look no llaman a xAI. No hay créditos anónimos ni fallback al usuario de desarrollo.

## Activación

El propietario configura `BETTER_AUTH_SECRET` como Secret en Vercel, por separado para Preview y Production. Debe ser un valor aleatorio de al menos 32 caracteres, generado y guardado de forma segura por el propietario. No enviarlo al agente ni incluirlo en el repositorio.

El proyecto ya necesita `DATABASE_URL` y `XAI_API_KEY`. No se cambian esas claves. Las migraciones aditivas de autenticación y crédito se aplican durante el build habitual.

Sin secreto válido, los endpoints de auth responden 503 y la generación queda bloqueada. El despliegue Preview puede usarse para comprobar ese estado, pero no para probar registros reales hasta configurar el secreto y reconstruir.

El host concreto del despliegue Vercel y los dominios neusta.com, www.neusta.com y neusta.vercel.app están permitidos. Las sesiones son por host: usa el mismo dominio al acceder.

## Alcance y pruebas

El límite es **por cuenta, no por persona**. No se ha integrado verificación de correo ni un proveedor de envío de correo: alguien podría registrar varias cuentas. Es un piloto cerrado; para una prueba pública hacen falta controles adicionales contra registros abusivos. No es un presupuesto global de xAI.

Pruebas locales:

- `node --test scripts/makeup-credit.test.mjs scripts/makeup-grok.test.mjs`: SQL real en PGlite, concurrencia, idempotencia, nueve plazas, aislamiento de cuentas/fotos y bloqueo previo a xAI.
- `node scripts/check-trial-auth.mjs`: servidor local aislado en localhost:8080, usuarios y secreto efímeros; registro, sesión, contraseña errónea, login, CSRF, logout y bloqueo sin secreto. Nunca usa credenciales de producción.
