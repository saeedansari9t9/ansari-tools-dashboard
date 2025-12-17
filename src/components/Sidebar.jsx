import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-xl font-bold mb-8">AnsariTools</h1>
      <nav className="space-y-3">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/tools">Tools</Link>
        <Link to="/add-tool">Add Tool</Link>
        <Link to="/users">Users</Link>
      </nav>
    </aside>
  );
}
