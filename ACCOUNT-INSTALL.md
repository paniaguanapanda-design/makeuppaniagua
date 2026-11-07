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

La invitación de instalación aparece automáticamente 1,2 segundos después de entrar, también antes del acceso con cuenta. Se elimina el botón «Instalar app» del encabezado. El aviso ofrece «Instalar» y «Ahora no»; este último (y Escape) lo aplaza siete días en ese navegador mediante localStorage. Si el almacenamiento está bloqueado, se puede cerrar, pero no se garantiza conservar el aplazamiento entre visitas. En modo standalone o tras `appinstalled` no se muestra.

La instalación nativa solo se solicita al pulsar «Instalar» y si existe un evento `beforeinstallprompt`, incluso si llega después de abrir el aviso. Sin evento, o si el navegador rechaza la operación, se muestran instrucciones; no se promete una descarga APK. Si se cancela el diálogo nativo, sigue disponible «Ahora no». Tras aplazar el aviso, la instalación sigue siendo accesible desde el menú del navegador.
No se puede forzar instalación nativa en todos los navegadores. Se ofrecen instrucciones para Safari iPhone/iPad, Android, Chrome/Edge de escritorio, Safari Mac y alternativas para navegadores sin instalación. Un marcador se distingue explícitamente de una app instalada. El sitio funciona por HTTPS sin instalar; no se añade modo offline a los flujos de IA o acceso.

Fuentes:

- https://nextjs.org/docs/app/guides/progressive-web-apps
- https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios
- https://support.apple.com/en-us/104996

`node --test scripts/install-prompt.test.mjs` comprueba apertura automática, aplazamiento de siete días, Escape, evento tardío, instalación por clic, cancelación/error, modo instalado, almacenamiento bloqueado y limpieza con un harness del componente real. No sustituye las pruebas de instalación en dispositivos reales.
