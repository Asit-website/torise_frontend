import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect } from "react";
import api from '../../services/api';
import toast from 'react-hot-toast';

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

  // Simple chart rendering (SVG bar chart)
  const renderBarChart = (data, label, color) => {
    if (!data || data.length === 0) return <div className="text-gray-400">No data</div>;
    const max = Math.max(...data.map(d => d.count || d.minutes || 0));
    return (
      <svg width="100%" height="120">
        {data.map((d, i) => {
          const val = d.count || d.minutes || 0;
          return (
            <g key={i}>
              <rect
                x={i * 30 + 10}
                y={120 - (val / max) * 100}
                width={20}
                height={(val / max) * 100}
                fill={color}
              />
              <text x={i * 30 + 20} y={115} fontSize="10" textAnchor="middle" fill="#555">
                {d._id?.slice(5)}
              </text>
              <text x={i * 30 + 20} y={120 - (val / max) * 100 - 5} fontSize="10" textAnchor="middle" fill="#222">
                {val}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-xl">Loading analytics...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">View system analytics and insights</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">{kpis.totalClients}</div>
            <div className="text-gray-700">Total Clients</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">{kpis.totalUsers}</div>
            <div className="text-gray-700">Total Users</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">{kpis.activeAvatars}</div>
            <div className="text-gray-700">Active Avatars</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-red-600 mb-2">{kpis.totalConversations}</div>
            <div className="text-gray-700">Total Conversations</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Conversations Over Time</h2>
            {renderBarChart(convoOverTime, 'Conversations', '#2563eb')}
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Voice Minutes Over Time</h2>
            {renderBarChart(voiceMinutesOverTime, 'Voice Minutes', '#059669')}
          </div>
        </div>

        {/* Top Avatars & Fallback Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Top Avatars</h2>
            <ul className="space-y-2">
              {topAvatars.length === 0 ? (
                <li className="text-gray-400">No data</li>
              ) : (
                topAvatars.map((a, i) => (
                  <li key={i} className="flex justify-between items-center">
                    <span>{a.avatar}</span>
                    <span className="font-bold text-blue-700">{a.count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Fallback Rate</h2>
            <div className="text-3xl font-bold text-red-600 mb-2">{fallbackRate.rate.toFixed(2)}%</div>
            <div className="text-gray-700 mb-2">{fallbackRate.fallback} fallbacks out of {fallbackRate.total} text sessions</div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-red-500 h-3 rounded-full"
                style={{ width: `${fallbackRate.rate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Clients Usage</h2>
            <button
              onClick={() => handleExport('client')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
              disabled={exporting}
            >
              Export CSV
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
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Avatars Usage</h2>
            <button
              onClick={() => handleExport('avatar')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
              disabled={exporting}
            >
              Export CSV
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
    </div>
  );
};

export default Analytics; 