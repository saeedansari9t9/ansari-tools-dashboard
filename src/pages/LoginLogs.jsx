import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getUserLogs, getAllUsers } from "../utils/api";
import { History, Search, User, Globe, Copy, Check, X } from "lucide-react";

export default function LoginLogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUserId = searchParams.get("userId") || "";

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(initialUserId);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [copiedIp, setCopiedIp] = useState(null);

  // Load list of users for dropdown filter
  useEffect(() => {
    (async () => {
      try {
        const res = await getAllUsers();
        const list = res.data?.users ?? res.data ?? [];
        setUsers(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Failed to load users for filter dropdown:", err);
      }
    })();
  }, []);

  // Fetch logs based on active selected user filter
  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (selectedUser) {
        params.userId = selectedUser;
      }
      const res = await getUserLogs(params);
      setLogs(res.data?.logs || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedUser]);

  // Sync state if URL query param changes
  useEffect(() => {
    setSelectedUser(initialUserId);
  }, [initialUserId]);

  const handleCopyIp = (ip) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  // Parsing helper to make User-Agent readable
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

  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return logs;

    return logs.filter((log) => {
      const u = log.user || {};
      const name = (u.name || "").toLowerCase();
      const username = (u.username || "").toLowerCase();
      const ip = (log.ip || "").toLowerCase();
      const ua = (log.userAgent || "").toLowerCase();
      const device = parseUA(log.userAgent).toLowerCase();

      return name.includes(q) || username.includes(q) || ip.includes(q) || ua.includes(q) || device.includes(q);
    });
  }, [logs, searchQuery]);

  const handleClearFilters = () => {
    setSelectedUser("");
    setSearchQuery("");
    setSearchParams({});
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600" /> User Login Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track user login session timestamps, IP addresses, and devices.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 px-4 text-sm hover:bg-slate-200 transition-colors cursor-pointer font-medium"
        >
          Refresh Logs
        </button>
      </div>

      {/* Filters Bar */}
      <div className="mt-5 flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, username, IP or device..."
            className="w-full h-11 rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-slate-50/30 transition-all text-slate-800"
          />
        </div>

        {/* User filter dropdown */}
        <div className="relative w-full md:w-72">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <select
            value={selectedUser}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedUser(val);
              if (val) {
                setSearchParams({ userId: val });
              } else {
                setSearchParams({});
              }
            }}
            className="w-full h-11 rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-slate-50/30 transition-all text-slate-800 appearance-none cursor-pointer"
          >
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u._id || u.id} value={u._id || u.id}>
                {u.name} (@{u.username})
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
            ▼
          </div>
        </div>

        {/* Clear Filters button */}
        {(selectedUser || searchQuery) && (
          <button
            onClick={handleClearFilters}
            className="w-full md:w-auto h-11 px-4 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all text-sm font-semibold flex items-center justify-center gap-1 cursor-pointer"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="text-sm font-medium text-slate-500">Loading session logs...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-600 font-semibold">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/40 text-slate-400 text-[11px] uppercase tracking-wider font-bold text-left">
                  <th className="px-6 py-4 font-bold">User</th>
                  <th className="px-6 py-4 font-bold">IP Address</th>
                  <th className="px-6 py-4 font-bold">Time & Date</th>
                  <th className="px-6 py-4 font-bold">Device & Browser</th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map((log) => {
                  const u = log.user || {};
                  const name = u.name || "Deleted User";
                  const username = u.username || "unknown";
                  const role = u.role || "user";
                  const avatar = name.charAt(0).toUpperCase();

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
                    <tr
                      key={log._id || log.id}
                      className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors"
                    >
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm shadow-sm shrink-0">
                            {avatar}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{name}</div>
                            <div className="text-[12px] text-slate-400">@{username}</div>
                          </div>
                        </div>
                      </td>

                      {/* IP Address */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-xs select-all">
                            {displayIp}
                          </span>
                          <button
                            onClick={() => handleCopyIp(copyIp)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-95 cursor-pointer"
                            title="Copy IP Address"
                          >
                            {copiedIp === copyIp ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 text-[13px]">{dateStr}</div>
                        {timeStr && (
                          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{timeStr}</div>
                        )}
                      </td>

                      {/* Browser & OS */}
                      <td className="px-6 py-4">
                        <div className="text-slate-700 font-medium text-[13px]">
                          {parseUA(log.userAgent)}
                        </div>
                        <div
                          className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5"
                          title={log.userAgent}
                        >
                          {log.userAgent}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredLogs.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-12 text-center text-slate-500 font-medium"
                      colSpan={4}
                    >
                      No login logs found.
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
