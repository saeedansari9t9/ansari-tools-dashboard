import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getMyTools, getToolCookies, getTutorial, API } from "../utils/api";
import { ArrowLeft, CheckCircle, Download, AlertTriangle, Play, HelpCircle } from "lucide-react";

export default function ToolDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);
  const [fetchingCookies, setFetchingCookies] = useState(false);
  const [extensionFileUrl, setExtensionFileUrl] = useState("");

  useEffect(() => {
    // 1. Initial immediate check
    if (document.documentElement.dataset.ansariExtensionInstalled === "true") {
      setIsExtensionInstalled(true);
    }

    // 2. Listen for the window postMessage from content script
    const handleMessage = (event) => {
      if (
        event.data &&
        (event.data.type === "ANSARI_EXTENSION_INSTALLED" ||
          event.data.type === "AI_TOOL_BRIDGE_READY")
      ) {
        setIsExtensionInstalled(true);
      }
    };
    window.addEventListener("message", handleMessage);

    // 3. Send a ping to the bridge in case it is already loaded and waiting
    window.postMessage({ type: "PING_AI_TOOL_BRIDGE" }, "*");

    // 4. Fallback check after 1.2s to ensure the content script executed
    const timer = setTimeout(() => {
      if (document.documentElement.dataset.ansariExtensionInstalled === "true") {
        setIsExtensionInstalled(true);
      } else {
        window.postMessage({ type: "PING_AI_TOOL_BRIDGE" }, "*");
      }
    }, 1200);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyTools();
        const myTools = res.data.tools || [];
        const found = myTools.find((t) => t.slug === slug);
        setTool(found || null);
      } catch (err) {
        console.error("Failed to load tool details:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getTutorial();
        if (res.data?.tutorial?.extensionFileUrl) {
          setExtensionFileUrl(res.data.tutorial.extensionFileUrl);
        }
      } catch (err) {
        console.error("Failed to load extension settings:", err);
      }
    })();
  }, []);

  const handleAccessTool = async () => {
    if (!tool) return;
    try {
      setFetchingCookies(true);
      const cleanToolName = tool.slug.toLowerCase().replace(/\s+/g, "");
      console.log(`[ToolDetails] Requesting cookies for tool: ${cleanToolName}`);
      const res = await getToolCookies(cleanToolName);
      const cookiesList = res.data?.cookies || [];

      if (cookiesList.length === 0) {
        alert(
          "⚠️ No active session cookies found for this tool in the database. Please ask the Admin to update them on the 'Manage Cookies' page!"
        );
        return;
      }

      // Send postMessage to the chrome-extension bridge
      window.postMessage(
        {
          type: "AI_TOOL_ACCESS",
          tool: cleanToolName,
          email: "shared-user@ansaritools.com",
          password: "password123",
          url: tool.accessUrl,
          cookies: cookiesList,
        },
        "*"
      );
    } catch (err) {
      console.error("Failed to access tool:", err);
      alert(
        err.response?.data?.message ||
          "Failed to fetch session. Please verify server connection."
      );
    } finally {
      setFetchingCookies(false);
    }
  };

  const handleDownloadExtension = () => {
    if (!extensionFileUrl) {
      alert("⚠️ No extension file has been uploaded by the Admin yet. Please ask the Admin to upload it!");
      return;
    }

    const apiBase = API.defaults.baseURL;
    const hostBase = apiBase.replace(/\/api$/, "");
    const downloadUrl = extensionFileUrl.startsWith("http")
      ? extensionFileUrl
      : `${hostBase}${extensionFileUrl}`;

    window.open(downloadUrl, "_blank");

    // Scroll to instructions
    const el = document.getElementById("install-instructions");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">Loading tool details...</p>
        </div>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 text-center space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Denied or Not Subscribed</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            You don't have an active subscription for this tool or it has expired. Please contact administration to assign this tool.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 transition duration-200"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition duration-150"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Main Tool Access Card */}
        <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
          <div className="grid grid-cols-1 md:grid-cols-5">
            {/* Tool Image */}
            <div className="md:col-span-2 h-48 md:h-auto bg-slate-100 relative">
              <img
                src={tool.image}
                alt={tool.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Tool Meta and Action */}
            <div className="md:col-span-3 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                  <CheckCircle className="w-3.5 h-3.5" /> Subscribed
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{tool.name}</h1>
                <p className="text-sm text-slate-500">
                  Subscription Expiry Date:{" "}
                  <span className="font-semibold text-slate-700">
                    {new Date(tool.expiresAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </p>
              </div>

              {/* Action Button */}
              <div>
                {isExtensionInstalled ? (
                  <button
                    onClick={handleAccessTool}
                    disabled={fetchingCookies}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-60 text-white font-semibold py-3.5 px-8 shadow-lg shadow-indigo-600/15 transition-all duration-200 cursor-pointer text-[15px]"
                  >
                    <Play className="w-4.5 h-4.5 fill-current" />
                    {fetchingCookies ? "Launching..." : `Access ${tool.name}`}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={handleDownloadExtension}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-semibold py-3.5 px-8 shadow-lg shadow-amber-500/15 transition-all duration-200 cursor-pointer text-[15px]"
                    >
                      <Download className="w-4.5 h-4.5" />
                      Install Extension to Access
                    </button>
                    <p className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Chrome extension is required to auto-login to this premium account.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions Block */}
        {!isExtensionInstalled && (
          <div
            id="install-instructions"
            className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.02)] space-y-6 scroll-mt-6"
          >
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                How to Install the Ansari Tools Extension
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Follow this simple step-by-step guide to configure the required Chrome Extension.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Step 1 */}
              <div className="flex gap-4 items-start p-4.5 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition duration-200">
                <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100/30 flex items-center justify-center font-bold text-indigo-600 text-sm shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-slate-950 text-sm">Locate Extension Folder</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Find the <strong>AnsariTools</strong> folder on your computer (typically inside the main project directory).
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 items-start p-4.5 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition duration-200">
                <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100/30 flex items-center justify-center font-bold text-indigo-600 text-sm shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-slate-950 text-sm">Open Extension Settings</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    In your Google Chrome browser, open a new tab and navigate to{" "}
                    <code className="bg-slate-100 text-rose-600 px-1.5 py-0.5 rounded text-[11px] font-mono select-all font-semibold">
                      chrome://extensions/
                    </code>
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 items-start p-4.5 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition duration-200">
                <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100/30 flex items-center justify-center font-bold text-indigo-600 text-sm shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-slate-950 text-sm">Enable Developer Mode</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Look at the top right of the extensions page and turn on the toggle switch for{" "}
                    <strong>Developer Mode</strong>.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4 items-start p-4.5 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition duration-200">
                <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100/30 flex items-center justify-center font-bold text-indigo-600 text-sm shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-slate-950 text-sm">Load Unpacked Extension</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Click the <strong>Load unpacked</strong> button on the top-left, and choose the{" "}
                    <strong>AnsariTools</strong> folder from Step 1.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 5 Banner */}
            <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4.5 flex gap-4.5 items-start">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
                5
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-indigo-950 text-sm">Refresh & Use!</h4>
                <p className="text-xs text-indigo-700/90 leading-relaxed">
                  Once installed, return to this tab and refresh the page. The "Access" button will automatically activate, letting you use the tool without any passwords!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
