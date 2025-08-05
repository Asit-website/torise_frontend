import { useAuth } from '../../contexts/AuthContext';
import { useLocation, Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Typography } from '@material-tailwind/react';

// SidebarLink helper
const SidebarLink = ({ to, label, active }) => (
  <Link
    to={to}
    className={`flex items-center px-4 py-2 rounded-lg transition-colors font-medium
      ${active ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500' : 'text-gray-700 hover:bg-gray-100'}
    `}
  >
    {label}
  </Link>
);

// Sidebar
const Sidebar = ({ user }) => {
  const location = useLocation();
  const { logout } = useAuth();
  if (!user) return null;
  const isAdmin = ['admin', 'super_admin', 'internal_admin'].includes(user.role);
  const isClient = ['client_admin', 'client_manager', 'client_viewer'].includes(user.role);
  const isSupport = user.role === 'support_agent';
  const isActive = (path) => location.pathname === path;
  return (
    <aside className="w-64 h-screen fixed left-0 top-0 flex flex-col justify-between bg-white border-r border-gray-200 shadow-lg z-30">
      <nav className="flex flex-col space-y-2 p-4">
        <SidebarLink to="/dashboard" label="Dashboard" active={isActive('/dashboard')} />
        {isAdmin && (
          <>
            <SidebarLink to="/admin/clients" label="Clients" active={isActive('/admin/clients')} />
            <SidebarLink to="/admin/users" label="Users" active={isActive('/admin/users')} />
            <SidebarLink to="/admin/avatars" label="Avatars" active={isActive('/admin/avatars')} />
            <SidebarLink to="/admin/conversation-logs" label="Reports" active={isActive('/admin/conversation-logs')} />
            <SidebarLink to="/admin/analytics" label="Analytics" active={isActive('/admin/analytics')} />
            {/* <SidebarLink to="/admin/report" label="Reports" active={isActive('/admin/report')} /> */}
            <SidebarLink to="/admin/bots" label="Bots" active={isActive('/admin/bots')} />
            <SidebarLink to="/admin/appsids" label="App SIDs" active={isActive('/admin/appsids')} />
            <SidebarLink to="/admin/chat-interface" label="Chat Interface" active={isActive('/admin/chat-interface')} />
          </>
        )}
        {isClient && (
          <>
            <SidebarLink to="/client/apps" label="Apps" active={isActive('/client/apps')} />
            <SidebarLink to="/client/avatars" label="Avatars" active={isActive('/client/avatars')} />
            <SidebarLink to="/client/reports" label="Reports" active={isActive('/client/reports')} />
          </>
        )}
        {isSupport && (
          <>
            <SidebarLink to="/support/tools" label="Support Tools" active={isActive('/support/tools')} />
            <SidebarLink to="/support/logs" label="Conversation Logs" active={isActive('/support/logs')} />
          </>
        )}
      </nav>
      <div className="p-4 border-t border-gray-100 text-xs text-gray-400 text-center flex flex-col gap-4">
        <button
          onClick={logout}
          className="w-full bg-red-100 text-red-600 font-semibold py-2 rounded-lg hover:bg-red-200 transition-colors mb-2"
        >
          Logout
        </button>
        <div>&copy; {new Date().getFullYear()} GenAI Dashboard</div>
      </div>
    </aside>
  );
};

// Top Navbar
const TopNavbar = ({ user }) => {
  if (!user) return null;
  return (
    <nav className="bg-blue-600 text-white px-6 flex items-center justify-between shadow h-16 w-full sticky top-0 z-40">
      <div className="font-bold text-xl">GenAI Dashboard</div>
      <div className="space-x-4">
        <Link to="/dashboard" className="hover:underline">Dashboard</Link>
        <Link to="/profile" className="hover:underline">Profile</Link>
      </div>
    </nav>
  );
};

// AdminLayout
const AdminLayout = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1 ml-64">
        <TopNavbar user={user} />
        <main className="p-6">
          {children ? children : <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 