import { useEffect, useState } from "react";
import { getAllTools, updateTool } from "../utils/api";

export default function ManageCookies() {
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState([]);
  const [selectedToolId, setSelectedToolId] = useState("");
  const [cookiesText, setCookiesText] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Load all tools on mount
  const loadTools = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await getAllTools();
      const list = res.data?.tools ?? res.data ?? [];
      setTools(list);
      
      // Auto-select the first tool if available
      if (list.length > 0) {
        setSelectedToolId(list[0]._id || list[0].id);
        setCookiesText(list[0].cookies || "");
      }
    } catch (e) {
      setErrorMsg(e?.response?.data?.message || "Failed to load tools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  // Update cookies textarea when selected tool changes
  const handleToolChange = (e) => {
    const toolId = e.target.value;
    setSelectedToolId(toolId);
    setSuccessMsg("");
    setErrorMsg("");
    
    const tool = tools.find((t) => (t._id || t.id) === toolId);
    if (tool) {
      setCookiesText(tool.cookies || "");
    }
  };

  // Save updated cookies JSON
  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!selectedToolId) {
      setErrorMsg("Please select a tool first");
      return;
    }

    const trimmedCookies = cookiesText.trim();
    
    // Validate JSON structure if cookies are entered
    if (trimmedCookies) {
      try {
        const parsed = JSON.parse(trimmedCookies);
        if (!Array.isArray(parsed)) {
          setErrorMsg("Warning: Cookie data should ideally be a JSON Array [ {...}, {...} ]");
        }
      } catch (err) {
        setErrorMsg("Invalid JSON! Please paste a valid JSON array of cookies.");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await updateTool(selectedToolId, { cookies: trimmedCookies });
      const updatedTool = res.data?.tool ?? res.data?.updatedTool ?? res.data;
      
      // Update tools list local state
      setTools((prev) =>
        prev.map((t) => ((t._id || t.id) === selectedToolId ? updatedTool : t))
      );
      
      setSuccessMsg("✅ Cookies updated successfully for this tool!");
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Failed to save cookies");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Manage Tool Cookies</h1>
          <p className="text-sm text-slate-500 mt-1">
            Select a shared account tool and paste the exported session cookies list to replace the active session.
          </p>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-500">
            Loading tools list...
          </div>
        ) : tools.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-500">
            No tools found. Please create tools first in the "All Tools" tab.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <form onSubmit={handleSave} className="space-y-5">
              {/* Select Tool */}
              <div>
                <label className="block text-sm font-semibold text-slate-700">Select Tool</label>
                <select
                  value={selectedToolId}
                  onChange={handleToolChange}
                  className="mt-1.5 block w-full h-11 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-200 text-sm bg-white cursor-pointer"
                >
                  {tools.map((t) => {
                    const id = t._id || t.id;
                    const hasCookies = t.cookies && t.cookies.trim().length > 0;
                    return (
                      <option key={id} value={id}>
                        {t.name} ({t.slug}) {hasCookies ? "🟢 (Active Cookies)" : "🔴 (No Cookies)"}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Cookies Area */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-semibold text-slate-700">
                    Cookies JSON (Array of Cookie objects)
                  </label>
                  <span className="text-xs text-slate-400 font-mono">
                    Format: [ {"{"} name, value, ... {"}"} ]
                  </span>
                </div>
                <textarea
                  value={cookiesText}
                  onChange={(e) => setCookiesText(e.target.value)}
                  placeholder='Paste exported JSON array of cookies here... e.g.\n[\n  { "name": "session-token", "value": "xyz...", "domain": ".chatgpt.com", "path": "/" }\n]'
                  className="mt-1.5 min-h-[220px] w-full rounded-xl border border-slate-200 p-4 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-200 bg-slate-50 focus:bg-white transition"
                />
              </div>

              {/* Status alerts */}
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl font-medium">
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? "Saving Changes..." : "Inject & Save Cookies"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
