import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUsers, deleteUser, createUser, resetUserPassword } from "../utils/api";

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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">All Users</h1>
          <p className="text-sm text-slate-500">
            Manage users, search and remove accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name/username/role…"
            className="h-10 w-72 max-w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
          />
          <button
            onClick={load}
            className="h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 px-4 text-sm hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Refresh
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="h-10 rounded-xl bg-indigo-600 text-white px-4 text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-600/10 transition-all active:scale-95 cursor-pointer"
          >
            + Add User
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
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
                    <tr key={id} className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
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
                            onClick={() => navigate(`/admin/login-logs?userId=${id}`)}
                            className="h-8 px-4 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition active:scale-95 cursor-pointer"
                          >
                            Logs
                          </button>
                          <button
                            onClick={() => setResetUser({ id, username })}
                            className="h-8 px-4 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100/70 font-semibold text-xs transition active:scale-95 cursor-pointer"
                          >
                            Reset Pass
                          </button>
                          <button
                            onClick={() => onDelete(id)}
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
    </div>
  );
}
