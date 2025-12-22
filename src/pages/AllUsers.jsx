import { useEffect, useMemo, useState } from "react";
import { getAllUsers, deleteUser } from "../utils/api";

export default function AllUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

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
            className="h-10 rounded-xl bg-slate-900 text-white px-4 text-sm hover:bg-slate-800"
          >
            Refresh
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
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Username</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-left px-4 py-3 font-medium">Created</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((u) => {
                  const id = u._id || u.id;

                  const name = u.name || "—";
                  const username = u.username || "—";
                  const role = u.role || "user";

                  const created = u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString()
                    : "—";

                  return (
                    <tr key={id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-900">{name}</td>
                      <td className="px-4 py-3 text-slate-700">{username}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2 py-1 text-xs">
                          {role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{created}</td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => onDelete(id)}
                            className="h-9 px-3 rounded-xl bg-red-600 text-white hover:bg-red-500"
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
                      className="px-4 py-8 text-center text-slate-500"
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
    </div>
  );
}
