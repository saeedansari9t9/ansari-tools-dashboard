import React, { useState } from "react";
import { MessageCircle, X, ShieldAlert, ExternalLink } from "lucide-react";

const NEW_WHATSAPP_DIGITS = "923227866655";
const NEW_WHATSAPP_DISPLAY = "0322 7866655";

export default function WhatsAppBadge() {
  const [bubbleDismissed, setBubbleDismissed] = useState(false);

  const prefilledMessage = encodeURIComponent(
    "Hello Ansari Tools, I am contacting you from the Dashboard on your new official WhatsApp number."
  );
  const whatsappUrl = `https://wa.me/${NEW_WHATSAPP_DIGITS}?text=${prefilledMessage}`;

  const handleOpenWhatsApp = () => {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end select-none pointer-events-auto">
      {/* Speech Bubble / Notice on top of WhatsApp Icon */}
      {!bubbleDismissed && (
        <div
          onClick={handleOpenWhatsApp}
          className="relative mb-2.5 max-w-[275px] sm:max-w-[290px] bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200/90 shadow-[0_12px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] cursor-pointer group hover:border-emerald-300 transition-all duration-200 animate-fade-in-up"
          role="alert"
          aria-label="Official WhatsApp Notice"
        >
          {/* Header Row: Alert Badge & Close Button */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-600 border border-rose-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Old WhatsApp Deactivated
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setBubbleDismissed(true);
              }}
              className="w-5 h-5 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              title="Dismiss note"
              aria-label="Dismiss note"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Description */}
          <p className="mt-1.5 text-[12px] font-medium text-slate-600 leading-snug">
            Please contact our new official WhatsApp for support & queries:
          </p>

          {/* Number Action Pill */}
          <div className="mt-2 flex items-center justify-between bg-emerald-50/80 group-hover:bg-emerald-100/90 border border-emerald-200/80 rounded-xl px-2.5 py-1.5 transition-colors">
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
              <span className="font-mono font-bold text-xs text-emerald-800 tracking-wide">
                {NEW_WHATSAPP_DISPLAY}
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              Chat
              <ExternalLink className="w-3 h-3" />
            </span>
          </div>

          {/* Speech Bubble Arrow pointing to the WhatsApp Icon */}
          <div className="absolute -bottom-2 right-6 w-3.5 h-3.5 bg-white border-r border-b border-slate-200/90 transform rotate-45" />
        </div>
      )}

      {/* Circular Floating WhatsApp Button */}
      <button
        onClick={handleOpenWhatsApp}
        className="relative group w-14 h-14 sm:w-[58px] sm:h-[58px] rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-[0_6px_24px_rgba(37,211,102,0.5)] hover:shadow-[0_8px_30px_rgba(37,211,102,0.65)] hover:scale-108 active:scale-95 transition-all duration-300 cursor-pointer"
        aria-label="Contact Ansari Tools on WhatsApp"
        title="Chat on New WhatsApp"
      >
        {/* Subtle Pulse Ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-35 animate-ping pointer-events-none" />

        {/* WhatsApp Official SVG Icon */}
        <svg
          className="w-7 h-7 sm:w-8 sm:h-8 fill-current relative z-10 transition-transform duration-300 group-hover:scale-110"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.484 3.488" />
        </svg>

        {/* Online Status Green Indicator Dot */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white" />
      </button>
    </div>
  );
}
