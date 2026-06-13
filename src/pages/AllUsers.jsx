import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUsers, deleteUser, createUser, resetUserPassword, getUserLogs } from "../utils/api";

export default function AllUsers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    password: "",
    role: "user"
  });
  const [adding, setAdding] = useState(false);

  const [resetUser, setResetUser] = useState(null); // stores { id, username }
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  // User Logs modal states
  const [logsUser, setLogsUser] = useState(null); // stores user object
  const [userLogs, setUserLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [copiedIp, setCopiedIp] = useState(null);
  const [logsError, setLogsError] = useState("");

  // ✅ Your User model fields: name, username, role
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;

    return users.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const username = (u.username || "").toLowerCase();
      const role = (u.role || "").toLowerCase();
      return name.includes(s) || username.includes(s) || role.includes(s);
    });
  }, [users, q]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllUsers();
      const list = res.data?.users ?? res.data ?? [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => (u._id || u.id) !== id));
    } catch (e) {
      alert(e?.response?.data?.message || "Delete failed");
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.username || !newUser.password) {
      alert("Name, username, and password are required");
      return;
    }

    setAdding(true);
    try {
      const res = await createUser({
        name: newUser.name,
        username: newUser.username,
        password: newUser.password,
        role: newUser.role
      });
      alert("✅ User added successfully!");
      setUsers((prev) => [res.data.user, ...prev]);
      setNewUser({ name: "", username: "", password: "", role: "user" });
      setModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add user");
    } finally {
      setAdding(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPassword) {
      alert("Password is required");
      return;
    }

    setResetting(true);
    try {
      await resetUserPassword(resetUser.id, { password: resetPassword });
      alert("✅ Password reset successfully!");
      setResetPassword("");
      setResetUser(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  const handleCopyIp = (ip) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const fetchUserLogs = async (userId) => {
    setLoadingLogs(true);
    setLogsError("");
    try {
      const res = await getUserLogs({ userId });
      setUserLogs(res.data?.logs || []);
    } catch (err) {
      setLogsError(err.response?.data?.message || "Failed to load login logs");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (logsUser) {
      const id = logsUser._id || logsUser.id;
      fetchUserLogs(id);
    } else {
      setUserLogs([]);
    }
  }, [logsUser]);

  const parseUA = (ua) => {
    if (!ua || ua === "unknown") return "Unknown Device";
    let os = "Unknown OS";
    let browser = "Unknown Browser";

    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Macintosh") || ua.includes("Mac OS X")) os = "macOS";
    else if (ua.includes("iPhone")) os = "iPhone";
    else if (ua.includes("iPad")) os = "iPad";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("Linux")) os = "Linux";

    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Chrome") && !ua.includes("Chromium") && !ua.includes("Edg")) browser = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
    else if (ua.includes("Chromium")) browser = "Chromium";

    return `${browser} on ${os}`;
  };

  return (
    <div className="p-4 sm:p-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">All Users</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage users, search and remove accounts.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name/username..."
            className="h-10 w-full md:w-64 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-800"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={load}
              className="h-10 flex-1 sm:flex-initial rounded-xl bg-slate-100 border border-slate-200 text-slate-700 px-4 text-sm hover:bg-slate-200 transition-colors cursor-pointer font-medium"
            >
              Refresh
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="h-10 flex-1 sm:flex-initial rounded-xl bg-indigo-600 text-white px-4 text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-600/10 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              + Add User
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white overflow-hidden w-full max-w-full">
        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-[900px] w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                  <th className="text-left px-6 py-4.5 font-bold">Name</th>
                  <th className="text-left px-6 py-4.5 font-bold">Username</th>
                  <th className="text-left px-6 py-4.5 font-bold">Role</th>
                  <th className="text-left px-6 py-4.5 font-bold">Created</th>
                  <th className="text-right px-6 py-4.5 font-bold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((u) => {
                  const id = u._id || u.id;

                  const name = u.name || "—";
                  const username = u.username || "—";
                  const role = u.role || "user";

                  const formattedDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }) : "—";

                  const formattedDay = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long'
                  }) : "";

                  return (
                    <tr 
                      key={id} 
                      onClick={() => setLogsUser(u)}
                      className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 text-[14px]">{name}</div>
                        <div className="text-[12px] text-slate-400 mt-0.5 font-medium">@{username}</div>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-slate-600 font-medium">
                        @{username}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                          role === 'admin' 
                            ? 'bg-indigo-50 text-indigo-600' 
                            : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 text-[13px]">{formattedDate}</div>
                        {formattedDay && (
                          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{formattedDay}</div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLogsUser(u);
                            }}
                            className="h-8 px-4 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition active:scale-95 cursor-pointer"
                          >
                            Logs
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setResetUser({ id, username });
                            }}
                            className="h-8 px-4 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100/70 font-semibold text-xs transition active:scale-95 cursor-pointer"
                          >
                            Reset Pass
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(id);
                            }}
                            className="h-8 px-4 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100/70 font-semibold text-xs transition active:scale-95 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-8 text-center text-slate-500 font-medium"
                      colSpan={5}
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-8 w-full max-w-md shadow-2xl relative animate-fade-in-up" style={{ animationDuration: '0.25s' }}>
            <h2 className="text-xl font-bold text-slate-900">Add New User</h2>
            <p className="text-sm text-slate-500 mt-1">Create a regular user or admin account directly.</p>

            <form onSubmit={handleAddUser} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 text-sm"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. johndoe12"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 text-sm"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Create password"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 text-sm"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition active:scale-95 shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  {adding ? "Adding..." : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-8 w-full max-w-md shadow-2xl relative animate-fade-in-up" style={{ animationDuration: '0.25s' }}>
            <h2 className="text-xl font-bold text-slate-900">Reset Password</h2>
            <p className="text-sm text-slate-500 mt-1">
              Set a new password for <span className="font-semibold text-slate-700">@{resetUser.username}</span>.
            </p>

            <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 text-sm"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setResetUser(null);
                    setResetPassword("");
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition active:scale-95 shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  {resetting ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Logs Modal */}
      {logsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-8 w-full max-w-4xl shadow-2xl relative animate-fade-in-up flex flex-col max-h-[85vh]" style={{ animationDuration: '0.25s' }}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Login History</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Showing logs for <span className="font-semibold text-indigo-600">{logsUser.name}</span> (@{logsUser.username})
                </p>
              </div>
              <button
                onClick={() => setLogsUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto">
              {loadingLogs ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                  <p className="text-sm font-medium text-slate-500">Loading user logs...</p>
                </div>
              ) : logsError ? (
                <div className="p-6 text-center text-sm text-rose-600 font-semibold">{logsError}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-wider font-bold text-left">
                        <th className="px-4 py-3 font-bold">IP Address</th>
                        <th className="px-4 py-3 font-bold">Time & Date</th>
                        <th className="px-4 py-3 font-bold">Device & Browser</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userLogs.map((log) => {
                        const rawIp = log.ip || "unknown";
                        const displayIp = (rawIp === "::1" || rawIp === "::ffff:127.0.0.1") ? "127.0.0.1 (Localhost)" : rawIp;
                        const copyIp = (rawIp === "::1" || rawIp === "::ffff:127.0.0.1") ? "127.0.0.1" : rawIp;

                        const dateStr = log.createdAt
                          ? new Date(log.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—";

                        const timeStr = log.createdAt
                          ? new Date(log.createdAt).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                          : "";

                        return (
                          <tr key={log._id || log.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                            {/* IP */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5 text-xs select-all">
                                  {displayIp}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyIp(copyIp);
                                  }}
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                  title="Copy IP Address"
                                >
                                  {copiedIp === copyIp ? (
                                    <span className="text-[10px] text-emerald-600 font-bold">Copied</span>
                                  ) : (
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-6 4h6m-3-3v6" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </td>
                            
                            {/* Time */}
                            <td className="px-4 py-3 text-slate-700 font-medium">
                              <div>{dateStr}</div>
                              {timeStr && <div className="text-[11px] text-slate-400 mt-0.5">{timeStr}</div>}
                            </td>

                            {/* Device */}
                            <td className="px-4 py-3">
                              <div className="text-slate-700 font-medium text-[13px]">
                                {parseUA(log.userAgent)}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5" title={log.userAgent}>
                                {log.userAgent}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {userLogs.length === 0 && (
                        <tr>
                          <td className="px-4 py-8 text-center text-slate-500 font-medium" colSpan={3}>
                            No login logs recorded for this user yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 pt-4 mt-4 flex justify-end">
              <button
                onClick={() => setLogsUser(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
