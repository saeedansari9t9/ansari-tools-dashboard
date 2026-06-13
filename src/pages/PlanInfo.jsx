import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getMe, getMyTools } from "../utils/api";
import { User, Clock, CheckCircle, AlertTriangle, ExternalLink, Calendar, ShieldCheck, Sparkles, CreditCard } from "lucide-react";

export default function PlanInfo() {
  const [user, setUser] = useState(null);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await getMe();
        setUser(u.data);

        const t = await getMyTools();
        setTools(t.data?.tools || []);
      } catch (err) {
        console.error("Failed to load plan info:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeToolsCount = useMemo(() => {
    return tools.filter(t => new Date(t.expiresAt) > new Date()).length;
  }, [tools]);

  const getDaysRemaining = (expiryDate) => {
    const diffTime = new Date(expiryDate) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">Loading plan information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/15 rounded-full blur-3xl -z-10 animate-pulse duration-5000"></div>

      <div className="max-w-4xl mx-auto space-y-6 relative">
        {/* Title Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Plan Info</h1>
            <p className="text-sm text-slate-500">Review your subscription plan tier, details, and active resources.</p>
          </div>
        </div>

        {/* Profile Card & Plan Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Account Detail Card */}
          <div className="md:col-span-2 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/60 p-6 shadow-[0_10px_35px_rgba(99,102,241,0.03)] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-indigo-600/10">
                  {(user?.name || user?.username || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">{user?.name}</h2>
                  <div className="text-xs text-slate-400 font-medium">@{user?.username}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Status</span>
                  <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/50">
                    <CheckCircle className="w-3 h-3" /> Active Account
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Role</span>
                  <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/50">
                    <ShieldCheck className="w-3 h-3" /> {user?.role === "admin" ? "Administrator" : "Premium Member"}
                  </span>
                </div>
                {user?.createdAt && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Member Since</span>
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(user.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-3xl p-6 shadow-lg shadow-indigo-600/15 flex flex-col justify-between relative overflow-hidden">
            {/* Pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:12px_12px] -z-0"></div>
            
            <div className="relative z-10 space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-100 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 fill-current" /> Active Tier
              </span>
              <h3 className="text-2xl font-black tracking-tight mt-1">All-Access Pass</h3>
            </div>

            <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-end justify-between">
              <div>
                <div className="text-[10px] text-indigo-100 font-semibold uppercase tracking-wider">Subscribed Tools</div>
                <div className="text-3xl font-black leading-none mt-1">{activeToolsCount}</div>
              </div>
              <div className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                Pass Active
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Resources Grid */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-8 shadow-[0_10px_35px_rgba(99,102,241,0.03)] space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Your Active Resources</h3>
            <p className="text-xs text-slate-500 mt-1">Below is a breakdown of all individual premium access tools assigned to your account.</p>
          </div>

          {tools.length === 0 ? (
            <div className="border-2 border-dashed border-slate-100 rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No Assigned Tools</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                You do not have any active subscriptions or assigned tools. Please reach out to your administrator to subscribe.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tools.map((t) => {
                const daysLeft = getDaysRemaining(t.expiresAt);
                const isExpired = daysLeft <= 0;
                
                return (
                  <div
                    key={t.id || t._id}
                    className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200/80 hover:shadow-md hover:shadow-indigo-600/[0.02] transition duration-200"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-12 w-12 rounded-xl border border-slate-200/30 overflow-hidden bg-white shrink-0 shadow-sm flex items-center justify-center p-1">
                        <img
                          src={t.image}
                          alt={t.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{t.name}</h4>
                        
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${isExpired ? "bg-rose-400" : "bg-emerald-400"}`} />
                          <span className="text-[11px] text-slate-400 font-bold block">
                            {isExpired ? (
                              <span className="text-rose-500">Expired</span>
                            ) : (
                              <span>
                                {daysLeft} {daysLeft === 1 ? "day" : "days"} remaining
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/tools/${t.slug}`}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-sm transition-all duration-200"
                      title={`Access ${t.name}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
