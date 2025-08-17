import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect } from "react";
import api from '../../services/api';
import toast from 'react-hot-toast';
import AdminLayout from "./AdminLayout";

const Analytics = () => {
  const { user } = useAuth();
  const [kpis, setKpis] = useState({
    totalClients: 0,
    totalUsers: 0,
    totalConversations: 0,
    activeAvatars: 0,
  });
  const [clientsTable, setClientsTable] = useState([]);
  const [avatarsTable, setAvatarsTable] = useState([]);
  const [convoOverTime, setConvoOverTime] = useState([]);
  const [voiceMinutesOverTime, setVoiceMinutesOverTime] = useState([]);
  const [topAvatars, setTopAvatars] = useState([]);
  const [fallbackRate, setFallbackRate] = useState({ total: 0, fallback: 0, rate: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const [kpisRes, clientsRes, avatarsRes, convoRes, voiceRes, topAvatarsRes, fallbackRes] = await Promise.all([
        api.get('/api/analytics/kpis'),
        api.get('/api/analytics/clients-table'),
        api.get('/api/analytics/avatars-table'),
        api.get('/api/analytics/conversations-over-time'),
        api.get('/api/analytics/voice-minutes-over-time'),
        api.get('/api/analytics/top-avatars?limit=5'),
        api.get('/api/analytics/fallback-rate'),
      ]);
      setKpis(kpisRes.data);
      setClientsTable(clientsRes.data);
      setAvatarsTable(avatarsRes.data);
      setConvoOverTime(convoRes.data);
      setVoiceMinutesOverTime(voiceRes.data);
      setTopAvatars(topAvatarsRes.data);
      setFallbackRate(fallbackRes.data);
    } catch (error) {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (scope) => {
    setExporting(true);
    try {
      const res = await api.get(`/api/analytics/export?type=csv&scope=${scope}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${scope}-export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  // Enhanced chart rendering with better styling
  const renderBarChart = (data, label, color) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-32 text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <div>No data available</div>
          </div>
        </div>
      );
    }
    
    const max = Math.max(...data.map(d => d.count || d.minutes || 0));
    const chartHeight = 150;
    const barWidth = Math.max(20, (400 - (data.length * 10)) / data.length);
    
    return (
      <div className="relative">
        <svg width="100%" height={chartHeight} className="mt-4">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent, i) => (
            <line
              key={i}
              x1="0"
              y1={chartHeight - (percent / 100) * (chartHeight - 40)}
              x2="100%"
              y2={chartHeight - (percent / 100) * (chartHeight - 40)}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
          
          {data.map((d, i) => {
            const val = d.count || d.minutes || 0;
            const barHeight = max > 0 ? (val / max) * (chartHeight - 40) : 0;
            const x = (i * (100 / data.length)) + (100 / data.length / 2);
            const y = chartHeight - barHeight - 20;
            
            return (
              <g key={i}>
                {/* Bar */}
                <rect
                  x={`${x - barWidth/2}%`}
                  y={y}
                  width={`${barWidth}%`}
                  height={barHeight}
                  fill={color}
                  rx="4"
                  className="transition-all duration-300 hover:opacity-80"
                />
                
                {/* Value on top of bar */}
                <text 
                  x={`${x}%`} 
                  y={y - 8} 
                  fontSize="12" 
                  textAnchor="middle" 
                  fill="#374151"
                  className="font-semibold"
                >
                  {val}
                </text>
                
                {/* Date label */}
                <text 
                  x={`${x}%`} 
                  y={chartHeight - 5} 
                  fontSize="11" 
                  textAnchor="middle" 
                  fill="#6b7280"
                >
                  {d._id ? d._id.slice(5) : `Day ${i+1}`}
                </text>
              </g>
            );
          })}
        </svg>
        
        {/* Chart title and total */}
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-600 mb-1">{label}</div>
          <div className="text-2xl font-bold text-gray-800">
            {data.reduce((sum, d) => sum + (d.count || d.minutes || 0), 0)}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen text-xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div>Loading analytics...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">View system analytics and insights</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-2">👥</div>
            <div className="text-3xl font-bold text-blue-600 mb-2">{kpis.totalClients}</div>
            <div className="text-gray-700 font-medium">Total Clients</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-2">👤</div>
            <div className="text-3xl font-bold text-green-600 mb-2">{kpis.totalUsers}</div>
            <div className="text-gray-700 font-medium">Total Users</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-2">🤖</div>
            <div className="text-3xl font-bold text-purple-600 mb-2">{kpis.activeAvatars}</div>
            <div className="text-gray-700 font-medium">Active Avatars</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-2">💬</div>
            <div className="text-3xl font-bold text-red-600 mb-2">{kpis.totalConversations}</div>
            <div className="text-gray-700 font-medium">Total Conversations</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">📈 Conversations Over Time</h2>
              <div className="text-sm text-gray-500">Last 7 days</div>
            </div>
            {renderBarChart(convoOverTime, 'Total Conversations', '#2563eb')}
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">🎤 Voice Minutes Over Time</h2>
              <div className="text-sm text-gray-500">Last 7 days</div>
            </div>
            {renderBarChart(voiceMinutesOverTime, 'Total Minutes', '#059669')}
          </div>
        </div>

        {/* Top Avatars & Fallback Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">🤖 Top Avatars</h2>
            </div>
            <ul className="space-y-3">
              {topAvatars.length === 0 ? (
                <li className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">🤖</div>
                  <div>No avatar data available</div>
                </li>
              ) : (
                topAvatars.map((a, i) => (
                  <li key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{a.avatar}</span>
                    <span className="font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full text-sm">
                      {a.count} sessions
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">⚠️ Fallback Rate</h2>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">{fallbackRate.rate.toFixed(2)}%</div>
              <div className="text-gray-600 mb-4">{fallbackRate.fallback} fallbacks out of {fallbackRate.total} text sessions</div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div
                  className="bg-red-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(fallbackRate.rate, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                {fallbackRate.rate > 10 ? 'High fallback rate detected' : 'Normal fallback rate'}
              </div>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-lg shadow-lg mb-8 border border-gray-100">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">📊 Clients Usage Analytics</h2>
            <button
              onClick={() => handleExport('client')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              disabled={exporting}
            >
              {exporting ? 'Exporting...' : '📥 Export CSV'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3">Client Name</th>
                  <th className="p-3">Total Sessions</th>
                  <th className="p-3">Voice Minutes</th>
                  <th className="p-3">Text Sessions</th>
                  <th className="p-3">Avg Duration</th>
                  <th className="p-3">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {clientsTable.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-4 text-gray-400">No data</td></tr>
                ) : (
                  clientsTable.map((row, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-3">{row.clientName}</td>
                      <td className="p-3">{row.totalSessions}</td>
                      <td className="p-3">{row.voiceMinutes}</td>
                      <td className="p-3">{row.textSessions}</td>
                      <td className="p-3">{row.avgDuration ? row.avgDuration.toFixed(2) : '-'}</td>
                      <td className="p-3">{row.lastActive ? new Date(row.lastActive).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Avatars Table */}
        <div className="bg-white rounded-lg shadow-lg mb-8 border border-gray-100">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">🤖 Avatars Usage Analytics</h2>
            <button
              onClick={() => handleExport('avatar')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              disabled={exporting}
            >
              {exporting ? 'Exporting...' : '📥 Export CSV'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3">Avatar Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Sessions</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {avatarsTable.length === 0 ? (
                  <tr><td colSpan={5} className="text-center p-4 text-gray-400">No data</td></tr>
                ) : (
                  avatarsTable.map((row, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-3">{row.avatarName}</td>
                      <td className="p-3">{row.type}</td>
                      <td className="p-3">{row.sessions}</td>
                      <td className="p-3">{row.duration}</td>
                      <td className="p-3">{row.lastActive ? new Date(row.lastActive).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Analytics; 