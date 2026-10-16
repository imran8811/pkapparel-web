/** Helpers shared by server and client components (no secrets here). */

export function whatsappUrl(number: string, message?: string): string {
  const url = `https://wa.me/${number.replace(/\D/g, "")}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}

export function telUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
