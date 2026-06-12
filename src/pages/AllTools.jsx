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
  const [slug, setSlug] = useState("");
  const [accessUrl, setAccessUrl] = useState("");
  const [image, setImage] = useState("");

  // edit state
  const [editing, setEditing] = useState(null); // tool object
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAccessUrl, setEditAccessUrl] = useState("");
  const [editImage, setEditImage] = useState("");

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
      const res = await createTool({
        name: name.trim(),
        description: desc.trim(),
        slug: slug.trim() || undefined,
        accessUrl: accessUrl.trim(),
        image: image.trim(),
      });
      const newTool = res.data?.tool ?? res.data;
      setTools((prev) => [newTool, ...prev]);
      setName("");
      setDesc("");
      setSlug("");
      setAccessUrl("");
      setImage("");
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
    setEditAccessUrl(tool.accessUrl || "");
    setEditImage(tool.image || "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    const id = editing._id || editing.id;
    try {
      const res = await updateTool(id, {
        name: editName.trim(),
        description: editDesc.trim(),
        accessUrl: editAccessUrl.trim(),
        image: editImage.trim(),
      });
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
            className="h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 px-4 text-sm hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Create */}
      <form onSubmit={onCreate} className="mt-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 max-w-2xl">
        <h2 className="text-base font-semibold text-slate-900">Add New Tool</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 font-medium">Tool Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ChatGPT"
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium">Slug (Optional, auto-generated)</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. chatgpt"
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium">Access URL</label>
            <input
              value={accessUrl}
              onChange={(e) => setAccessUrl(e.target.value)}
              placeholder="e.g. https://chatgpt.com/"
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium">Image URL</label>
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="e.g. https://example.com/logo.png"
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-500 font-medium">Short Description</label>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Shared access to ChatGPT Plus"
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>
        <button className="h-11 w-full rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-700 font-semibold shadow-md shadow-indigo-600/10 active:scale-[0.99] transition cursor-pointer">
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
            <table className="min-w-[900px] w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                  <th className="text-left px-6 py-4.5 font-bold">Name</th>
                  <th className="text-left px-6 py-4.5 font-bold">Description</th>
                  <th className="text-right px-6 py-4.5 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const id = t._id || t.id;
                  return (
                    <tr key={id} className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 text-[14px]">
                        {t.name || "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-[13px] font-medium max-w-sm truncate" title={t.description}>
                        {t.description || "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(t)}
                            className="h-8 px-4 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100/80 border border-slate-200/50 font-semibold text-xs transition active:scale-95 cursor-pointer"
                          >
                            Edit
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
                    <td className="px-6 py-8 text-center text-slate-500 font-medium" colSpan={3}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 border border-slate-200 my-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-900">Edit Tool</div>
                <div className="text-sm text-slate-500">Update tool info & session cookies</div>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="h-9 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-slate-500 font-medium">Tool Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  placeholder="Tool name"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Access URL</label>
                <input
                  value={editAccessUrl}
                  onChange={(e) => setEditAccessUrl(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  placeholder="Access URL"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Image URL</label>
                <input
                  value={editImage}
                  onChange={(e) => setEditImage(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  placeholder="Image URL"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="mt-1 min-h-[80px] w-full rounded-xl border border-slate-200 p-3 text-sm"
                  placeholder="Tool description"
                />
              </div>
              <button
                onClick={saveEdit}
                className="h-11 w-full rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-700 font-semibold shadow-md shadow-indigo-600/10 active:scale-[0.99] transition cursor-pointer"
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
