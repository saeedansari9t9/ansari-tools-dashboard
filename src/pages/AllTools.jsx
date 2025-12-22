import { useEffect, useMemo, useState } from "react";
import { createTool, deleteTool, getAllTools, updateTool } from "../utils/api";

export default function AllTools() {
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  // create form
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  // edit state
  const [editing, setEditing] = useState(null); // tool object
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return tools;
    return tools.filter((t) => {
      return (
        (t.name || "").toLowerCase().includes(s) ||
        (t.description || "").toLowerCase().includes(s)
      );
    });
  }, [tools, q]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllTools();
      const list = res.data?.tools ?? res.data ?? [];
      setTools(list);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load tools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Tool name required");
    try {
      const res = await createTool({ name: name.trim(), description: desc.trim() });
      const newTool = res.data?.tool ?? res.data;
      setTools((prev) => [newTool, ...prev]);
      setName("");
      setDesc("");
    } catch (e2) {
      alert(e2?.response?.data?.message || "Create failed");
    }
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this tool?")) return;
    try {
      await deleteTool(id);
      setTools((prev) => prev.filter((t) => (t._id || t.id) !== id));
    } catch (e) {
      alert(e?.response?.data?.message || "Delete failed");
    }
  };

  const openEdit = (tool) => {
    setEditing(tool);
    setEditName(tool.name || "");
    setEditDesc(tool.description || "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    const id = editing._id || editing.id;
    try {
      const res = await updateTool(id, { name: editName.trim(), description: editDesc.trim() });
      const updated = res.data?.tool ?? res.data?.updatedTool ?? res.data;
      setTools((prev) => prev.map((t) => ((t._id || t.id) === id ? updated : t)));
      setEditing(null);
    } catch (e) {
      alert(e?.response?.data?.message || "Update failed");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">All Tools</h1>
          <p className="text-sm text-slate-500">Create, edit and delete tools.</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tools…"
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

      {/* Create */}
      <form onSubmit={onCreate} className="mt-5 grid md:grid-cols-3 gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tool name"
          className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
        />
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Short description (optional)"
          className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
        />
        <button className="h-11 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-500">
          Add Tool
        </button>
      </form>

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
                  <th className="text-left px-4 py-3 font-medium">Description</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const id = t._id || t.id;
                  return (
                    <tr key={id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-900">{t.name || "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{t.description || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(t)}
                            className="h-9 px-3 rounded-xl border border-slate-200 hover:bg-slate-50"
                          >
                            Edit
                          </button>
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
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={3}>
                      No tools found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-900">Edit Tool</div>
                <div className="text-sm text-slate-500">Update tool info</div>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="h-9 px-3 rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Tool name"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="min-h-[110px] w-full rounded-xl border border-slate-200 p-3 text-sm"
                placeholder="Tool description"
              />
              <button
                onClick={saveEdit}
                className="h-11 w-full rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
