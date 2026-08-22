import { WHATSAPP_NUMBER } from "@/lib/mock-data";

export function WhatsAppButton({ label = "Order on WhatsApp" }: { label?: string }) {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noreferrer"
      className="flex w-full items-center justify-center gap-2 rounded-full border border-success/40 bg-success/10 py-3 text-sm font-semibold text-success"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1s-.7 1-.9 1.2c-.2.2-.3.2-.6.1-1.7-.9-2.9-1.6-4-3.6-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.6s-.7-1.6-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.7s1.2 3.1 1.4 3.4c.2.2 2.4 3.7 5.8 5.1 2.2.9 3 1 4 .9.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4Z" />
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z" />
      </svg>
      {label}
    </a>
  );
}
