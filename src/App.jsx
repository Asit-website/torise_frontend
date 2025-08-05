import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

//Admin pages
import Users2 from './pages/admin/Users'
import Clients from './pages/admin/Clients'
import Avatars from './pages/admin/Avatars'
import Analytics from './pages/admin/Analytics'
import ClientDetail from './pages/admin/ClientDetail';
import Report from './pages/admin/Report';
import Bots from './pages/admin/Bots';
import ChatInterface from './pages/admin/ChatInterface';
import ClientBots from './pages/client/Bots';
import Reports from './pages/client/Reports';
import ConversationLogs from './pages/admin/ConversationLogs';

// Chat pages
import ChatInterfacePage from './pages/ChatInterface';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navbar />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        {/* Admin Routes */}
        <Route path="/admin/users" element={<PrivateRoute><Users2 /></PrivateRoute>} />
        <Route path="/admin/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
        <Route path="/admin/avatars" element={<PrivateRoute><Avatars /></PrivateRoute>} />
        <Route path="/admin/conversations" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/admin/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
        <Route path="/admin/appsids" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/admin/clients/:id" element={<PrivateRoute><ClientDetail /></PrivateRoute>} />
        <Route path="/admin/report" element={<PrivateRoute><Report /></PrivateRoute>} />
        <Route path="/admin/bots" element={<PrivateRoute><Bots /></PrivateRoute>} />
        <Route path="/admin/chat-interface" element={<PrivateRoute><ChatInterface /></PrivateRoute>} />
        <Route path="/admin/conversation-logs" element={<PrivateRoute><ConversationLogs /></PrivateRoute>} />
        
        {/* Client Routes */}
        <Route path="/client/apps" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/client/avatars" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/client/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
        <Route path="/client/bots" element={<PrivateRoute><ClientBots /></PrivateRoute>} />
        
        {/* Support Routes */}
        <Route path="/support/tools" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/support/logs" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        
        {/* Chat Routes */}
        <Route path="/chat/:botId" element={<ChatInterfacePage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App 