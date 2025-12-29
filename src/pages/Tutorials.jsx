import { useState } from "react";

export default function Tutorials() {
  const [youtubeUrl] = useState("https://www.youtube.com/");

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      {/* ✅ Left aligned container (no mx-auto) */}
      <div className="w-full max-w-5xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-7">
          <h1 className="text-lg sm:text-2xl font-semibold text-slate-900">
            Tutorials
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            If you're not sure how to use a tool, simply click the button below
            to watch the tutorial video. It will guide you step-by-step so you
            can start using the tool correctly.
          </p>

          {/* ✅ Mobile: stacked | Desktop: row */}
          <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center h-11 w-full sm:w-auto rounded-xl bg-indigo-600 text-white px-5 text-sm font-semibold hover:bg-indigo-500 transition"
            >
              ▶ Watch Tutorial on YouTube
            </a>

            <div className="text-[11px] sm:text-xs text-slate-500">
              (You can replace this link anytime.)
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-sm sm:text-base font-semibold text-slate-900">
            Tip
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-3xl">
            If you still face any issue after watching the tutorial, contact our
            support team and we'll help you.
          </p>
        </div>
      </div>
    </div>
  );
}
