import { createServerFn } from "@tanstack/react-start";

/** Dice a la pantalla de acceso si mostrar «Continuar con Google». */
export const googleSignInAvailable = createServerFn({ method: "GET" }).handler(async () => {
  const { googleSignInEnabled } = await import("./server");
  return googleSignInEnabled;
});
