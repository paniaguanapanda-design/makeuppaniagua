import { useState } from "react";
import { sendFeedback } from "@/lib/makeup/feedback";
import { DICTS, useLang } from "@/lib/i18n";

function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-9" aria-hidden="true">
      <path
        d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"
        fill={filled ? "#a8475f" : "none"}
        stroke="#a8475f"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const TAGS = ["loved", "easy", "me", "slow", "notme", "more"] as const;

/** Reseña al final del flujo: estrellas, texto, foto opcional y consentimiento. */
export function FeedbackForm({
  situation,
  look,
  photo,
}: {
  situation?: string;
  look?: string;
  /** Su foto en JPEG, solo si la hizo con la cámara. */
  photo?: string;
}) {
  const { t, lang } = useLang();
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [sharePhoto, setSharePhoto] = useState(true);
  const [consentData, setConsentData] = useState(false);
  const [consentPublish, setConsentPublish] = useState(false);
  const [touched, setTouched] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [emailStatus, setEmailStatus] = useState<"sent" | "not-configured" | "failed">("sent");

  if (state === "done") {
    const first = name.trim().split(" ")[0];
    return (
      <section className="mt-12 text-center" aria-live="polite">
        <h2 className="font-display text-3xl">
          {t("fb.thanks", { name: first ? `, ${first}` : "" })} <em>{t("fb.thanks2")}</em>
        </h2>
        <div className="hair" />
        <p className="text-muted">{emailStatus === "sent" ? t("fb.sent") : t("fb.saved")}</p>
      </section>
    );
  }

  const ready = rating > 0 && consentData;

  const submit = async () => {
    setTouched(true);
    if (!ready || state === "sending") return;
    setState("sending");
    // Al equipo le llega en español, con el idioma de la usuaria anotado.
    const labels = tags.map((tag) => DICTS.es[`fb.tag.${tag}`]);
    const prefix = [
      lang !== "es" ? `(${lang.toUpperCase()})` : "",
      labels.length ? `[${labels.join(" · ")}]` : "",
    ]
      .filter(Boolean)
      .join(" ");
    const text = [prefix, comment.trim()].filter(Boolean).join(" ");
    try {
      const result = await sendFeedback({
        data: {
          rating,
          comment: text.slice(0, 1000),
          situation,
          look,
          name: name.trim().slice(0, 60),
          photo: photo && sharePhoto ? photo : "",
          consentData: true,
          consentPublish,
        },
      });
      setEmailStatus(result.emailStatus);
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <section className="mt-12 text-center">
      <h2 className="font-display text-3xl">
        {t("fb.title1")} <em>{t("fb.title2")}</em>
      </h2>
      <div className="hair" />
      <p className="text-muted">{t("fb.sub")}</p>
      <div className="glass mt-5 rounded-3xl p-5 text-left">
        <div className="flex justify-center gap-2" role="radiogroup" aria-label={t("fb.rating")}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={t("fb.stars", { n })}
              className="min-h-11 min-w-11"
              onClick={() => setRating(n)}
            >
              <Star filled={n <= rating} />
            </button>
          ))}
        </div>
        {touched && rating < 1 ? (
          <p className="mt-1 text-center text-xs text-blush">{t("fb.pickStars")}</p>
        ) : null}

        <p className="mt-5 text-sm font-medium text-ink">{t("fb.highlight")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TAGS.map((tag) => {
            const on = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setTags((list) => (on ? list.filter((x) => x !== tag) : [...list, tag]))
                }
                className={`min-h-10 rounded-full border px-3.5 text-sm transition-colors ${
                  on ? "border-blush bg-blush text-white" : "border-line bg-white/70 text-ink"
                }`}
              >
                {t(`fb.tag.${tag}`)}
              </button>
            );
          })}
        </div>

        <label className="mt-5 block text-sm font-medium text-ink" htmlFor="neusta-opinion">
          {t("fb.review")}
        </label>
        <textarea
          id="neusta-opinion"
          value={comment}
          maxLength={900}
          onChange={(event) => setComment(event.target.value)}
          placeholder={t("fb.review.ph")}
          className="mt-2 h-28 w-full rounded-2xl border border-line bg-white p-3 text-base text-ink"
        />

        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="neusta-nombre">
          {t("fb.name")} <span className="font-normal text-muted">{t("fb.optional")}</span>
        </label>
        <input
          id="neusta-nombre"
          type="text"
          autoComplete="given-name"
          value={name}
          maxLength={60}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("fb.name.ph")}
          className="mt-2 min-h-12 w-full rounded-2xl border border-line bg-white px-3 text-base text-ink"
        />

        {photo ? (
          <label className="mt-4 flex items-center gap-3 rounded-2xl bg-white/70 p-3 text-sm">
            <img src={photo} alt={t("fb.photoAlt")} className="size-14 rounded-xl object-cover" />
            <span className="flex-1">{t("fb.photo")}</span>
            <input
              type="checkbox"
              checked={sharePhoto}
              onChange={(event) => setSharePhoto(event.target.checked)}
              className="size-5 accent-[#a8475f]"
            />
          </label>
        ) : null}

        <div className="mt-4 space-y-3 rounded-2xl bg-white/60 p-4 text-sm">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={consentData}
              onChange={(event) => setConsentData(event.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-[#a8475f]"
            />
            <span>
              {t("fb.consentData")} <span className="text-blush">*</span>
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={consentPublish}
              onChange={(event) => setConsentPublish(event.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-[#a8475f]"
            />
            <span>
              {t("fb.consentPublish")} {t("fb.optional")}
            </span>
          </label>
          {touched && !consentData ? (
            <p className="text-xs text-blush">{t("fb.consentNeeded")}</p>
          ) : null}
          <p className="text-xs leading-relaxed text-muted">{t("fb.privacy")}</p>
        </div>

        <button
          type="button"
          disabled={state === "sending"}
          onClick={submit}
          className={`bg-ink mt-5 min-h-12 w-full rounded-full px-6 font-semibold text-white ${ready ? "" : "opacity-60"}`}
        >
          {state === "sending" ? t("fb.sending") : t("fb.send")}
        </button>
        {state === "error" ? (
          <p className="mt-3 text-center text-sm text-muted" role="alert">
            {t("fb.error")}
          </p>
        ) : null}
      </div>
    </section>
  );
}
