import React from "react";
import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `hover:text-blue-600 px-2 py-1 rounded transition font-medium` +
  (isActive ? " bg-blue-100 text-blue-700" : "");

const AdminSidebar = () => (
  <aside className="w-64 bg-white shadow h-full p-4 hidden md:block">
    <nav className="flex flex-col space-y-4">
      <NavLink to="/admin/dashboard" className={linkClass} end>Dashboard</NavLink>
      <NavLink to="/admin/users" className={linkClass} end>Users</NavLink>
      <NavLink to="/admin/clients" className={linkClass} end>Clients</NavLink>
      <NavLink to="/admin/avatars" className={linkClass} end>Avatars</NavLink>
      <NavLink to="/admin/conversation-logs" className={linkClass} end>Conversation Logs</NavLink>
      <NavLink to="/admin/analytics" className={linkClass} end>Analytics</NavLink>
      <NavLink to="/admin/appsids" className={linkClass} end>App SIDs</NavLink>
    </nav>
  </aside>
);

export default AdminSidebar; 