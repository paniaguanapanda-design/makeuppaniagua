import { InstallPrompt } from "@/components/install-prompt";
import { LanguageProvider } from "@/lib/i18n";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "NEUSTA";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "referrer", content: "no-referrer" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "NEUSTA pregunta edad, gusto y el maquillaje que ya tienes, y propone looks con marcas de droguería.",
      },
      { name: "theme-color", content: "#a8475f" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "NEUSTA" },
      { property: "og:title", content: "NEUSTA · Tu look, a tu medida" },
      {
        property: "og:description",
        content: "Elige la ocasión y te guiamos con looks de maquillaje pensados para ti.",
      },
      { property: "og:image", content: "https://neusta.vercel.app/og.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://neusta.vercel.app/og.jpg" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Montserrat:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <LanguageProvider>
          <InstallPrompt />
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        </LanguageProvider>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}",
          }}
        />
        <Scripts />
      </body>
    </html>
  ),
});
