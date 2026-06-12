import { useEffect, useState } from "react";
import { getTutorial, updateTutorial } from "../utils/api";

export default function Tutorials({ role }) {
  const [youtubeUrl, setYoutubeUrl] = useState("https://www.youtube.com/");
  const [title, setTitle] = useState("Tutorials");
  const [description, setDescription] = useState(
    "If you're not sure how to use a tool, simply click the button below to watch the tutorial video. It will guide you step-by-step so you can start using the tool correctly."
  );
  const [tip, setTip] = useState(
    "If you still face any issue after watching the tutorial, contact our support team and we'll help you."
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(role === "admin");

  // Load tutorial from database
  useEffect(() => {
    (async () => {
      try {
        const res = await getTutorial();
        const t = res.data?.tutorial;
        if (t) {
          setTitle(t.title || "Tutorials");
          setDescription(t.description || "");
          setYoutubeUrl(t.youtubeUrl || "https://www.youtube.com/");
          setTip(t.tip || "");
        }
      } catch (err) {
        console.error("Failed to load tutorial:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Sync role changes
  useEffect(() => {
    setIsAdmin(role === "admin");
  }, [role]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTutorial({ title, description, youtubeUrl, tip });
      alert("✅ Tutorial page updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update tutorial page");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="text-slate-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="w-full max-w-5xl">
        {isAdmin ? (
          /* ADMIN FORM TO EDIT TUTORIAL PAGE */
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Manage Tutorials Page
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Customize the tutorial link and content shown to all subscribed users.
            </p>

            <form onSubmit={handleSave} className="mt-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Page Title
                </label>
                <input
                  type="text"
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  YouTube Tutorial URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 text-sm"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Description
                </label>
                <textarea
                  required
                  rows={4}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 text-sm resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Tip Box Content
                </label>
                <textarea
                  required
                  rows={3}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 text-sm resize-y"
                  value={tip}
                  onChange={(e) => setTip(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition active:scale-95 shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* USER VIEW TUTORIAL PAGE */
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-7 shadow-sm">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900">
                {title}
              </h1>

              <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl font-medium">
                {description}
              </p>

              <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center h-11 w-full sm:w-auto rounded-xl bg-indigo-600 text-white px-5 text-sm font-semibold hover:bg-indigo-500 transition shadow-md shadow-indigo-600/10 active:scale-95"
                >
                  ▶ Watch Tutorial on YouTube
                </a>
              </div>
            </div>

            {tip && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Tip
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-3xl font-medium">
                  {tip}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
