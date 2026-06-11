import { useEffect, useMemo, useState } from "react";
import { getMe, getMyTools, getToolCookies } from "../utils/api";

export default function Dashboard() {
  const [q, setQ] = useState("");
  const [me, setMe] = useState(null);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);

  useEffect(() => {
    // 1. Initial immediate check
    if (document.documentElement.dataset.ansariExtensionInstalled === "true") {
      setIsExtensionInstalled(true);
    }

    // 2. Listen for the window postMessage from content script
    const handleMessage = (event) => {
      if (event.data && (event.data.type === "ANSARI_EXTENSION_INSTALLED" || event.data.type === "AI_TOOL_BRIDGE_READY")) {
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
        const u = await getMe();
        setMe(u.data);

        const t = await getMyTools();
        setTools(t.data.tools || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return tools.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));
  }, [q, tools]);

  const handleAccessTool = async (toolUrl, toolName) => {
    try {
      const cleanToolName = toolName.toLowerCase().replace(/\s+/g, '');
      
      console.log(`[Dashboard] Requesting cookies for tool: ${cleanToolName}`);
      const res = await getToolCookies(cleanToolName);
      const cookiesList = res.data?.cookies || [];

      if (cookiesList.length === 0) {
        alert("⚠️ No active session cookies found for this tool in the database. Please ask the Admin to update them on the 'Manage Cookies' page!");
        return;
      }

      // Send postMessage to the old chrome-extension bridge
      window.postMessage(
        {
          type: "AI_TOOL_ACCESS",
          tool: cleanToolName,
          email: "shared-user@ansaritools.com",
          password: "password123",
          url: toolUrl,
          cookies: cookiesList,
        },
        "*"
      );
      
    } catch (err) {
      console.error("Failed to access tool:", err);
      alert(err.response?.data?.message || "Failed to fetch session. Please verify server connection.");
    }
  };

  const getToolSlug = (name) => {
    const map = {
      "canva": "canva",
      "canva pro": "canva",
      "chatgpt": "chatgpt",
      "openai": "chatgpt",
      "midjourney": "midjourney",
      "adobe": "adobe",
      "netflix": "netflix",
      "spotify": "spotify"
    };
    return map[name.toLowerCase()] || name.toLowerCase().replace(/\s+/g, '');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Your active tools are listed below.
        </p>

        <div className="mt-5 rounded-2xl bg-white border border-slate-200 p-4 sm:p-5">
          <div className="text-base sm:text-lg font-semibold text-slate-900">
            Welcome, {me?.username || "User"} 👋
          </div>
          <div className="text-sm text-slate-500 mt-1">
            You can access your subscribed tools anytime.
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="font-semibold text-slate-900">Active Resources</div>

            <input
              className="w-full sm:w-80 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Search tool..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="mt-6 text-slate-500">Loading...</div>
          ) : (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition"
                >
                  <div className="h-36 sm:h-40 bg-slate-100">
                    <img
                      src={t.image}
                      alt={t.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-4">
                    <div className="text-slate-900 font-semibold">{t.name}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Expires {new Date(t.expiresAt).toLocaleDateString()}
                    </div>

                    {isExtensionInstalled ? (
                      <button
                        onClick={() => {
                          handleAccessTool(
                            t.accessUrl,
                            getToolSlug(t.name) ||
                            t.name.toLowerCase().replace(/\s+/g, "")
                          );
                        }}
                        className="mt-4 block w-full text-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 font-semibold cursor-pointer"
                      >
                        Access
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          alert(
                            "⚠️ Chrome Extension is not installed or enabled!\n\nPlease follow these steps to install:\n1. Open chrome://extensions/ in Google Chrome.\n2. Enable 'Developer mode' in the top-right.\n3. Click 'Load unpacked' in the top-left.\n4. Select the directory: C:\\Users\\WEB\\Desktop\\Latu\\ansari-tools-dashboard\\AnsariTools\n5. Once installed, reload this page to access your tools!"
                          );
                        }}
                        className="mt-4 block w-full text-center rounded-xl bg-amber-500 hover:bg-amber-600 text-white py-2.5 font-semibold cursor-pointer"
                      >
                        Install Extension
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="text-slate-500">No tools found.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
