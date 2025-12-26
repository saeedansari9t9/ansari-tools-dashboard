import { useEffect, useMemo, useState } from "react";
import { getMe, getMyTools } from "../utils/api";

export default function Dashboard() {
  const [q, setQ] = useState("");
  const [me, setMe] = useState(null);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await getMe();
        setMe(u.data);

        const t = await getMyTools();
        setTools(t.data.tools || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

    // FINAL SUPER SAFE TOKEN SYNC – NO ERROR EVER!
  useEffect(() => {
    const syncToken = () => {
      // Yeh check bilkul safe hai – optional chaining + typeof
      if (
        typeof window !== "undefined" &&
        typeof window.chrome !== "undefined" &&
        window.chrome &&
        window.chrome.storage &&
        window.chrome.storage.local &&
        typeof window.chrome.storage.local.set === "function"
      ) {
        const token = localStorage.getItem("token");
        if (token) {
          window.chrome.storage.local.set({ token: token }, () => {
            console.log("%cAnsariTools: Token synced to extension! ✅", "color: green; font-size: 16px; font-weight: bold;");
          });
        }
      }
    };

    // Page load par ek baar sync
    syncToken();

    // Har 5 seconds mein check (user logout/login kare to bhi update ho)
    const interval = setInterval(syncToken, 5000);

    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    return tools.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));
  }, [q, tools]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Your active tools are listed below.
        </p>

        <div className="mt-5 rounded-2xl bg-white border border-slate-200 p-4 sm:p-5">
          <div className="text-base sm:text-lg font-semibold text-slate-900">
            Welcome, {me?.username || "User"} 👋
          </div>
          <div className="text-sm text-slate-500 mt-1">
            You can access your subscribed tools anytime.
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="font-semibold text-slate-900">Active Resources</div>

            <input
              className="w-full sm:w-80 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Search tool..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="mt-6 text-slate-500">Loading...</div>
          ) : (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition"
                >
                  <div className="h-36 sm:h-40 bg-slate-100">
                    <img
                      src={t.image}
                      alt={t.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-4">
                    <div className="text-slate-900 font-semibold">{t.name}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Expires {new Date(t.expiresAt).toLocaleDateString()}
                    </div>

                    <a
                      href={t.accessUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 block w-full text-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 font-semibold"
                    >
                      Access
                    </a>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="text-slate-500">No tools found.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
