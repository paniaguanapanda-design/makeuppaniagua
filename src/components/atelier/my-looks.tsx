import { useEffect, useState } from "react";
import { Share2, Trash2 } from "lucide-react";
import { deleteLook, listLooks, type SavedLook } from "@/lib/makeup/saved";
import { useLang } from "@/lib/i18n";

async function shareLook(look: SavedLook, text: string): Promise<"shared" | "downloaded"> {
  const blob = await (await fetch(look.image)).blob();
  const file = new File([blob], `neusta-${look.look}.jpg`, { type: "image/jpeg" });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    await nav.share({ files: [file], text, title: "NEUSTA" });
    return "shared";
  }
  const link = document.createElement("a");
  link.href = look.image;
  link.download = file.name;
  link.click();
  return "downloaded";
}

/** Colección de looks guardados en la cuenta: verlos, repetir el tutorial y compartirlos. */
export function MyLooksScreen({ onCreate }: { onCreate: () => void }) {
  const { t, lang } = useLang();
  const [looks, setLooks] = useState<SavedLook[] | null>(null);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState<SavedLook | null>(null);
  const [toast, setToast] = useState("");

  const load = () => {
    setError(false);
    listLooks()
      .then(setLooks)
      .catch(() => setError(true));
  };

  useEffect(load, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(lang, { day: "numeric", month: "short" });

  if (open) {
    const text = t("saved.shareText", {
      look: t(`level.${open.look}`).toLowerCase(),
      occasion: t(`sit.${open.situation}`).toLowerCase(),
    });
    return (
      <div className="mx-auto max-w-xl px-4 pb-16 pt-6">
        <p className="step-eyebrow">{date(open.createdAt)}</p>
        <h1 className="mt-2 text-4xl">
          {t(`level.${open.look}`)} <em>· {t(`sit.${open.situation}`)}</em>
        </h1>
        <div className="hair" />
        <img src={open.image} alt="" className="w-full rounded-[1.6rem] border border-line" />
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() =>
              void shareLook(open, text)
                .then((how) => how === "downloaded" && setToast(t("saved.downloaded")))
                .catch(() => undefined)
            }
            className="bg-ink inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-5 font-semibold text-white"
          >
            <Share2 className="size-4" aria-hidden="true" />
            {t("saved.share")}
          </button>
          <button
            type="button"
            aria-label={t("saved.delete")}
            onClick={() => {
              if (!window.confirm(t("saved.deleteConfirm"))) return;
              void deleteLook({ data: { id: open.id } }).then(() => {
                setLooks((list) => list?.filter((item) => item.id !== open.id) ?? list);
                setOpen(null);
              });
            }}
            className="inline-grid min-h-12 min-w-12 place-items-center rounded-full border border-line bg-white/70"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
        {open.steps.length ? (
          <>
            <h2 className="mt-8 text-2xl">{t("steps.title")}</h2>
            <ol className="mt-4 flex flex-col gap-3">
              {open.steps.map((step, index) => (
                <li key={index} className="rounded-2xl border border-line bg-surface px-4 py-4">
                  <p className="text-xs tracking-widest text-muted uppercase">
                    {index + 1} · {t(`zone.${step.zone}`)}
                  </p>
                  <p className="mt-1 font-display text-2xl">{step.title}</p>
                  <p className="mt-2 text-sm">{step.instruction}</p>
                </li>
              ))}
            </ol>
          </>
        ) : null}
        {toast ? (
          <p className="toast" role="status">
            {toast}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-16 pt-8">
      <p className="step-eyebrow">{t("saved.eyebrow")}</p>
      <h1 className="mt-3 text-[2.4rem] leading-[1.04]">
        {t("saved.title1")} <em>{t("saved.title2")}</em>
      </h1>
      <div className="hair" />
      <p className="text-sm text-muted">{t("saved.sub")}</p>
      {error ? (
        <div className="mt-8">
          <p className="text-sm text-blush">{t("saved.error")}</p>
          <button
            type="button"
            onClick={load}
            className="mt-4 min-h-11 rounded-full bg-ink px-5 text-surface"
          >
            {t("common.retry")}
          </button>
        </div>
      ) : !looks ? (
        <p className="mt-8 text-sm text-muted">{t("saved.loading")}</p>
      ) : !looks.length ? (
        <div className="glass mt-8 rounded-[1.6rem] p-6">
          <p className="text-sm">{t("saved.empty")}</p>
          <button
            type="button"
            onClick={onCreate}
            className="bg-ink mt-4 min-h-12 w-full rounded-full px-6 font-semibold text-white"
          >
            {t("saved.emptyBtn")}
          </button>
        </div>
      ) : (
        <ul className="mt-7 grid grid-cols-2 gap-3">
          {looks.map((look) => (
            <li key={look.id}>
              <button
                type="button"
                onClick={() => {
                  setOpen(look);
                  window.scrollTo({ top: 0 });
                }}
                className="saved-tile w-full"
              >
                <img src={look.image} alt="" className="aspect-[3/4] w-full object-cover" />
                <span className="block px-3 pb-3 pt-2">
                  <span className="block font-display text-xl leading-tight">
                    {t(`level.${look.look}`)}
                  </span>
                  <span className="block text-[11px] text-muted">
                    {t(`sit.${look.situation}`)} · {date(look.createdAt)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
