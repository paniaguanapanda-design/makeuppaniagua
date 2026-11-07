import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Loader2, Lock, Star } from "lucide-react";
import { listReviews, type Review } from "@/lib/makeup/feedback";

export const Route = createFileRoute("/resenas")({
  head: () => ({
    meta: [{ title: "Reseñas · NEUSTA" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: ReviewsPage,
});

const KEY = "neusta:admin-key";
/** Marca UTF-8 para que Excel abra bien las tildes. */
const BOM = String.fromCharCode(0xfeff);

function csv(reviews: Review[]) {
  const head = [
    "fecha",
    "estrellas",
    "nombre",
    "correo",
    "publicable",
    "ocasion",
    "look",
    "etiquetas",
    "reseña",
  ];
  const cell = (value: string | number | boolean) => `"${String(value).replace(/"/g, '""')}"`;
  const rows = reviews.map((r) =>
    [
      r.createdAt,
      r.rating,
      r.name,
      r.email,
      r.consentPublish ? "sí" : "no",
      r.situation,
      r.look,
      r.tags,
      r.comment,
    ]
      .map(cell)
      .join(","),
  );
  return [head.join(","), ...rows].join("\n");
}

function ReviewsPage() {
  const [key, setKey] = useState("");
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [onlyPublic, setOnlyPublic] = useState(false);

  async function load(withKey: string, publicOnly = onlyPublic) {
    setLoading(true);
    setError(null);
    try {
      const data = await listReviews({ data: { key: withKey, onlyPublic: publicOnly } });
      setReviews(data);
      try {
        window.sessionStorage.setItem(KEY, withKey);
      } catch {
        /* ignore */
      }
    } catch (err) {
      setReviews(null);
      setError(err instanceof Error ? err.message : "No pude cargar las reseñas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(KEY);
      if (saved) {
        setKey(saved);
        void load(saved);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function download() {
    if (!reviews) return;
    const blob = new Blob([BOM + csv(reviews)], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "resenas-neusta.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (!reviews) {
    return (
      <main className="app-shell flex flex-col justify-center px-6">
        <form
          className="mx-auto w-full max-w-sm"
          onSubmit={(event) => {
            event.preventDefault();
            void load(key);
          }}
        >
          <span className="grid size-12 place-items-center rounded-full bg-blush/10 text-blush">
            <Lock className="size-5" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-4xl">Reseñas</h1>
          <p className="mt-2 text-sm text-muted">Zona privada del equipo NEUSTA.</p>
          <label className="mt-6 block">
            <span className="text-sm font-medium">Clave</span>
            <input
              type="password"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              autoComplete="current-password"
              className="mt-2 w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base"
            />
          </label>
          {error ? <p className="mt-3 text-sm text-blush">{error}</p> : null}
          <button
            type="submit"
            disabled={!key || loading}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-surface"
          >
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Entrar
          </button>
        </form>
      </main>
    );
  }

  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <main className="app-shell px-5 pt-8 pb-16">
      <h1 className="text-4xl">Reseñas</h1>
      <p className="mt-2 text-sm text-muted">
        {reviews.length} reseñas · media {average.toFixed(1)} ★ ·{" "}
        {reviews.filter((r) => r.consentPublish).length} se pueden publicar
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="chip-button cursor-pointer">
          <input
            type="checkbox"
            checked={onlyPublic}
            onChange={(event) => {
              setOnlyPublic(event.target.checked);
              void load(key, event.target.checked);
            }}
            className="consent-check"
          />
          Solo publicables
        </label>
        <button type="button" onClick={download} className="chip-button">
          <Download className="size-4" aria-hidden="true" />
          Descargar CSV
        </button>
      </div>

      <ul className="mt-6 space-y-4">
        {reviews.map((review) => (
          <li key={review.id} className="soft-card p-4">
            <div className="flex gap-4">
              {review.photo ? (
                <a href={review.photo} target="_blank" rel="noreferrer" className="shrink-0">
                  <img
                    src={review.photo}
                    alt={`Foto de ${review.name || review.email}`}
                    className="size-20 rounded-xl object-cover"
                  />
                </a>
              ) : (
                <span className="grid size-20 shrink-0 place-items-center rounded-xl bg-clay text-xs text-muted">
                  Sin foto
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p
                  className="flex items-center gap-0.5 text-blush"
                  aria-label={`${review.rating} de 5 estrellas`}
                >
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      className={`size-4 ${index < review.rating ? "fill-blush" : "text-line"}`}
                      aria-hidden="true"
                    />
                  ))}
                </p>
                <p className="mt-1 truncate font-medium">{review.name || "Sin nombre"}</p>
                <a
                  href={`mailto:${review.email}`}
                  className="block truncate text-sm text-blush underline-offset-2 hover:underline"
                >
                  {review.email || "—"}
                </a>
                <p className="mt-1 text-xs text-muted">
                  {new Date(review.createdAt).toLocaleString("es-ES", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {review.look ? ` · ${review.look}` : ""}
                  {review.situation ? ` · ${review.situation}` : ""}
                </p>
              </div>
            </div>
            {review.comment ? (
              <p className="mt-3 text-sm leading-relaxed">«{review.comment}»</p>
            ) : null}
            {review.tags ? <p className="mt-2 text-xs text-muted">{review.tags}</p> : null}
            <div className="mt-3 flex items-center justify-between gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs ${review.consentPublish ? "bg-blush text-white" : "bg-clay text-ink"}`}
              >
                {review.consentPublish ? "Se puede publicar" : "Solo uso interno"}
              </span>
              {review.lookImage ? (
                <a
                  href={review.lookImage}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted underline"
                >
                  Ver look generado
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
