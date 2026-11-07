import { createFileRoute } from "@tanstack/react-router";
import { AtelierApp } from "@/components/atelier/app";
import { AccessScreen } from "@/components/atelier/access";
import { authClient } from "@/lib/auth/client";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { data, isPending, error } = authClient.useSession();
  if (isPending) return <main className="access-page"><p role="status">Cargando...</p></main>;
  if (error) return <main className="access-page"><p role="alert">No se pudo comprobar tu sesión. Inténtalo de nuevo más tarde.</p></main>;
  return data?.user ? <AtelierApp /> : <AccessScreen />;
}
