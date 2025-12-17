import { useEffect, useState } from "react";
import { API } from "../utils/api"; // axios instance (token auto attach)

export default function AssignTool() {
  const [username, setUsername] = useState("");
  const [toolSlug, setToolSlug] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await API.get("/admin/tools");
      setTools(res.data.tools || []);
      if ((res.data.tools || []).length > 0) {
        setToolSlug(res.data.tools[0].slug);
      }
    })();
  }, []);

  const assign = async (e) => {
    e.preventDefault();
    if (!username || !toolSlug || !expiresAt) {
      alert("username, tool, expiry required");
      return;
    }

    try {
      setLoading(true);
      await API.post("/admin/assign-tool", { username, toolSlug, expiresAt });
      alert("✅ Assigned successfully");
      setUsername("");
      setExpiresAt("");
    } catch (err) {
      alert(err.response?.data?.message || "Assign failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-5">
        <h1 className="text-xl font-semibold text-slate-900">Assign Tool</h1>
        <p className="text-sm text-slate-500 mt-1">
          Assign a subscription tool to a user by username.
        </p>

        <form onSubmit={assign} className="mt-5 space-y-4">
          <div>
            <label className="text-sm text-slate-600">Username</label>
            <input
              className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="e.g. ansari123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">Tool</label>
            <select
              className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              value={toolSlug}
              onChange={(e) => setToolSlug(e.target.value)}
            >
              {tools.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name} ({t.slug})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-600">Expiry Date</label>
            <input
              type="date"
              className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 font-semibold disabled:opacity-60"
          >
            {loading ? "Assigning..." : "Assign Tool"}
          </button>
        </form>
      </div>
    </div>
  );
}
