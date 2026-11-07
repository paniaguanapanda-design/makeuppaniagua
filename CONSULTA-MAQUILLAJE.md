# Consulta profesional de NEUSTA

Se conserva el diseño y las tres recetas propias de cada ocasión. La consulta añade tiempo (5/15/30 minutos), intensidad y sensibilidad declarada opcional. Los gustos, productos descritos y estas respuestas llegan ahora al prompt real de edición de Grok; antes solo se enviaban categorías de productos.

Antes de las imágenes, se hace una solicitud de visión a xAI con `response_format: json_schema`, generado desde el mismo esquema Zod que valida la respuesta. Incluye rostro y subtono opcionales (`null`), ojos, paleta hexadecimal, observaciones y avisos de calidad. No estima edad ni diagnostica piel o alergias. Una foto no utilizable detiene la generación y permite volver a capturar; una respuesta incompleta, inválida o rechazada muestra un error, no datos inventados. Los filtros aparentes son una advertencia, no una detección garantizada.

La consulta de visión añade coste y latencia a las imágenes: una llamada por captura en el flujo normal, compartida entre las tres opciones y reutilizada al reintentar solo imágenes fallidas. El máximo de tres imágenes y las banderas existentes no cambian. El modelo predeterminado de visión es `grok-4.7`; `XAI_ANALYSIS_MODEL` permite seleccionar otro modelo con visión y JSON Schema disponible en la cuenta. Usa la misma `XAI_API_KEY`, siempre en servidor. No se incluye un cambio de variables ni un despliegue de producción en esta PR.

La foto y el análisis permanecen en memoria del flujo; no se escriben a la base de datos ni al log. La foto y los datos de consulta se envían a xAI. La solicitud de análisis usa `store: false`; esto no equivale a prometer ausencia de retención por el proveedor para todos sus servicios.

Los pasos conservan la receta elegida y añaden herramienta, cantidad inicial, aplicación, intensidad, versión rápida y ajustes de acabado. El catálogo no contiene ingredientes verificados: no se promete compatibilidad con alergias, equivalencia exacta del producto propio ni coincidencia de tonos. Las recomendaciones son orientativas, no atención dermatológica. Se eliminan ajustes automáticos de contorno por forma de rostro y preferencias de acabado por edad.

Pruebas: `node --test scripts/makeup-grok.test.mjs` ejecuta los handlers reales con transporte y red simulados y las recomendaciones sobre migraciones reales en PGlite. Cubre esquema estricto, incertidumbre, fallos, calidad, límites de imágenes, consulta enviada al editor y controles renderizados. No sustituye una prueba visual de resultados reales de xAI.
