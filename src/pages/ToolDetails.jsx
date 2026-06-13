import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getMyTools, getToolCookies, getTutorial, API } from "../utils/api";
import { ArrowLeft, CheckCircle, Download, AlertTriangle, Play, HelpCircle, ShieldCheck, Cpu, Database, Clock, Key } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl -z-10 animate-pulse duration-5000"></div>

      <div className="max-w-4xl mx-auto space-y-6 relative">
        {/* Back Link */}
        <Link
          to="/dashboard"
          className="group inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200/80 px-4.5 py-2 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition duration-200"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> Back to Dashboard
        </Link>

        {/* Main Tool Access Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/60 overflow-hidden shadow-[0_10px_35px_rgba(99,102,241,0.04)] hover:shadow-[0_15px_45px_rgba(99,102,241,0.06)] transition-all duration-300">
          <div className="grid grid-cols-1 md:grid-cols-5">
            {/* Tool Image */}
            <div className="md:col-span-2 p-8 flex items-center justify-center bg-gradient-to-br from-indigo-50/40 via-slate-50 to-purple-50/20 relative border-b md:border-b-0 md:border-r border-slate-100">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:14px_24px]"></div>
              
              <div className="relative group/logo">
                <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-15 blur-xl group-hover/logo:opacity-30 transition-opacity duration-300"></div>
                
                <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full border-2 border-white shadow-[0_8px_30px_rgba(0,0,0,0.05)] overflow-hidden bg-white hover:scale-105 transition-all duration-300 ease-out flex items-center justify-center">
                  <img
                    src={tool.image}
                    alt={tool.name}
                    className="w-full h-full object-cover p-3"
                  />
                </div>
              </div>
            </div>

            {/* Tool Meta and Action */}
            <div className="md:col-span-3 p-8 sm:p-10 flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/50 px-3.5 py-1.5 text-[11px] font-bold text-emerald-600 shadow-[0_2px_10px_rgba(16,185,129,0.03)]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Subscribed
                  </div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5" /> Secure Protocol
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-none bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text">
                  {tool.name}
                </h1>
                
                <p className="text-sm text-slate-500 leading-relaxed">
                  {tool.description || "Access premium features of this tool instantly through secure cookie-injection protocol."}
                </p>

                {/* Expiry Details */}
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-2">
                  <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 shadow-sm">
                    <Clock className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Valid Until</div>
                    <div className="text-sm font-bold text-slate-700">
                      {new Date(tool.expiresAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                {isExtensionInstalled ? (
                  <button
                    onClick={handleAccessTool}
                    disabled={fetchingCookies}
                    className="w-full sm:w-auto relative group inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.99] disabled:opacity-60 text-white font-bold py-4 px-10 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all duration-300 cursor-pointer text-[15px]"
                  >
                    <Play className="w-4.5 h-4.5 fill-current" />
                    {fetchingCookies ? "Launching Session..." : `Launch ${tool.name}`}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={handleDownloadExtension}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.99] text-white font-bold py-4 px-10 shadow-lg shadow-amber-500/20 transition-all duration-200 cursor-pointer text-[15px]"
                    >
                      <Download className="w-4.5 h-4.5" />
                      Install Extension to Access
                    </button>
                    <p className="text-xs text-amber-600 font-semibold flex items-center gap-2 bg-amber-50/50 border border-amber-100 rounded-xl p-3 max-w-md">
                      <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-amber-500" />
                      The Chrome extension is required to handle automated secure session cookie injection.
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
            className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-[0_4px_25px_rgba(99,102,241,0.03)] space-y-8 scroll-mt-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl -z-10"></div>
            
            <div className="border-b border-slate-100 pb-5">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                <HelpCircle className="w-6 h-6 text-indigo-600" />
                Ansari Tools Extension Setup Guide
              </h3>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                Follow this simple step-by-step setup to enable automatic one-click premium logins on your Chrome browser.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Step 1 */}
              <div className="group/step flex gap-5 items-start p-5 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-slate-200/80 hover:shadow-md hover:shadow-indigo-600/[0.02] transition duration-200">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center font-extrabold text-indigo-600 text-sm shrink-0 shadow-sm group-hover/step:bg-indigo-600 group-hover/step:text-white group-hover/step:border-indigo-600 transition duration-200">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Locate Extension Folder</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                    Locate the <strong>AnsariTools</strong> folder on your machine (usually inside the main dashboard directory).
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group/step flex gap-5 items-start p-5 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-slate-200/80 hover:shadow-md hover:shadow-indigo-600/[0.02] transition duration-200">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center font-extrabold text-indigo-600 text-sm shrink-0 shadow-sm group-hover/step:bg-indigo-600 group-hover/step:text-white group-hover/step:border-indigo-600 transition duration-200">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Open Extension Settings</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                    Open a new Google Chrome tab and navigate to:{" "}
                    <code className="bg-slate-100 text-rose-600 px-2 py-0.5 rounded text-[11px] font-mono select-all font-semibold border border-slate-200/40 mt-1 block w-max">
                      chrome://extensions/
                    </code>
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="group/step flex gap-5 items-start p-5 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-slate-200/80 hover:shadow-md hover:shadow-indigo-600/[0.02] transition duration-200">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center font-extrabold text-indigo-600 text-sm shrink-0 shadow-sm group-hover/step:bg-indigo-600 group-hover/step:text-white group-hover/step:border-indigo-600 transition duration-200">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Enable Developer Mode</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                    Toggle the <strong>Developer Mode</strong> switch at the top-right corner of the Extensions page.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="group/step flex gap-5 items-start p-5 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-slate-200/80 hover:shadow-md hover:shadow-indigo-600/[0.02] transition duration-200">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center font-extrabold text-indigo-600 text-sm shrink-0 shadow-sm group-hover/step:bg-indigo-600 group-hover/step:text-white group-hover/step:border-indigo-600 transition duration-200">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Load Unpacked Extension</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                    Click <strong>Load unpacked</strong> on the top-left, and select the <strong>AnsariTools</strong> folder.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 5 Banner */}
            <div className="rounded-2xl bg-indigo-50/50 border border-indigo-100 p-5 flex gap-4.5 items-start">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm shadow-indigo-600/10">
                5
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-indigo-950 text-sm">Refresh & Go!</h4>
                <p className="text-xs text-indigo-700/90 leading-relaxed">
                  Once installed, return to this page and refresh. The system will auto-detect the bridge and launch the tool with secure, passwordless authentication!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
