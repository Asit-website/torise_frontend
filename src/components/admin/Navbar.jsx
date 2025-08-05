import React from "react";

const AdminNavbar = () => (
  <nav className="bg-blue-600 text-white px-6 py-3 flex items-center justify-between shadow">
    <div className="font-bold text-xl">GenAI Admin</div>
    <div className="space-x-4">
      <a href="/admin/dashboard" className="hover:underline">Dashboard</a>
      <a href="/admin/users" className="hover:underline">Users</a>
      <a href="/admin/clients" className="hover:underline">Clients</a>
      <a href="/admin/avatars" className="hover:underline">Avatars</a>
      <a href="/admin/conversation-logs" className="hover:underline">Conversation Logs</a>
      <a href="/admin/analytics" className="hover:underline">Analytics</a>
      <a href="/admin/appsids" className="hover:underline">App SIDs</a>
    </div>
  </nav>
);

export default AdminNavbar; 