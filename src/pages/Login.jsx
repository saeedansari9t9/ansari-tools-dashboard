import { useState } from "react";
import { loginUser } from "../utils/api";
import { useNavigate, Link } from "react-router-dom";

// ✅ Logo path
import logo from "../assets/images/logo.png";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();

    if (!username || !password) {
      alert("Please enter username and password");
      return;
    }

    try {
      setLoading(true);
      const res = await loginUser({ username, password });
      localStorage.setItem("token", res.data.token);
      nav("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#070312] text-white">
      {/* Background gradients */}
      <div className="absolute inset-0">
        <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-purple-700/30 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute bottom-26 left-1/3 h-[520px] w-[520px] rounded-full bg-indigo-500/20 blur-3xl" />
        {/* Subtle grid */}
        {/* <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:48px_48px]" /> */}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-6 sm:py-10">
        {/* Single centered card */}
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-[0_25px_80px_-30px_rgba(168,85,247,0.45)]">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-center p-2">
              <img
                src={logo}
                alt="Ansari Tools Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight">
              Ansari Tools
            </h1>
            <p className="text-white/70 text-sm mt-1">Dashboard Login</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="text-sm text-white/70">Username</label>
              <div className="mt-2">
                <input
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/25 placeholder:text-white/35"
                  placeholder="e.g. ansari123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-white/70">Password</label>
              <div className="mt-2 relative">
                <input
                  type={showPass ? "text" : "password"}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 pr-24 outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/25 placeholder:text-white/35"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-xs border border-white/10 bg-white/5 hover:bg-white/10 text-white/80"
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl py-3 font-semibold bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_12px_40px_-18px_rgba(236,72,153,0.75)]"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {/* Signup + secure note */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-white/60">
                Don&apos;t have an account?{" "}
                <Link
                  to="/signup"
                  className="text-purple-300 hover:text-purple-200 font-semibold"
                >
                  Sign up
                </Link>
              </p>
              <span className="text-xs text-white/45">🔒 Secure</span>
            </div>
          </form>

          <div className="mt-8 border-t border-white/10 pt-6 text-xs text-white/50 text-center">
            By continuing, you agree to our terms and privacy policy.
          </div>
        </div>
      </div>
    </div>
  );
}
