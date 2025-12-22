import { NavLink } from "react-router-dom";
import { useState } from "react";
import logo from "../assets/images/logo.png";
import { logoutAll } from "../utils/logout";

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
    isActive
      ? "bg-white/10 text-white"
      : "text-white/70 hover:text-white hover:bg-white/10"
  }`;

export default function Sidebar({ isOpen, onClose, role = "user" }) {
  const [open, setOpen] = useState(false);

const handleLogout = async () => {
  await logoutAll();
  window.location.href = "https://www.ansaritools.com/login";
};

  const content = (
    <div className="w-72 h-full bg-[#070312] text-white border-r border-white/10 flex flex-col">
      {/* Brand */}
      <div className="p-5 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 p-2 flex items-center justify-center">
          <img
            src={logo}
            alt="Ansari Tools"
            className="h-full w-full object-contain"
          />
        </div>
        <div>
          <div className="font-semibold leading-tight">AnsariTools</div>
          <div className="text-xs text-white/50">
            {role === "admin" ? "Admin Dashboard" : "User Dashboard"}
          </div>
        </div>

        {/* Mobile close */}
        <button
          onClick={onClose}
          className="ml-auto md:hidden text-white/70 hover:text-white rounded-lg px-2 py-1"
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      {/* Nav */}
      <nav className="px-4 mt-2 space-y-2">
        {/* ✅ COMMON (User + Admin) */}
        <NavLink to="/dashboard" className={navLinkClass} onClick={onClose}>
          <span className="text-base">🏠</span>
          Dashboard
        </NavLink>

        <NavLink to="/tutorials" className={navLinkClass} onClick={onClose}>
          <span className="text-base">🎥</span>
          Tutorials
        </NavLink>

        {/* ✅ ADMIN ONLY */}
        {role === "admin" && (
          <>
            <div className="pt-3 pb-1 px-2 text-xs uppercase tracking-wider text-white/40">
              Admin
            </div>

            <NavLink to="/admin/users" className={navLinkClass} onClick={onClose}>
              <span className="text-base">👥</span>
              All Users
            </NavLink>

            <NavLink to="/admin/tools" className={navLinkClass} onClick={onClose}>
              <span className="text-base">🧰</span>
              All Tools
            </NavLink>

            <NavLink
              to="/admin/assign-tool"
              className={navLinkClass}
              onClick={onClose}
            >
              <span className="text-base">🔗</span>
              Assign Tools
            </NavLink>
          </>
        )}
      </nav>

      <div className="flex-1" />

      {/* Profile */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => setOpen((s) => !s)}
          className="w-full flex items-center justify-between rounded-xl px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 transition"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center font-semibold">
              A
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold leading-tight">Profile</div>
              <div className="text-xs text-white/60">Manage account</div>
            </div>
          </div>
          <span className="text-white/70">{open ? "▲" : "▼"}</span>
        </button>

        {open && (
          <div className="mt-2 rounded-xl border border-white/10 bg-[#0b0520] overflow-hidden">
            <button className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10">
              Plan Info
            </button>
            <button className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10">
              Profile
            </button>
            <button className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10">
              Change Password
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-sm text-red-300 hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        )}
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
