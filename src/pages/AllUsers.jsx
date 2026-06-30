import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API, getAllUsers, deleteUser, createUser, resetUserPassword, getUserLogs, unlockUser, lockUser, getAllTools, clearSession } from "../utils/api";
import Swal from "sweetalert2";
import { Lock, LockOpen, Check, Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";

// Reusable Swal toast for quick success/error notifications
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

let cachedUsers = null;
let cachedUsersTools = null;

export default function AllUsers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!cachedUsers);
  const [users, setUsers] = useState(cachedUsers || []);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    password: "",
    role: "user",
    toolSlug: "",
    expiresAt: ""
  });
  const [adding, setAdding] = useState(false);
  const [createdUserInfo, setCreatedUserInfo] = useState(null); // stores { username, password }
  const [showAddUserPass, setShowAddUserPass] = useState(false);
  const [tools, setTools] = useState(cachedUsersTools || []);

  const getWhatsAppTemplate = (username, password) => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return `🚀 *WELCOME TO ANSARI TOOLS* 🚀

📅 *Activation Date:* ${dateStr}
🌐 *Access Portal:* 
https://dash.ansaritools.com/login

👤 *Username:* 
${username}

🔑 *Password:* 
${password}

✨ _Thanks for purchasing!_
~ *Ansari Tools*`;
  };


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
    if (!cachedUsers) setLoading(true);
    setError("");
    try {
      const res = await getAllUsers();
      const list = res.data?.users ?? res.data ?? [];
      cachedUsers = Array.isArray(list) ? list : [];
      setUsers(cachedUsers);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadTools = async () => {
    try {
      const res = await getAllTools();
      const list = res.data?.tools ?? res.data ?? [];
      cachedUsersTools = list;
      setTools(list);
    } catch (err) {
      console.error("Failed to load tools:", err);
    }
  };

  useEffect(() => {
    load();
    loadTools();
  }, []);

  const onDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete User?",
      text: "This action cannot be undone. The user will be permanently removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
      borderRadius: "16px",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => (u._id || u.id) !== id));
      Toast.fire({ icon: "success", title: "User deleted successfully" });
    } catch (e) {
      Toast.fire({ icon: "error", title: e?.response?.data?.message || "Delete failed" });
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      Toast.fire({ icon: "warning", title: "Username and password are required" });
      return;
    }

    setAdding(true);
    try {
      const res = await createUser({
        name: newUser.name.trim() || newUser.username.trim(),
        username: newUser.username,
        password: newUser.password,
        role: newUser.role
      });
      const createdUsername = newUser.username;
      const createdPassword = newUser.password;

      if (newUser.toolSlug && newUser.expiresAt) {
        try {
          await API.post("/admin/assign-tool", {
            username: createdUsername,
            toolSlug: newUser.toolSlug,
            expiresAt: newUser.expiresAt
          });
        } catch (assignErr) {
          console.error("Assign tool failed:", assignErr);
          toast.error(assignErr.response?.data?.message || "User created, but tool assignment failed.");
        }
      }

      setUsers((prev) => [res.data.user, ...prev]);
      setNewUser({ name: "", username: "", password: "", role: "user", toolSlug: "", expiresAt: "" });
      setShowAddUserPass(false);
      setModalOpen(false);
      setCreatedUserInfo({ username: createdUsername, password: createdPassword });
      toast.success("User created successfully!", { position: "top-center" });
    } catch (err) {
      Toast.fire({ icon: "error", title: err.response?.data?.message || "Failed to add user" });
    } finally {
      setAdding(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPassword) {
      Toast.fire({ icon: "warning", title: "Password is required" });
      return;
    }

    setResetting(true);
    try {
      await resetUserPassword(resetUser.id, { password: resetPassword });
      setResetPassword("");
      setResetUser(null);
      Toast.fire({ icon: "success", title: "Password reset successfully!" });
    } catch (err) {
      Toast.fire({ icon: "error", title: err.response?.data?.message || "Failed to reset password" });
    } finally {
      setResetting(false);
    }
  };

  const handleUnlock = async (id, username) => {
    const result = await Swal.fire({
      title: `Unlock @${username}?`,
      text: "They will be able to log in again from any device.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Unlock",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await unlockUser(id);
      setUsers(prev => prev.map(u => (u._id || u.id) === id ? { ...u, isLocked: false, lockReason: null } : u));
      Toast.fire({ icon: "success", title: `@${username} has been unlocked` });
    } catch (err) {
      Toast.fire({ icon: "error", title: err.response?.data?.message || "Failed to unlock account" });
    }
  };

  const handleLock = async (id, username) => {
    const result = await Swal.fire({
      title: `Lock @${username}?`,
      html: `<p style="color:#64748b;font-size:14px">They will <b>not</b> be able to log in until an admin unlocks their account.</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Lock Account",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d97706",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await lockUser(id, "Manually locked by administrator.");
      setUsers(prev => prev.map(u => (u._id || u.id) === id ? { ...u, isLocked: true } : u));
      Toast.fire({ icon: "success", title: `@${username}'s account has been locked` });
    } catch (err) {
      Toast.fire({ icon: "error", title: err.response?.data?.message || "Failed to lock account" });
    }
  };

  const handleClearSession = async (id, username) => {
    const result = await Swal.fire({
      title: `Clear Session for @${username}?`,
      text: "This will log them out of all devices instantly so they can log in again.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Clear Session",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
      borderRadius: "16px",
    });
    if (!result.isConfirmed) return;
    try {
      await clearSession(id);
      Toast.fire({ icon: "success", title: `Session cleared for @${username}` });
    } catch (err) {
      Toast.fire({ icon: "error", title: err.response?.data?.message || "Failed to clear session" });
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
                  <th className="text-left px-6 py-4.5 font-bold">Status</th>
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
                      {/* Lock Status */}
                      <td className="px-6 py-4">
                        {u.isLocked ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-600">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 text-[13px]">{formattedDate}</div>
                        {formattedDay && (
                          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{formattedDay}</div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end items-center gap-1.5 flex-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLogsUser(u);
                            }}
                            className="h-8 px-3 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition active:scale-95 cursor-pointer"
                          >
                            Logs
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearSession(id, username);
                            }}
                            className="h-8 px-3 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold text-xs transition active:scale-95 cursor-pointer"
                          >
                            Clear Session
                          </button>
                          {u.isLocked ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnlock(id, username);
                              }}
                              className="h-8 px-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <LockOpen className="w-3.5 h-3.5" /> Unlock
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLock(id, username);
                              }}
                              className="h-8 px-3 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold text-xs transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Lock className="w-3.5 h-3.5" /> Lock
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setResetUser({ id, username });
                            }}
                            className="h-8 px-3 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100/70 font-semibold text-xs transition active:scale-95 cursor-pointer"
                          >
                            Reset Pass
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(id);
                            }}
                            className="h-8 px-3 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100/70 font-semibold text-xs transition active:scale-95 cursor-pointer"
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
                  placeholder="e.g. John Doe (Optional)"
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
                <div className="relative mt-1">
                  <input
                    type={showAddUserPass ? "text" : "password"}
                    required
                    placeholder="Create password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-4 pr-12 py-2.5 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 text-sm"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddUserPass(!showAddUserPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition active:scale-95 cursor-pointer"
                    title={showAddUserPass ? "Hide password" : "Show password"}
                  >
                    {showAddUserPass ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Optional Tool Assignment */}
              <div className="border-t border-slate-100 pt-4 mt-4 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800">Assign Subscription Tool (Optional)</h3>
                
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Select Tool</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 text-sm cursor-pointer"
                    value={newUser.toolSlug}
                    onChange={(e) => setNewUser({ ...newUser, toolSlug: e.target.value })}
                  >
                    <option value="">— None (No Tool Assigned) —</option>
                    {tools.map((t) => (
                      <option key={t.slug} value={t.slug}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {newUser.toolSlug && (
                  <div className="animate-fade-in">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Expiry Date</label>
                    <input
                      type="date"
                      required={!!newUser.toolSlug}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 text-sm"
                      value={newUser.expiresAt}
                      onChange={(e) => setNewUser({ ...newUser, expiresAt: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setShowAddUserPass(false);
                    setNewUser({ name: "", username: "", password: "", role: "user", toolSlug: "", expiresAt: "" });
                  }}
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

      {/* User Created Success Modal with WhatsApp Copy Text */}
      {createdUserInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-8 w-full max-w-md shadow-2xl relative animate-fade-in-up flex flex-col items-center" style={{ animationDuration: '0.25s' }}>
            
            {/* Green Check Animation Icon */}
            <div className="h-16 w-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 animate-bounce" style={{ animationIterationCount: 1, animationDuration: '1s' }}>
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 text-center">User Created Successfully!</h2>
            <p className="text-sm text-slate-500 mt-1 text-center">
              Here is the formatted WhatsApp message for your client.
            </p>

            {/* Template Display Box */}
            <div className="mt-5 w-full relative group">
              <pre className="w-full h-48 bg-slate-950 text-slate-200 font-mono text-xs rounded-2xl p-4 select-all outline-none overflow-y-auto border border-slate-800 text-left whitespace-pre-wrap leading-relaxed shadow-inner">
                {getWhatsAppTemplate(createdUserInfo.username, createdUserInfo.password)}
              </pre>
            </div>

            {/* Actions */}
            <div className="w-full mt-6 space-y-2">
              <button
                type="button"
                onClick={() => {
                  const text = getWhatsAppTemplate(createdUserInfo.username, createdUserInfo.password);
                  navigator.clipboard.writeText(text);
                  toast.success("WhatsApp message copied to clipboard!", {
                    duration: 3000,
                    position: "top-center"
                  });
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10 hover:shadow-emerald-700/20 transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                <Copy className="w-4 h-4" /> Copy WhatsApp Message
              </button>
              
              <button
                type="button"
                onClick={() => setCreatedUserInfo(null)}
                className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition duration-200 active:scale-[0.98] cursor-pointer text-center"
              >
                Done
              </button>
            </div>

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
