import { useEffect, useState } from "react";
import { getAllTools, updateTool, uploadExtension, getTutorial, updateTutorial } from "../utils/api";
import { toast } from "react-hot-toast";
import { Search, DatabaseBackup, FileJson, KeyRound, UploadCloud, Link as LinkIcon } from "lucide-react";

function ToolIcon({ tool, isSelected }) {
  const [error, setError] = useState(false);
  
  if (tool.image && tool.image.trim().length > 0 && !error) {
    return (
      <img
        src={tool.image}
        alt={tool.name}
        className="w-8 h-8 rounded-lg object-contain p-1 border border-slate-200 bg-white shrink-0"
        onError={() => setError(true)}
      />
    );
  }
  
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase shrink-0 transition ${
      isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
    }`}>
      {(tool.name || "U").charAt(0)}
    </div>
  );
}

let cachedTools = null;
let cachedExtensionUrl = null;

export default function ManageCookies() {
  const [loading, setLoading] = useState(!cachedTools);
  const [tools, setTools] = useState(cachedTools || []);
  const [selectedToolId, setSelectedToolId] = useState("");
  const [cookiesText, setCookiesText] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Extension url states
  const [extensionFileUrl, setExtensionFileUrl] = useState(cachedExtensionUrl || "");
  const [savingLink, setSavingLink] = useState(false);

  // Extension upload states
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Load all tools and current extension URL on mount
  const loadTools = async () => {
    if (!cachedTools) setLoading(true);
    try {
      const res = await getAllTools();
      const list = res.data?.tools ?? res.data ?? [];
      cachedTools = list;
      setTools(list);

      // Fetch extension direct link
      const tutRes = await getTutorial();
      const t = tutRes.data?.tutorial;
      if (t) {
        cachedExtensionUrl = t.extensionFileUrl || "";
        setExtensionFileUrl(cachedExtensionUrl);
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load tools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cachedTools && cachedTools.length > 0) {
      setSelectedToolId(cachedTools[0]._id || cachedTools[0].id);
      setCookiesText(cachedTools[0].cookies || "");
    }
    loadTools();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSaveLink = async (e) => {
    e.preventDefault();
    setSavingLink(true);
    try {
      await updateTutorial({ extensionFileUrl });
      toast.success("Extension download link updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update link");
    } finally {
      setSavingLink(false);
    }
  };

  const handleUploadExtension = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("extensionFile", file);

    setUploading(true);
    try {
      const res = await uploadExtension(formData);
      toast.success("Extension file uploaded and updated successfully!");
      if (res.data?.fileUrl) {
        setExtensionFileUrl(res.data.fileUrl);
      }
      setFile(null);
      document.getElementById("extension-file-input").value = "";
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to upload extension file.");
    } finally {
      setUploading(false);
    }
  };

  // Update cookies textarea when selected tool changes
  const handleToolCardSelect = (tool) => {
    const toolId = tool._id || tool.id;
    setSelectedToolId(toolId);
    setCookiesText(tool.cookies || "");
  };

  // Save updated cookies JSON
  const handleSave = async (e) => {
    e.preventDefault();

    if (!selectedToolId) {
      toast.error("Please select a tool first");
      return;
    }

    const trimmedCookies = cookiesText.trim();
    
    // Validate JSON structure if cookies are entered
    if (trimmedCookies) {
      try {
        const parsed = JSON.parse(trimmedCookies);
        if (!Array.isArray(parsed)) {
          toast.error("Warning: Cookie data should ideally be a JSON Array [ {...}, {...} ]");
        }
      } catch (err) {
        toast.error("Invalid JSON! Please paste a valid JSON array of cookies.");
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
      
      toast.success("Cookies updated successfully for this tool!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save cookies");
    } finally {
      setSaving(false);
    }
  };

  // Filter tools based on search input
  const filteredTools = tools.filter((t) => {
    const query = searchQuery.trim().toLowerCase();
    return (
      (t.name || "").toLowerCase().includes(query) ||
      (t.slug || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-slate-50">
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Manage Tool Cookies</h1>
          <p className="text-sm text-slate-500 mt-1">
            Select a shared account tool and paste the exported session cookies list to replace the active session.
          </p>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 text-slate-500 text-sm font-medium animate-pulse">
            Loading tools list...
          </div>
        ) : tools.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 text-slate-500 text-sm font-medium">
            No tools found. Please create tools first in the "All Tools" tab.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Select Tool Area */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <label className="text-sm font-bold text-slate-700 tracking-wide block">Select Tool</label>
                  
                  {/* Tool Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search tools..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 w-full sm:w-56 pl-9 pr-3 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-200 transition bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Tool Cards Selection Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-52 overflow-y-auto p-1 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  {filteredTools.length > 0 ? (
                    filteredTools.map((t) => {
                      const id = t._id || t.id;
                      const isSelected = selectedToolId === id;
                      const hasCookies = t.cookies && t.cookies.trim().length > 0;
                      return (
                        <div
                          key={id}
                          onClick={() => handleToolCardSelect(t)}
                          className={`cursor-pointer border-2 rounded-2xl py-2.5 px-3 flex items-center justify-between transition-all duration-200 select-none ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/40 shadow-sm shadow-indigo-600/5"
                              : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/30"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Tool Icon / Logo */}
                            <ToolIcon tool={t} isSelected={isSelected} />
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-800 text-xs sm:text-sm leading-tight">{t.name}</div>
                            </div>
                          </div>
                          
                          {/* Status Badge */}
                          <div className="shrink-0">
                            {hasCookies ? (
                              <span className="text-[9px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-md">
                                Active
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold tracking-wide uppercase bg-slate-100 text-slate-400 border border-slate-200/50 px-2 py-0.5 rounded-md">
                                Offline
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-8 text-center text-xs text-slate-400 font-medium">
                      No matching tools found
                    </div>
                  )}
                </div>
              </div>

              {/* Cookies Area (Code Editor Mockup) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-700 tracking-wide block">
                    Cookies JSON
                  </label>
                  <span className="text-xs text-slate-400 font-medium">
                    Format: JSON Array
                  </span>
                </div>

                <div className="border border-slate-800 bg-slate-950 rounded-2xl overflow-hidden shadow-md flex flex-col">
                  {/* Editor Header Tab */}
                  <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between select-none">
                    <div className="flex items-center gap-2">
                      <FileJson className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-mono font-bold text-slate-300">cookies.json</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCookiesText("");
                          toast.success("Editor cleared!");
                        }}
                        className="text-[10px] bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50 hover:bg-slate-700 px-2.5 py-0.5 rounded font-bold uppercase transition cursor-pointer"
                      >
                        Clear
                      </button>
                      <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        JSON UTF-8
                      </span>
                    </div>
                  </div>

                  {/* Editor Input Area */}
                  <div className="flex font-mono text-xs h-40 overflow-y-auto bg-slate-950">
                    {/* Line Numbers Gutter */}
                    <div className="bg-slate-900/30 text-slate-500/50 px-3.5 py-4 border-r border-slate-900 select-none text-right font-semibold shrink-0" style={{ lineHeight: "20px" }}>
                      {Array.from({ length: Math.max(10, cookiesText.split("\n").length) }).map((_, i) => (
                        <div key={i} className="h-5">{i + 1}</div>
                      ))}
                    </div>
                    
                    {/* Textarea */}
                    <textarea
                      value={cookiesText}
                      onChange={(e) => setCookiesText(e.target.value)}
                      placeholder={`[\n  {\n    "name": "session-token",\n    "value": "xyz...",\n    "domain": ".canva.com",\n    "path": "/"\n  }\n]`}
                      className="w-full bg-transparent text-slate-100 p-4 border-0 outline-none resize-none font-semibold placeholder:text-slate-700 overflow-hidden"
                      style={{ lineHeight: "20px", height: `${Math.max(150, cookiesText.split("\n").length * 20 + 32)}px` }}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold text-sm transition disabled:opacity-60 flex items-center justify-center gap-2.5 cursor-pointer shadow-md shadow-indigo-600/10"
              >
                <KeyRound className="w-4 h-4" />
                {saving ? "Saving Cookies..." : "Save Session Cookies"}
              </button>
            </form>
          </div>
        )}

        {/* Manage Extension Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Manage Extension File</h2>
            <p className="text-sm text-slate-500 mt-1">
              Provide a Google Drive / Dropbox link, or upload the ZIP file directly for the user extension download button.
            </p>
          </div>

          {/* Option A: Link Input */}
          <form onSubmit={handleSaveLink} className="space-y-4 pt-4 border-t border-slate-100">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Extension Download URL (Google Drive / Direct Link)
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={extensionFileUrl}
                  onChange={(e) => setExtensionFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... or direct zip link"
                  className="w-full h-11 pl-11 pr-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 text-sm bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingLink}
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-indigo-600/10"
            >
              Save Download URL
            </button>
          </form>

          {/* Option B: Direct File Upload */}
          <form onSubmit={handleUploadExtension} className="space-y-4 pt-5 border-t border-slate-100">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Or Upload New Zip File (Cloudinary)
              </label>
              <div className="relative">
                <input
                  id="extension-file-input"
                  type="file"
                  onChange={handleFileChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm transition disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              {uploading ? "Uploading ZIP File..." : "Upload ZIP File"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
