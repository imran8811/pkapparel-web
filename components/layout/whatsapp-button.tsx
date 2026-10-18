"use client";

import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { whatsappUrl } from "@/lib/links";

/**
 * Floating "chat on WhatsApp" button. When clicked, the message is pre-filled
 * with the page the visitor is looking at, so sales knows which product they mean.
 */
export function WhatsAppButton({ number }: { number: string }) {
  const fallback = whatsappUrl(number, "Hello PK Apparel, I'd like to discuss a wholesale order.");

  return (
    <a
      href={fallback}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with PK Apparel on WhatsApp"
      onClick={(event) => {
        event.currentTarget.href = whatsappUrl(
          number,
          `Hello PK Apparel, I'm interested in: ${document.title}\n${window.location.href}`,
        );
      }}
      className="group fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-[#25d366] p-3.5 text-denim-950 shadow-lg shadow-black/20 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:ring-4 focus-visible:ring-[#25d366]/40 focus-visible:outline-none sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="size-6" />
      <span className="hidden pr-1 text-sm font-semibold md:inline">Chat with us</span>
    </a>
  );
}
