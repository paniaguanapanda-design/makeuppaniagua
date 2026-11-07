# Acceso e instalación de NEUSTA

## Activación del acceso

- Configurar `BETTER_AUTH_SECRET` como Secret con un valor aleatorio seguro de al menos 32 caracteres, por separado para Preview y Production. El propietario lo introduce en Vercel; nunca compartirlo en el chat o el repositorio.
- Mantener `DATABASE_URL` para persistir usuarios y sesiones. La migración existente `migrations/0005_auth.sql` activa el esquema Better Auth durante el build habitual, sin modificar tablas de opiniones ni productos.
- Crear un nuevo despliegue después de configurar las variables. Sin secreto válido, la ruta de autenticación responde 503 en lugar de crear sesiones inseguras.
- Usar el mismo dominio al registrarse y acceder: las cookies de sesión están aisladas por host. Los hosts del despliegue y de su rama, neusta.com, www.neusta.com y neusta.vercel.app están permitidos.
- Se conserva el acceso obligatorio de `diseno-v2`: registro, ingreso y recuperación de contraseña mediante `AccessScreen`; el cierre de sesión permanece en la portada. Las funciones de maquillaje y opiniones requieren sesión en el servidor.
- La recuperación de contraseña por Resend y la revocación de sesiones se conservan. Ver `AUTENTICACION.md` para las variables del despliegue. Esta integración no activa el piloto de tres pruebas por cuenta de la PR anterior.

Prueba aislada: `node scripts/check-account-auth.mjs` arranca un servidor local, usa PGlite y credenciales efímeras, y comprueba registro, sesión, contraseña inválida, acceso, CSRF, salida y bloqueo sin secreto. No usa datos ni claves de producción.

## Instalar app

El botón del encabezado permanece disponible aunque no exista `beforeinstallprompt` o se haya cerrado el aviso antiguo. Abre un diálogo accesible con instrucciones y, cuando el navegador ofrece el evento, un botón de instalación nativa. Cancelar o fallar no elimina la ayuda. Una instalación confirmada o el modo standalone muestra App instalada.

No se puede forzar instalación nativa en todos los navegadores. Se ofrecen instrucciones para Safari iPhone/iPad, Android, Chrome/Edge de escritorio, Safari Mac y alternativas para navegadores sin instalación. Un marcador se distingue explícitamente de una app instalada. El sitio funciona por HTTPS sin instalar; no se añade modo offline a los flujos de IA o acceso.

Fuentes:

- https://nextjs.org/docs/app/guides/progressive-web-apps
- https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios
- https://support.apple.com/en-us/104996

`node --test scripts/install-prompt.test.mjs` comprueba entrada permanente, ayuda sin evento, cancelación/error nativo y estado instalado con un harness del componente real. No sustituye las pruebas de instalación en dispositivos reales.
