import { useState, useEffect } from "react";
import { getMe, changePassword, updateProfile } from "../utils/api";
import { User, Lock, Shield, Eye, EyeOff } from "lucide-react";

export default function Profile({ role }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile details form states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Form states (Password)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Show/Hide password states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status/Alert states (Password)
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await getMe();
        setUser(res.data);
        setName(res.data?.name || "");
        setUsername(res.data?.username || "");
      } catch (err) {
        console.error("Failed to load user profile:", err);
        setError("Failed to load user profile details. Please try reloading.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (!name.trim() || !username.trim()) {
      setProfileError("Name and username cannot be empty.");
      return;
    }

    try {
      setProfileSaving(true);
      const res = await updateProfile({
        name: name.trim(),
        username: username.toLowerCase().trim()
      });
      setProfileSuccess(res.data?.message || "Profile updated successfully!");
      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
      }
      setUser(res.data?.user || { ...user, name: name.trim(), username: username.toLowerCase().trim() });
      
      // Dispatch event to update sidebar
      window.dispatchEvent(new Event("profile-updated"));
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    try {
      setSaving(true);
      const res = await changePassword({ currentPassword, newPassword });
      setSuccess(res.data?.message || "Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password. Please verify current password.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const avatarLetter = (user?.name || user?.username || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Account Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your profile details and security settings.
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-indigo-500/20 shrink-0">
              {avatarLetter}
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-xl font-bold text-slate-900">{user?.name || "User Name"}</h2>
              <p className="text-sm font-medium text-slate-500">@{user?.username || "username"}</p>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                <Shield className="w-3.5 h-3.5" />
                {role === "admin" || user?.role === "admin" ? "Administrator" : "Standard User"}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Card */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="border-b border-slate-100 pb-5 mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" /> Profile Details
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Update your personal details and account username.
            </p>
          </div>

          {profileError && (
            <div className="mb-5 rounded-2xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-600 font-semibold animate-fade-in">
              {profileError}
            </div>
          )}

          {profileSuccess && (
            <div className="mb-5 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-600 font-semibold animate-fade-in">
              {profileSuccess}
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white placeholder:text-slate-400 text-sm"
                  placeholder="Enter full name"
                />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white placeholder:text-slate-400 text-sm"
                  placeholder="Enter username"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl font-semibold bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-600/15 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {profileSaving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Password Reset Card */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="border-b border-slate-100 pb-5 mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" /> Change Password
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Update your account password to ensure your account remains secure.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-600 font-semibold animate-fade-in">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-600 font-semibold animate-fade-in">
              {success}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-5">
            {/* Current Password */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white placeholder:text-slate-400 text-sm"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* New Password */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white placeholder:text-slate-400 text-sm"
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white placeholder:text-slate-400 text-sm"
                    placeholder="Repeat new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl font-semibold bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-600/15 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? "Saving Changes..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
