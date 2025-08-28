import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect } from "react";
import api from '../../services/api';
import toast from 'react-hot-toast';
import AdminLayout from "./AdminLayout";
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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
  const [topAvatars, setTopAvatars] = useState([]);
  const [fallbackRate, setFallbackRate] = useState({ total: 0, fallback: 0, rate: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Dynamic graph states
  const [usageRange, setUsageRange] = useState('7');
  const [usageData, setUsageData] = useState({
    '7': { labels: [], minutes: [], text: [] },
    '30': { labels: [], minutes: [], text: [] }
  });
  const [usageDataLoading, setUsageDataLoading] = useState(false);
  const [voiceRange, setVoiceRange] = useState('7');
  const [voiceData, setVoiceData] = useState({
    '7': { labels: [], minutes: [], calls: [] },
    '30': { labels: [], minutes: [], calls: [] }
  });
  const [voiceDataLoading, setVoiceDataLoading] = useState(false);

  useEffect(() => {
    fetchAllAnalytics();
    fetchUsageData(7);
    fetchUsageData(30);
    fetchVoiceData(7);
    fetchVoiceData(30);
  }, []);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching all analytics data...');
      
      const [kpisRes, clientsRes, avatarsRes, topAvatarsRes, fallbackRes] = await Promise.all([
        api.get('/api/analytics/kpis'),
        api.get('/api/analytics/clients-table'),
        api.get('/api/analytics/avatars-table'),
        api.get('/api/analytics/top-avatars?limit=5'),
        api.get('/api/analytics/fallback-rate'),
      ]);
      
      console.log('✅ KPIs data:', kpisRes.data);
      
      setKpis(kpisRes.data);
      setClientsTable(clientsRes.data);
      setAvatarsTable(avatarsRes.data);
      setTopAvatars(topAvatarsRes.data);
      setFallbackRate(fallbackRes.data);
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      console.error('Error response:', error.response);
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageData = async (days) => {
    try {
      setUsageDataLoading(true);
      console.log(`🔍 Fetching usage data for ${days} days...`);
      console.log('Current user:', user);
      console.log('User role:', user?.role);
      
      // Fetch both voice and chat data separately
      const [voiceResponse, chatResponse] = await Promise.all([
        api.get('/api/analytics/voice-minutes-over-time', { params: { days } }),
        api.get('/api/analytics/conversations-over-time', { params: { days, channel: 'chat' } })
      ]);
      
      console.log('✅ Voice minutes response:', voiceResponse.data);
      console.log('✅ Chat sessions response:', chatResponse.data);
      
      // Process data to get total minutes and session counts by date
      const processedData = {
        labels: [],
        minutes: [], // Total voice minutes
        text: []     // Chat session counts
      };
      
      // Create maps for both datasets
      const voiceMap = new Map();
      const chatMap = new Map();
      
      // Process voice minutes data
      voiceResponse.data.forEach(item => {
        const date = item._id;
        const minutes = parseFloat(item.minutes) || 0;
        console.log(`Date: ${date}, Voice Minutes: ${minutes}`);
        voiceMap.set(date, minutes);
      });
      
      // Process chat sessions data
      chatResponse.data.forEach(item => {
        const date = item._id;
        const count = parseInt(item.count) || 0;
        console.log(`Date: ${date}, Chat Sessions: ${count}`);
        chatMap.set(date, count);
      });
      
      // Get all unique dates
      const allDates = new Set([...voiceMap.keys(), ...chatMap.keys()]);
      const sortedDates = Array.from(allDates).sort();
      
      processedData.labels = sortedDates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      });
      processedData.minutes = sortedDates.map(date => {
        const value = voiceMap.get(date) || 0;
        console.log(`Final mapping - Date: ${date}, Voice Minutes: ${value}`);
        return value;
      });
      processedData.text = sortedDates.map(date => {
        const value = chatMap.get(date) || 0;
        console.log(`Final mapping - Date: ${date}, Chat Sessions: ${value}`);
        return value;
      });
      
      console.log('✅ Processed usage data:', processedData);
      console.log('✅ Voice map:', Object.fromEntries(voiceMap));
      console.log('✅ Chat map:', Object.fromEntries(chatMap));
      console.log('✅ Sorted dates:', sortedDates);
      
      setUsageData(prev => ({
        ...prev,
        [days]: processedData
      }));
    } catch (error) {
      console.error('❌ Error fetching usage data:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.response?.data);
      toast.error('Failed to fetch usage data');
    } finally {
      setUsageDataLoading(false);
    }
  };

  const fetchVoiceData = async (days) => {
    try {
      setVoiceDataLoading(true);
      console.log(`🔍 Fetching voice data for ${days} days...`);
      
      // Fetch both voice minutes and voice call counts
      const [minutesResponse, callsResponse] = await Promise.all([
        api.get('/api/analytics/voice-minutes-over-time', { params: { days } }),
        api.get('/api/analytics/conversations-over-time', { params: { days, channel: 'voice' } })
      ]);
      
      console.log('✅ Voice minutes response:', minutesResponse.data);
      console.log('✅ Voice calls response:', callsResponse.data);
      
      // Process voice data to separate minutes and call counts
      const processedData = {
        labels: [],
        minutes: [],
        calls: []
      };
      
      // Create maps for both datasets
      const minutesMap = new Map();
      const callsMap = new Map();
      
      // Process minutes data
      minutesResponse.data.forEach(item => {
        const date = item._id;
        const minutes = parseFloat(item.minutes) || 0;
        console.log(`Date: ${date}, Minutes: ${minutes}`);
        minutesMap.set(date, minutes);
      });
      
      // Process calls data
      callsResponse.data.forEach(item => {
        const date = item._id;
        const count = parseInt(item.count) || 0;
        console.log(`Date: ${date}, Calls: ${count}`);
        callsMap.set(date, count);
      });
      
      // Get all unique dates
      const allDates = new Set([...minutesMap.keys(), ...callsMap.keys()]);
      const sortedDates = Array.from(allDates).sort();
      
      processedData.labels = sortedDates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      });
      processedData.minutes = sortedDates.map(date => {
        const value = minutesMap.get(date) || 0;
        console.log(`Final mapping - Date: ${date}, Minutes: ${value}`);
        return value;
      });
      processedData.calls = sortedDates.map(date => {
        const value = callsMap.get(date) || 0;
        console.log(`Final mapping - Date: ${date}, Calls: ${value}`);
        return value;
      });
      
      console.log('✅ Processed voice data:', processedData);
      console.log('✅ Minutes map:', Object.fromEntries(minutesMap));
      console.log('✅ Calls map:', Object.fromEntries(callsMap));
      console.log('✅ Sorted dates:', sortedDates);
      
      setVoiceData(prev => ({
        ...prev,
        [days]: processedData
      }));
    } catch (error) {
      console.error('❌ Error fetching voice data:', error);
      console.error('Error response:', error.response);
      toast.error('Failed to fetch voice data');
    } finally {
      setVoiceDataLoading(false);
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">View system analytics and insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-2">🏢</div>
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

        {/* Dynamic Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Usage Analytics Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">📊 Usage Analytics (Minutes/Text Sessions)</h2>
              <div className="flex gap-2">
                {['7', '30'].map((range) => (
                  <button
                    key={range}
                    className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                      usageRange === range
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                    }`}
                    onClick={() => {
                      setUsageRange(range);
                      if (!usageData[range]?.labels?.length) {
                        fetchUsageData(range);
                      }
                    }}
                  >
                    Last {range} Days
                  </button>
                ))}
              </div>
            </div>
            {usageDataLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Loading usage data...</p>
                </div>
              </div>
            ) : usageData[usageRange]?.labels?.length > 0 ? (
              <div className="h-64">
                <Line
                  data={{
                    labels: usageData[usageRange].labels,
                    datasets: [
                      {
                        label: 'Total Voice Minutes',
                        data: usageData[usageRange].minutes,
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37,99,235,0.1)',
                        tension: 0.4,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                      },
                      {
                        label: 'Text Sessions',
                        data: usageData[usageRange].text,
                        borderColor: '#dc2626',
                        backgroundColor: 'rgba(220,38,38,0.1)',
                        tension: 0.4,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                      legend: { 
                        position: 'top',
                        labels: {
                          usePointStyle: true,
                          padding: 15,
                          font: {
                            size: 12,
                            weight: 'bold'
                          }
                        }
                      }, 
                      title: { display: false },
                      tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#2563eb',
                        borderWidth: 1,
                        titleFont: { size: 12 },
                        bodyFont: { size: 11 },
                        callbacks: {
                          label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${label}: ${value.toFixed(1)}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: { 
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0,0,0,0.05)',
                          drawBorder: false,
                        },
                        ticks: {
                          font: {
                            size: 11
                          }
                        }
                      },
                      x: {
                        grid: {
                          color: 'rgba(0,0,0,0.05)',
                          drawBorder: false,
                        },
                        ticks: {
                          font: {
                            size: 11
                          }
                        }
                      }
                    },
                    interaction: {
                      mode: 'nearest',
                      axis: 'x',
                      intersect: false
                    },
                    elements: {
                      point: {
                        hoverBackgroundColor: '#2563eb',
                        hoverBorderColor: '#fff',
                        hoverBorderWidth: 2,
                      }
                    }
                  }}
                  height={250}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <p className="text-gray-600 text-sm">No usage data available</p>
                </div>
              </div>
            )}
          </div>

          {/* Voice Analytics Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">🎤 Voice Analytics (Total Minutes/Calls)</h2>
              <div className="flex gap-2">
                {['7', '30'].map((range) => (
                  <button
                    key={range}
                    className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                      voiceRange === range
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-green-600 border-green-300 hover:bg-green-50'
                    }`}
                    onClick={() => {
                      setVoiceRange(range);
                      if (!voiceData[range]?.labels?.length) {
                        fetchVoiceData(range);
                      }
                    }}
                  >
                    Last {range} Days
                  </button>
                ))}
              </div>
            </div>
            {voiceDataLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Loading voice data...</p>
                </div>
              </div>
            ) : voiceData[voiceRange]?.labels?.length > 0 ? (
              <div className="h-64">
                <Line
                  data={{
                    labels: voiceData[voiceRange].labels,
                    datasets: [
                      {
                        label: 'Total Voice Minutes',
                        data: voiceData[voiceRange].minutes,
                        borderColor: '#059669',
                        backgroundColor: 'rgba(5,150,105,0.1)',
                        tension: 0.4,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                      },
                      {
                        label: 'Total Voice Calls',
                        data: voiceData[voiceRange].calls,
                        borderColor: '#dc2626',
                        backgroundColor: 'rgba(220,38,38,0.1)',
                        tension: 0.4,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                      legend: { 
                        position: 'top',
                        labels: {
                          usePointStyle: true,
                          padding: 15,
                          font: {
                            size: 12,
                            weight: 'bold'
                          }
                        }
                      }, 
                      title: { display: false },
                      tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#059669',
                        borderWidth: 1,
                        titleFont: { size: 12 },
                        bodyFont: { size: 11 },
                        callbacks: {
                          label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${label}: ${value.toFixed(1)}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: { 
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0,0,0,0.05)',
                          drawBorder: false,
                        },
                        ticks: {
                          font: {
                            size: 11
                          }
                        }
                      },
                      x: {
                        grid: {
                          color: 'rgba(0,0,0,0.05)',
                          drawBorder: false,
                        },
                        ticks: {
                          font: {
                            size: 11
                          }
                        }
                      }
                    },
                    interaction: {
                      mode: 'nearest',
                      axis: 'x',
                      intersect: false
                    },
                    elements: {
                      point: {
                        hoverBackgroundColor: '#059669',
                        hoverBorderColor: '#fff',
                        hoverBorderWidth: 2,
                      }
                    }
                  }}
                  height={250}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <div className="text-3xl mb-2">🎤</div>
                  <p className="text-gray-600 text-sm">No voice data available</p>
                </div>
              </div>
            )}
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