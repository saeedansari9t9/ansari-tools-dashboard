import { useState } from "react";
import { loginUser } from "../utils/api";
import { useNavigate, Link } from "react-router-dom";
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
      localStorage.setItem("role", res.data.user.role); //Temporary
      nav("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-tr from-slate-50 via-white to-indigo-50/50 text-slate-800 flex items-center justify-center px-4 py-8 select-none">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-100/40 blur-3xl opacity-70 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-sky-100/40 blur-3xl opacity-70 animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-violet-50/20 blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 w-[100%] max-w-md transform transition-all duration-500 ease-out hover:scale-[1.01] animate-fade-in-up">
        {/* Single centered card */}
        <div className="rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-xl p-6 sm:p-10 shadow-[0_20px_50px_rgba(15,23,42,0.06)] hover:shadow-[0_24px_60px_rgba(15,23,42,0.1)] transition-all duration-300">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <img
              src={logo}
              alt="Ansari Tools Logo"
              className="h-16 w-16 object-contain hover:rotate-3 transition-transform duration-300"
            />

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              Ansari Tools
            </h1>
            <p className="text-slate-500 text-sm mt-1.5 font-medium">Dashboard Login</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Username</label>
              <div className="relative">
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white placeholder:text-slate-400 text-sm"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-20 text-slate-900 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white placeholder:text-slate-400 text-sm"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPass((s) => !s);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl px-3 py-1.5 text-xs font-medium border border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-600 transition-all active:scale-95 cursor-pointer"
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl py-3.5 font-semibold bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-600/10 transition-all duration-200 flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Logging in...</span>
                </>
              ) : (
                "Login to Dashboard"
              )}
            </button>

            {/* Signup + secure note */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500">
                Don&apos;t have an account?{" "}
                <Link
                  to="/signup"
                  className="text-indigo-600 hover:text-indigo-500 font-semibold transition-colors"
                >
                  Sign up
                </Link>
              </p>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure Connection
              </span>
            </div>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-6 text-xs text-slate-400 text-center font-medium">
            By continuing, you agree to our terms and privacy policy.
          </div>
        </div>
      </div>
    </div>
  );
}
