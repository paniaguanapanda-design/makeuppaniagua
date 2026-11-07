import { personPrompt, type PersonBrief } from "@/lib/makeup/profile";
import type { Depth, FaceRead, SituationId, Undertone, ZoneId } from "@/lib/makeup/types";

export const OPTION_IDS = ["piel", "poco", "natural", "definido", "cargado"] as const;
export type OptionId = (typeof OPTION_IDS)[number];

export type LookOption = {
  id: OptionId;
  title: string;
  line: string;
  prompt: string;
  zones: ZoneId[];
  instructions?: Partial<Record<ZoneId, string>>;
  productHints?: Partial<Record<ZoneId, string>>;
};

const TONE_FIT: Record<Undertone, string> = {
  calido:
    "Warm undertone: peach, bronze and brown-rose. Other colors are welcome if the client prefers them.",
  frio: "Cool undertone: rose, mauve and taupe. Other colors are welcome if the client prefers them.",
  neutro: "Neutral undertone: shades that look like they came from this skin.",
};

const DEPTH_FIT: Record<Depth, string> = {
  clara: "Fair skin: sheer pigment, nothing chalky or mask-like.",
  media: "Medium skin: the color has to read, without looking painted on.",
  profunda: "Deep skin: rich shades matched to this depth. No pale or ashy colors.",
};

const OCCASION: Record<SituationId, string> = {
  dia: "Daytime, in real daylight.",
  oficina: "An office day. Professional and quiet.",
  entrevista: "A close-up interview. Use a polished makeup look suitable for an interview.",
  cita: "A date. Warm, but still like her.",
  boda: "A wedding guest in daylight photos.",
  fiesta: "A night out. Visible evening makeup, with stronger eye and lip definition.",
  fotos: "A portrait session. Skin should look like skin on camera.",
  editorial: "A studio story. Visible fashion makeup with deliberate color and definition.",
};

// Each occasion owns three recipes, not three global intensity presets.
// The same instructions drive the image prompt and the selected look's steps.
type Recipe = {
  title: string;
  line: string;
  eyes: string;
  lips: string;
  blush: string;
  base: string;
  eyeHint: string;
  lipHint: string;
  light?: string;
};

const RECIPES: Record<SituationId, [Recipe, Recipe, Recipe]> = {
  dia: [
    {
      title: "Fresco en cinco minutos",
      line: "Velo ligero, sombra topo y labios con brillo.",
      eyes: "Extiende una sombra topo muy fina junto a las pestañas y aplica una capa de máscara separando cada pestaña. Sin ala ni ahumado.",
      lips: "Aplica labial nude con brillo en una capa fina, dentro del borde natural.",
      blush: "Difumina poco rubor melocotón en el centro de la mejilla.",
      base: "Aplica una base ligera solo donde necesites igualar, dejando ver pecas y textura.",
      eyeHint: "taupe|03",
      lipHint: "nude|pearl",
    },
    {
      title: "Mejillas de paseo",
      line: "Rubor protagonista y un toque coral en labios.",
      eyes: "Aplica una sombra rosada translúcida en el párpado móvil y máscara ligera; deja el delineado casi invisible.",
      lips: "Presiona labial coral con el dedo para un acabado de tinte, sin perfilado marcado.",
      blush:
        "Difumina rubor en crema desde la manzana hacia fuera: es el foco de este look diurno.",
      base: "Presiona una capa fina de base hidratante sin cubrir toda la piel.",
      eyeHint: "rose",
      lipHint: "coral",
    },
    {
      title: "Monocromo tierra",
      line: "Ojos tierra suaves y labio nude satinado.",
      eyes: "Difumina sombra bronce suave en el párpado, sin brillo metálico, con una línea marrón pegada a las pestañas y máscara.",
      lips: "Aplica labial nude satinado con el borde difuminado.",
      blush: "Aplica rubor cálido suave sin contorno oscuro.",
      base: "Iguala con una base satinada muy fina, sin acabado de cobertura total.",
      eyeHint: "bronze|taupe",
      lipHint: "nude",
    },
  ],
  oficina: [
    {
      title: "Reunión en calma",
      line: "Topo mate, ceja peinada y nude discreto.",
      eyes: "Difumina sombra topo mate en la cuenca y máscara en una capa; sin ala larga ni efecto ahumado.",
      lips: "Aplica labial nude mate suave sin exceder el contorno.",
      blush: "Aplica rubor neutro en una capa tenue, sin brillo.",
      base: "Aplica base semimate fina y controla solo el brillo del centro del rostro.",
      eyeHint: "taupe|03",
      lipHint: "nude",
    },
    {
      title: "Mirada precisa",
      line: "Delineado corto y labios satinados para la oficina.",
      eyes: "Traza delineado marrón muy fino con una salida corta hacia arriba, sombra topo y máscara definida sin grumos.",
      lips: "Aplica labial nude satinado de intensidad media y retira el exceso.",
      blush: "Difumina rubor rosado discreto hacia el pómulo, sin destellos.",
      base: "Iguala con base ligera satinada; evita reflejos intensos en frente y nariz.",
      eyeHint: "taupe",
      lipHint: "nude",
    },
    {
      title: "Acento ejecutivo",
      line: "Labio rojo suave con ojos deliberadamente discretos.",
      eyes: "Usa solo sombra topo clara y máscara ligera. Sin delineado dramático: el protagonismo está en los labios.",
      lips: "Aplica labial rojo en capa fina, retira con un pañuelo y difumina el borde para un rojo profesional contenido.",
      blush: "Usa poco rubor neutro para equilibrar el labio, no para competir con él.",
      base: "Aplica base semimate en capa fina, sin contorno marcado.",
      eyeHint: "taupe|03",
      lipHint: "rojo|090|pioneer",
    },
  ],
  entrevista: [
    {
      title: "Primera impresión",
      line: "Piel semimate, pestañas separadas y nude suave.",
      eyes: "Aplica sombra topo mate apenas visible y máscara que separe las pestañas. Sin ala, purpurina ni ahumado.",
      lips: "Aplica labial nude en capa fina y con borde natural, sin brillo intenso.",
      blush: "Añade rubor neutro muy suave para recuperar color sin contraste fuerte.",
      base: "Aplica base semimate ligera solo en rojeces; comprueba que no queden bordes visibles.",
      eyeHint: "taupe|03",
      lipHint: "nude",
    },
    {
      title: "Mirada abierta",
      line: "Ceja ordenada, cuenca suave y labio rosado.",
      eyes: "Define la cuenca con sombra rosada mate muy difuminada y máscara en pestañas superiores. Delineado solo entre las pestañas.",
      lips: "Presiona labial nude rosado y retira el exceso: color pulido, no dramático.",
      blush: "Aplica rubor rosado suave en diagonal corta y funde todos los bordes.",
      base: "Aplica base satinada fina y elimina brillo solo de la zona T.",
      eyeHint: "rose",
      lipHint: "nude",
    },
    {
      title: "Pulido sin distracciones",
      line: "Definición marrón corta y labios satinados moderados.",
      eyes: "Define el tercio externo con sombra topo mate y una línea marrón corta, sin negro intenso ni pestaña teatral. Aplica máscara fina.",
      lips: "Aplica labial nude satinado algo más definido, siempre dentro del borde natural.",
      blush: "Aplica rubor neutro en poca cantidad para que ojos y labios sigan equilibrados.",
      base: "Uniforma con base semimate en capas finas. No ilumines frente ni nariz.",
      eyeHint: "taupe",
      lipHint: "nude",
    },
  ],
  cita: [
    {
      title: "Rubor de cerca",
      line: "Mejillas rosadas, ojos suaves y labios con brillo.",
      eyes: "Extiende sombra rosada suave y máscara separada. Evita líneas duras para una mirada cercana.",
      lips: "Aplica labial nude con brillo fino, sin sobrepasar el contorno.",
      blush: "Difumina rubor rosado en crema en las manzanas para un efecto sonrojado.",
      base: "Usa una base hidratante fina que conserve toda la textura real.",
      eyeHint: "rose",
      lipHint: "pearl|nude",
    },
    {
      title: "Mirada romántica",
      line: "Ahumado rosado ligero con labio nude.",
      eyes: "Difumina sombra rosa tostada en la cuenca y oscurece suavemente la esquina exterior con topo; aplica máscara, sin ala gráfica.",
      lips: "Aplica labial nude satinado suave: la mirada es el foco.",
      blush: "Sube rubor rosado suavemente hacia el pómulo.",
      base: "Aplica base satinada ligera, sin contorno duro.",
      eyeHint: "rose",
      lipHint: "nude",
    },
    {
      title: "Labios de encuentro",
      line: "Rojo difuminado y mirada limpia.",
      eyes: "Aplica sombra topo muy fina y máscara alargada; no hagas un ahumado para no competir con el labio.",
      lips: "Presiona labial rojo desde el centro hacia fuera y difumina el borde, sin cambiar la forma del labio.",
      blush: "Usa rubor neutro translúcido para acompañar el rojo.",
      base: "Iguala con base satinada de cobertura ligera.",
      eyeHint: "taupe",
      lipHint: "rojo|090|pioneer",
    },
  ],
  boda: [
    {
      title: "Invitada luminosa",
      line: "Topo satinado, rubor suave y nude elegante.",
      eyes: "Aplica sombra topo satinada, delineado marrón fino y máscara de pestañas definida. Mantén el ojo luminoso sin purpurina.",
      lips: "Aplica labial nude satinado en dos capas finas retirando el exceso entre ambas.",
      blush: "Difumina rubor melocotón en capas finas para acompañar las fotos sin saturar.",
      base: "Aplica base satinada en capas finas y sella ligeramente la zona T para el evento.",
      eyeHint: "taupe",
      lipHint: "nude",
      light:
        "Aplica un punto de iluminador fino solo en la parte alta del pómulo, sin destellos grandes.",
    },
    {
      title: "Rosa de ceremonia",
      line: "Ojo rosado con profundidad suave y labios neutros.",
      eyes: "Difumina sombra rosa tostada con topo en la esquina exterior, delineado fino y máscara definida sin grumos.",
      lips: "Perfila dentro del borde natural con labial nude y aplica dos capas finas retirando el exceso.",
      blush: "Aplica rubor rosado de intensidad media, fundido hacia la sien.",
      base: "Aplica base satinada uniforme sin borrar la textura; sella solo donde aparece brillo.",
      eyeHint: "rose",
      lipHint: "nude",
      light: "Pon iluminador muy fino en el pómulo, sin extenderlo por la mejilla.",
    },
    {
      title: "Clásico de celebración",
      line: "Labial rojo elegante y delineado fino.",
      eyes: "Aplica sombra topo satinada y delineado fino con ala corta, más máscara. Sin ahumado pesado: el labio manda.",
      lips: "Aplica labial rojo de borde preciso en dos capas finas, sin agrandar los labios; retira exceso entre capas.",
      blush: "Aplica rubor neutro moderado para acompañar el rojo, sin recargar.",
      base: "Usa base semimate fina y uniforme, con sellado localizado para las horas del evento.",
      eyeHint: "taupe",
      lipHint: "rojo|090|pioneer",
    },
  ],
  fiesta: [
    {
      title: "Noche bronce",
      line: "Ojo bronce profundo y labios nude.",
      eyes: "Construye un ahumado bronce con esquina exterior oscura, delineado negro pegado a las pestañas y máscara intensa. Difumina sin manchas.",
      lips: "Aplica labial nude discreto para dejar el foco en los ojos.",
      blush: "Aplica rubor cálido moderado y fundido, sin parches.",
      base: "Aplica base satinada uniforme de cobertura media, conservando poros y textura.",
      eyeHint: "bronze",
      lipHint: "nude",
      light: "Aplica iluminador fino sobre el pómulo para un reflejo localizado.",
    },
    {
      title: "Rojo de pista",
      line: "Rojo definido y ala negra limpia.",
      eyes: "Traza delineado negro con ala visible y limpia, sombra topo mate discreta y máscara intensa. No hagas ahumado pesado.",
      lips: "Aplica labial rojo saturado con borde preciso dentro de su forma natural.",
      blush: "Usa rubor neutro suave para no competir con el labio rojo.",
      base: "Aplica base semimate en capas finas y sella la zona T.",
      eyeHint: "taupe",
      lipHint: "rojo|090",
    },
    {
      title: "Rosa nocturno",
      line: "Ahumado rosado oscuro y labio de profundidad media.",
      eyes: "Difumina sombra rosa tostada en todo el párpado, topo oscuro en la cuenca y junto a las pestañas inferiores, más máscara intensa.",
      lips: "Aplica labial rojo baya mate en capa fina con el borde suavemente definido.",
      blush: "Usa rubor rosado medio bien difuminado, sin brillo grueso.",
      base: "Aplica base satinada de cobertura media sin efecto máscara.",
      eyeHint: "rose",
      lipHint: "pioneer|090",
    },
  ],
  fotos: [
    {
      title: "Retrato fiel",
      line: "Piel semimate y contornos suaves que no distraen.",
      eyes: "Aplica sombra topo mate en una capa fina, definición marrón entre las pestañas y máscara separada.",
      lips: "Aplica labial nude satinado de borde suave, sin brillo tipo espejo.",
      blush: "Aplica rubor neutro moderado para conservar volumen en el retrato.",
      base: "Aplica base semimate fina y controla reflejos en frente, nariz y barbilla sin blanquear la piel.",
      eyeHint: "taupe",
      lipHint: "nude",
    },
    {
      title: "Retrato con mirada",
      line: "Cuenca topo definida y labios tranquilos.",
      eyes: "Define la cuenca con topo mate, profundiza el extremo externo y marca la raíz de pestañas con delineado marrón y máscara. Evita purpurina.",
      lips: "Aplica labial nude mate moderado sin sobreperfilar, dejando el foco en los ojos.",
      blush: "Difumina rubor rosado de intensidad media hacia fuera para definir sin rayas.",
      base: "Uniforma con base semimate en capas finas sin borrar líneas ni poros.",
      eyeHint: "taupe",
      lipHint: "nude",
    },
    {
      title: "Retrato de labios",
      line: "Rojo satinado como centro de la fotografía.",
      eyes: "Usa sombra topo clara y máscara fina; no añadas un ahumado que compita con el labio.",
      lips: "Aplica labial rojo satinado con borde preciso y retira exceso para evitar reflejos intensos.",
      blush: "Añade rubor neutro tenue, fundido hacia el pómulo.",
      base: "Aplica base semimate uniforme con sellado localizado, sin iluminador brillante.",
      eyeHint: "taupe",
      lipHint: "rojo|090",
    },
  ],
  editorial: [
    {
      title: "Trazo gráfico",
      line: "Delineado geométrico visible y labios nude.",
      eyes: "Traza un ala negra angular y una línea flotante fina sobre el pliegue natural, con sombra topo suave y máscara. No cambies la forma real del ojo.",
      lips: "Aplica labial nude mate para que el delineado gráfico sea el centro.",
      blush: "Usa rubor neutro mínimo y difuminado, sin competir con el trazo.",
      base: "Aplica base mate suave en capa fina, conservando textura y volumen reales.",
      eyeHint: "taupe",
      lipHint: "nude",
    },
    {
      title: "Rosa editorial",
      line: "Bloque de sombra rosada con borde controlado.",
      eyes: "Aplica sombra rosa tostada saturada en una forma alargada hacia la sien, con borde limpio exterior y máscara. No pintes fuera de la zona ocular.",
      lips: "Aplica labial nude satinado en capa fina para no competir con el bloque de color.",
      blush: "Lleva rubor rosado alto hacia la sien en una capa translúcida.",
      base: "Aplica base satinada muy fina para contrastar con el color del ojo.",
      eyeHint: "rose",
      lipHint: "nude",
    },
    {
      title: "Rojo de portada",
      line: "Labio rojo preciso y párpado bronce definido.",
      eyes: "Aplica sombra bronce de forma compacta en el párpado móvil, borde exterior limpio, delineado fino y máscara definida. Sin ahumado genérico.",
      lips: "Aplica labial rojo intenso y preciso, sin agrandar el labio: es el acento principal de esta propuesta editorial.",
      blush: "Usa rubor neutro muy tenue para sostener la composición sin añadir otro foco.",
      base: "Aplica base semimate fina sin borrar textura ni remodelar el rostro.",
      eyeHint: "bronze",
      lipHint: "rojo|090",
    },
  ],
};

export function optionsFor(situation: SituationId): LookOption[] {
  const ids: OptionId[] = ["piel", "natural", "definido"];
  return RECIPES[situation].map((recipe, index) => {
    const instructions: Partial<Record<ZoneId, string>> = {
      base: recipe.base,
      cejas: "Peina la ceja siguiendo su forma y rellena solo los huecos con trazos finos.",
      rubor: recipe.blush,
      ojos: recipe.eyes,
      labios: recipe.lips,
      ...(recipe.light ? { iluminador: recipe.light } : {}),
    };
    return {
      id: ids[index],
      title: recipe.title,
      line: recipe.line,
      instructions,
      productHints: { ojos: recipe.eyeHint, labios: recipe.lipHint },
      zones: Object.keys(instructions) as ZoneId[],
      prompt: [
        OCCASION[situation],
        `Chosen makeup design: ${recipe.title}. ${recipe.line}`,
        ...Object.entries(instructions).map(([zone, instruction]) => `${zone}: ${instruction}`),
        "These are makeup instructions, not changes to the photo lighting or styling. Follow this specific design rather than substituting a generic glam preset. Adapt shade warmth and pigment depth to the original skin without losing the chosen eye/lip focus.",
      ].join(" "),
    };
  });
}

export function optionById(situation: SituationId, id: OptionId) {
  return optionsFor(situation).find((item) => item.id === id) ?? optionsFor(situation)[1];
}

/** The kit says what the user owns, not which makeup areas must stay bare. */
export function visibleZones(option: LookOption, _owned: ZoneId[]) {
  return option.zones;
}

export function referencePrompt(
  situation: SituationId,
  option: LookOption,
  read: FaceRead,
  owned: ZoneId[] = [],
  person?: PersonBrief,
) {
  const zones = visibleZones(option, owned);
  return [
    "Edit this photograph. Keep the exact same person: same face, age, identity, hair, expression, pose, clothing and background.",
    "Do not replace them with another model. Do not paste makeup on top like a filter or face paint.",
    "Show a real photograph of this person after a makeup artist finished the look, blended into their skin.",
    "Apply actual cosmetic color to the lips, cheeks and eyes. This is a virtual makeup try-on, NOT a skin retouch, beauty filter or smoothing task. A merely softened or unchanged face is not a completed makeup look.",
    "Face shape is an orientative description, not a defect or a rule requiring contour. Respect the client preferences and original anatomy.",
    TONE_FIT[read.undertone],
    DEPTH_FIT[read.depth],
    option.prompt,
    person ? personPrompt(person) : "",
    `Complete all these makeup areas: ${zones.join(", ")}. Match cosmetic pigments to the original skin tone; do not lighten or recolor the skin itself.`,
    owned.length
      ? `Products already owned: ${owned.join(", ")}. These are available products, not restrictions: still complete the whole makeup look.`
      : "",
    "Make the chosen makeup design visible at portrait size, respecting its specified intensity and eye/lip focus. The recipe specifies lipstick, blush, eyeshadow and mascara; do not upgrade a discreet daytime design into evening glam. Keep edges professionally blended, not painted patches.",
    "Preserve pores, fine lines and natural skin texture. Do not blur, airbrush, smooth, de-age or reshape the face. No clown makeup, theatrical face paint, harsh outlines, oversized lips, plastic skin or beauty filter.",
    "No text, no watermark, no extra people.",
  ]
    .filter(Boolean)
    .join(" ");
}
