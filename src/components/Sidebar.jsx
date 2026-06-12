import { NavLink, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Video,
  Users,
  Wrench,
  Cookie,
  Link as LinkIcon,
  CreditCard,
  User,
  Lock,
  LogOut
} from "lucide-react";
import logo from "../assets/images/logo.png";
import { logoutAll } from "../utils/logout";
import { getMe } from "../utils/api";

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
    isActive
      ? "bg-indigo-50 text-indigo-600 font-semibold"
      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
  }`;

export default function Sidebar({ isOpen, onClose, role = "user" }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMe();
        setUser(res.data);
      } catch (err) {
        console.error("Failed to load user in sidebar:", err);
      }
    })();
  }, []);

  const handleLogout = async () => {
    await logoutAll();
    window.location.href = "https://dash.ansaritools.com/login";
  };

  const content = (
    <div className="w-72 h-full bg-white text-slate-800 border-r border-slate-200/60 flex flex-col">
      {/* Brand */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-100">
        <img
          src={logo}
          alt="Ansari Tools"
          className="h-10 w-10 object-contain"
        />
        <div>
          <div className="font-semibold leading-tight text-slate-900">AnsariTools</div>
          <div className="text-xs text-slate-500 font-medium">
            {role === "admin" ? "Admin Dashboard" : "User Dashboard"}
          </div>
        </div>

        {/* Mobile close */}
        <button
          onClick={onClose}
          className="ml-auto md:hidden text-slate-500 hover:text-slate-800 rounded-lg px-2 py-1 cursor-pointer"
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      {/* Nav */}
      <nav className="px-4 mt-2 space-y-2">
        {/* ✅ COMMON (User + Admin) */}
        <NavLink to="/dashboard" className={navLinkClass} onClick={onClose}>
          <LayoutDashboard className="w-5 h-5 opacity-80" />
          Dashboard
        </NavLink>

        <NavLink to="/tutorials" className={navLinkClass} onClick={onClose}>
          <Video className="w-5 h-5 opacity-80" />
          Tutorials
        </NavLink>

        {/* ✅ ADMIN ONLY */}
        {role === "admin" && (
          <>
            <div className="pt-3 pb-1 px-2 text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Admin
            </div>

            <NavLink to="/admin/users" className={navLinkClass} onClick={onClose}>
              <Users className="w-5 h-5 opacity-80" />
              All Users
            </NavLink>

            <NavLink to="/admin/tools" className={navLinkClass} onClick={onClose}>
              <Wrench className="w-5 h-5 opacity-80" />
              All Tools
            </NavLink>

            <NavLink
              to="/admin/manage-cookies"
              className={navLinkClass}
              onClick={onClose}
            >
              <Cookie className="w-5 h-5 opacity-80" />
              Manage Cookies
            </NavLink>

            <NavLink
              to="/admin/assign-tool"
              className={navLinkClass}
              onClick={onClose}
            >
              <LinkIcon className="w-5 h-5 opacity-80" />
              Assign Tools
            </NavLink>
          </>
        )}

        {/* ✅ ACCOUNT SECTION DIRECTLY IN SIDEBAR */}
        <div className="pt-3 pb-1 px-2 text-xs uppercase tracking-wider text-slate-400 font-semibold">
          Account
        </div>

        {role !== "admin" && (
          <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer">
            <CreditCard className="w-5 h-5 opacity-80" />
            Plan Info
          </button>
        )}

        <NavLink to="/profile" className={navLinkClass} onClick={onClose}>
          <User className="w-5 h-5 opacity-80" />
          Profile
        </NavLink>

        {role !== "admin" && (
          <NavLink to="/profile" className={navLinkClass} onClick={onClose}>
            <Lock className="w-5 h-5 opacity-80" />
            Change Password
          </NavLink>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 transition cursor-pointer"
        >
          <LogOut className="w-5 h-5 opacity-80" />
          Logout
        </button>
      </nav>

      <div className="flex-1" />

      {/* Profile Display */}
      <div className="p-4 border-t border-slate-100">
        <Link to="/profile" className="flex items-center gap-3 select-none p-2 rounded-xl hover:bg-slate-50 transition-all duration-200 cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200/40 shrink-0 shadow-[0_2px_8px_rgba(85,41,179,0.08)]">
            <User className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-left min-w-0 flex-1">
            <div className="text-sm font-semibold leading-tight text-slate-800 truncate" title={user?.name || user?.username}>
              {user?.name || user?.username || "Welcome!"}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 truncate">
              @{user?.username || "username"}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block min-h-screen">{content}</div>

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed inset-0 z-50 ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* overlay */}
        <div
          onClick={onClose}
          className={`absolute inset-0 bg-black/50 transition-opacity ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* drawer */}
        <div
          className={`absolute left-0 top-0 h-full transition-transform duration-200 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {content}
        </div>
      </div>
    </>
  );
}
