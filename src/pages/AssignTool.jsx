import { useEffect, useState, useRef } from "react";
import { API, getAllUsers } from "../utils/api"; // axios instance and helper

export default function AssignTool() {
  const [username, setUsername] = useState("");
  const [toolSlug, setToolSlug] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [tools, setTools] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSearchTerm(username);
  }, [username]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(term);
    const userMatch = u.username?.toLowerCase().includes(term);
    return nameMatch || userMatch;
  });

  useEffect(() => {
    (async () => {
      // Fetch tools
      try {
        const res = await API.get("/admin/tools");
        setTools(res.data.tools || []);
        if ((res.data.tools || []).length > 0) {
          setToolSlug(res.data.tools[0].slug);
        }
      } catch (err) {
        console.error("Error loading tools:", err);
      }

      // Fetch users
      try {
        const resUsers = await getAllUsers();
        const list = resUsers.data?.users ?? resUsers.data ?? [];
        setUsers(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Error loading users:", err);
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
          <div className="relative" ref={dropdownRef}>
            <label className="text-sm font-medium text-slate-600">Username</label>
            <div className="relative mt-1">
              <input
                type="text"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-10 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 placeholder:text-slate-400 text-sm"
                placeholder="Search username or name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setUsername(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsOpen(!isOpen);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {isOpen && (
              <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200/80 bg-white py-1.5 shadow-xl shadow-slate-200/50 outline-none animate-fade-in-up" style={{ animationDuration: '0.15s' }}>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <button
                      key={u._id || u.id}
                      type="button"
                      onClick={() => {
                        setUsername(u.username);
                        setSearchTerm(u.username);
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center gap-3 cursor-pointer"
                    >
                      {/* Dynamic initial letter avatar */}
                      <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[11px] font-bold text-indigo-600 uppercase">
                        {u.username.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700 leading-none">@{u.username}</span>
                        {u.name && (
                          <span className="text-xs text-slate-400 font-medium mt-1">{u.name}</span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-400 text-center font-medium">
                    No users found
                  </div>
                )}
              </div>
            )}
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
