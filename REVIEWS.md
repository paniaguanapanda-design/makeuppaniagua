# Opiniones y futuros testimonios

El acceso «Dejar una opinión» permite opinar sin generar imágenes, después de iniciar sesión como requiere la versión actual de la aplicación.

- Nombre y correo opcionales; el correo se almacena solo para contacto privado.
- La autorización está desmarcada. Para autorizar, se requieren nombre y comentario.
- Foto opcional JPG/PNG de hasta 300 KB, elegida expresamente para la reseña. No se reutiliza la foto del análisis. Se guarda en la base de datos privada, no en una URL pública ni en el correo.
- El servidor registra fecha, versión y texto exacto de la autorización. Las opiniones anteriores siguen privadas; no se infiere consentimiento retroactivo.
- Sin autorización: `publication_status = 'private'`. Con autorización: `pending`. No hay publicación automática ni endpoint público que exponga opiniones, correos o fotos.
- El aviso al propietario incluye referencia, nombre, correo privado y permiso. Nunca adjunta la foto. La base de datos es la fuente de revisión.

## Revisión manual antes de reutilizar

Esta entrega prepara la recogida de testimonios, no añade un panel de administración ni una sección pública de testimonios. El propietario revisa el comentario y la foto en su base de datos con acceso administrativo; solo debe reutilizar nombre, puntuación, comentario y foto de opiniones autorizadas que haya aprobado. El correo nunca se copia a la web.

Si se añade una sección pública después, debe seleccionar exclusivamente `publication_status = 'approved' AND publication_consent = true` y proyectar solo esos campos públicos; nunca devolver filas completas. Los estados permitidos son `private`, `pending`, `approved` y `rejected`. La base de datos impide aprobar una reseña sin autorización documentada. Rechazar no publica nada. Ante una retirada de permiso, retirar primero cualquier copia publicada, quitar la foto y devolver la opinión a privada, conservando solo lo necesario para la gestión de la solicitud.
