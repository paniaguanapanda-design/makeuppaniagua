/** Server-side generation controls shared by the catalog and edit endpoint. */
export function imageGenerationConfig() {
  const flag = process.env.ENABLE_IMAGE_GEN ?? process.env.ENEBLE_IMAGE_GEN;
  const value = Number(process.env.MAX_IMAGE_GENERATIONS ?? 1);
  return {
    enabled: flag !== "false",
    max: Number.isFinite(value) ? Math.min(3, Math.max(1, Math.floor(value))) : 1,
  };
}

export function imageApiError(status: number): string {
  switch (status) {
    case 401:
      return "xAI no acepta la clave configurada (401). Revisa XAI_API_KEY.";
    case 402:
      return "xAI rechazó la solicitud por facturación (402). Revisa el crédito de la cuenta asociada a la clave.";
    case 403:
      return "xAI denegó el acceso (403). Revisa los permisos de la clave y del modelo.";
    case 400:
    case 404:
    case 422:
      return `xAI rechazó la solicitud de imagen (${status}). Revisa el modelo, la foto y el formato de la solicitud.`;
    case 429:
      return "xAI ha limitado las solicitudes (429). Revisa tus límites y vuelve a intentarlo más tarde.";
    default:
      return `No pude crear la imagen: xAI respondió ${status}. Inténtalo más tarde.`;
  }
}
