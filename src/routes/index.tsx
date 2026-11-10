import { createFileRoute } from "@tanstack/react-router";
import { AtelierApp } from "@/components/atelier/app";
import { AccessScreen } from "@/components/atelier/access";
import { authClient } from "@/lib/auth/client";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { data, isPending, error } = authClient.useSession();
  const { t } = useLang();
  if (isPending)
    return (
      <main className="access-page">
        <p role="status">{t("acc.loading")}</p>
      </main>
    );
  if (error)
    return (
      <main className="access-page">
        <p role="alert">{t("acc.sessionError")}</p>
      </main>
    );
  return data?.user ? <AtelierApp /> : <AccessScreen />;
}
