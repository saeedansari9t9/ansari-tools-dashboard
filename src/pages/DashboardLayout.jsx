import { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children, role = "user" }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ✅ role pass */}
      <Sidebar
        role={role}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
              aria-label="Open menu"
            >
              ☰
            </button>

            <div className="font-semibold text-slate-800">AnsariTools</div>
            <div className="w-10" />
          </div>
        </div>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
