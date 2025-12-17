import { useMemo, useState } from "react";

const DUMMY_TOOLS = [
  {
    id: 1,
    name: "Envato Elements",
    expiresAt: "12/21/25",
    image:
      "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=1200&q=60",
  },
  {
    id: 2,
    name: "Canva Pro",
    expiresAt: "01/10/26",
    image:
      "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=60",
  },
  {
    id: 3,
    name: "Leonardo AI",
    expiresAt: "02/05/26",
    image:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=60",
  },
];

export default function Dashboard() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return DUMMY_TOOLS.filter((t) =>
      t.name.toLowerCase().includes(q.toLowerCase())
    );
  }, [q]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-purple-700">Dashboard</h1>

        <div className="mt-4 rounded-2xl border bg-blue-50 p-5">
          <div className="text-lg font-semibold text-purple-700">
            Welcome, User
          </div>
          <div className="text-sm text-purple-600 mt-1">
            Your active subscriptions are shown below.
          </div>
        </div>

        <div className="mt-6 rounded-2xl border bg-white p-5">
          <div className="font-semibold mb-3">Active Resources</div>

          <input
            className="w-full border rounded-xl px-4 py-2 mb-5"
            placeholder="Type to filter..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="border rounded-2xl overflow-hidden bg-white shadow-sm"
              >
                <div className="h-40 bg-gray-100">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-4">
                  <div className="text-purple-700 font-semibold">{t.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Expires {t.expiresAt}
                  </div>

                  <div className="mt-4 flex justify-center">
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl flex items-center gap-2">
                      Access <span aria-hidden>🔒</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-gray-500">No tools found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
