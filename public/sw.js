// Service worker mínimo para que NEUSTA se pueda instalar como app.
// No guarda nada en caché: las páginas siempre vienen de internet.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response("<h1 style='font-family:serif;text-align:center;margin-top:30vh'>NEUSTA<br><small>Sin conexión</small></h1>", {
          status: 503,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
    ),
  );
});
