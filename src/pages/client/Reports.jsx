import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../admin/AdminLayout';

const Reports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversationData, setConversationData] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [filteredData, setFilteredData] = useState(conversationData);
  const [durationFilter, setDurationFilter] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const transcriptionRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching conversations...');
        const res = await fetch(`/api/conversations`);
        const data = await res.json();
        console.log('Raw API response:', data);
        
        // Filter by user's application_sid if present
        let filtered = data.conversations || data;
        console.log('Initial filtered data:', filtered);
        
        if (user && user.application_sid) {
          console.log('User application_sid:', user.application_sid, 'Type:', typeof user.application_sid);
          
          // Handle different data types for application_sid
          let appSids = [];
          if (typeof user.application_sid === 'string') {
            // If it's a comma-separated string
            appSids = user.application_sid.split(',').map(sid => sid.trim());
          } else if (Array.isArray(user.application_sid)) {
            // If it's already an array
            appSids = user.application_sid;
          } else {
            // If it's a single value, convert to array
            appSids = [user.application_sid.toString()];
          }
          
          console.log('Processed appSids:', appSids);
          
          filtered = filtered.filter(row => {
            const matches = row.application_sid && appSids.includes(row.application_sid);
            console.log('Row:', row.call_sid, 'app_sid:', row.application_sid, 'matches:', matches);
            return matches;
          });
          
          console.log('Final filtered data:', filtered);
        }
        setConversationData(filtered);
      } catch (err) {
        console.error("Failed to fetch conversations", err);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      const filtered = conversationData.filter((item) => {
        const created = new Date(item.created_at);
        return created >= start && created <= end;
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(conversationData);
    }
  }, [fromDate, toDate, conversationData]);

  const handleOpen = (conversation) => {
    setSelectedConversation(conversation);
    setOpen(true);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredData.map(item => item.call_sid));
    }
    setSelectAll(!selectAll);
  };

  const handleCheckboxChange = (call_sid) => {
    if (selectedRows.includes(call_sid)) {
      setSelectedRows(prev => prev.filter(id => id !== call_sid));
    } else {
      setSelectedRows(prev => [...prev, call_sid]);
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Calculate metadata for the modal
  const metadata = selectedConversation ? {
    date: selectedConversation.created_at ? new Date(selectedConversation.created_at).toLocaleDateString() : "—",
    duration: selectedConversation.duration_minutes || "0s",
    status: selectedConversation.answered ? "Answered" : "Not Answered",
    channelType: selectedConversation.channel_type || "Unknown",
    applicationSid: selectedConversation.application_sid || "N/A"
  } : {
    date: "—",
    duration: "0s",
    status: "Unknown",
    channelType: "Unknown",
    applicationSid: "N/A"
  };

  const validDates = conversationData
    .map(item => new Date(item.created_at))
    .filter(date => !isNaN(date));
  const maxDate = validDates.length
    ? new Date(Math.max(...validDates)).toISOString().split("T")[0]
    : "";

  return (
    <AdminLayout>
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg w-full p-8">
          <h1 className="mb-8 text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-lg px-6 py-4 flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="mr-3 text-blue-200 hover:text-white focus:outline-none"
              title="Go Back"
              style={{ fontSize: '1.5rem', lineHeight: 1 }}
            >
              ←
            </button>
            Conversation Logs
          </h1>
          <div className="p-6 max-w-full">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor="fromDate" className="text-sm font-medium text-gray-700">
                      From Date
                    </label>
                    <input
                      id="fromDate"
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      max={maxDate}
                      className="w-[150px] px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm"
                    />
                    <label htmlFor="toDate" className="text-sm font-medium text-gray-700 ml-2">
                      To Date
                    </label>
                    <input
                      id="toDate"
                      type="date"
                      value={toDate}
                      onChange={(e) => {
                        const selected = e.target.value;
                        if (selected > maxDate) {
                          alert("Cannot select date after available data.");
                          return;
                        }
                        setToDate(selected);
                      }}
                      max={maxDate}
                      className="w-[150px] px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm"
                    />
                    <button
                      onClick={() => {
                        setFromDate("");
                        setToDate("");
                        setFilteredData(conversationData);
                      }}
                      className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg shadow hover:bg-red-600 transition"
                    >
                      Reset Filter
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Filter by Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 36"
                    value={durationFilter}
                    onChange={(e) => setDurationFilter(e.target.value)}
                    className="w-[120px] px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            {/* Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg w-full">
              <table className="w-full min-w-[1200px] text-left">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-b">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Call SID</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Application SID</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Channel Type</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">From</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">To</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Attempted At</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Answered</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Answered At</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Terminated At</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Duration</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Date</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Messages</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems
                    .filter((item) => {
                      if (!durationFilter) return true;
                      const duration = item?.duration_minutes?.toString() || "";
                      return duration.includes(durationFilter);
                    })
                    .map((item) => {
                      const className = `py-3 px-4 border-b border-gray-200 hover:bg-gray-50`;
                      const isChecked = selectedRows.includes(item.call_sid);
                      return (
                        <tr key={item.call_sid} className="hover:bg-gray-50">
                          <td className={className}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCheckboxChange(item.call_sid)}
                              className="rounded"
                            />
                          </td>
                          <td className={`${className} text-sm`}>{item.call_sid}</td>
                          <td className={`${className} text-sm`}>{item.application_sid || 'N/A'}</td>
                          <td className={`${className} text-sm`}>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              item.channel_type === 'voice' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {item.channel_type || 'N/A'}
                            </span>
                          </td>
                          <td className={`${className} text-sm`}>{item.from_number}</td>
                          <td className={`${className} text-sm`}>{item.to_number}</td>
                          <td className={`${className} text-sm`}>
                            {item.started_at ? new Date(item.started_at).toLocaleString() : "—"}
                          </td>
                          <td className={`${className} text-sm`}>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.answered ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {item.answered ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className={`${className} text-sm`}>
                            {item.answered_at ? new Date(item.answered_at).toLocaleString() : "—"}
                          </td>
                          <td className={`${className} text-sm`}>
                            {item.ended_at ? new Date(item.ended_at).toLocaleString() : "—"}
                          </td>
                          <td className={`${className} text-sm font-medium`}>
                            {item.duration_minutes || "0s"}
                          </td>
                          <td className={`${className} text-sm`}>
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                          </td>
                          <td className={`${className} text-sm font-medium`}>
                            {item.message_log?.length || 0}
                          </td>
                          <td className={className}>
                            <button
                              onClick={() => handleOpen(item)}
                              className="text-blue-600 text-xs underline hover:text-blue-800 transition"
                            >
                              View Conversation
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} results
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`px-3 py-1 text-sm border rounded ${
                        currentPage === pageNumber
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
            {/* Modal Section */}
            {open && (
              <div className="fixed inset-0 z-50 flex items-center justify-center w-full h-full bg-black bg-opacity-40">
                <div className="relative w-full h-full bg-white p-6 overflow-hidden max-w-6xl mx-auto rounded-lg shadow-lg">
                  <button
                    onClick={() => setOpen(false)}
                    className="absolute top-4 right-[20rem] text-gray-500 hover:text-gray-800 text-3xl font-bold z-50"
                  >
                    &times;
                  </button>
                  <div className="flex gap-6 h-full">
                    <div className="flex-1 overflow-y-auto pr-4 border-r">
                      <h3 className="text-lg font-semibold mb-4">
                        Conversation: {selectedConversation?.call_sid}
                      </h3>
                      {selectedConversation?.audio_url && (
                        <div className="mt-6 px-2">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Call Recording</h4>
                          <div className="flex items-center gap-3 mb-6">
                            <audio
                              controls
                              src={selectedConversation?.audio_url}
                              className="w-full rounded shadow"
                            >
                              Your browser does not support the audio element.
                            </audio>
                            <a
                              href={selectedConversation.audio_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded shadow hover:bg-blue-700 transition"
                            >
                              Export
                            </a>
                          </div>
                        </div>
                      )}
                      {/* Tabs */}
                      <div className="flex space-x-4 border-b mb-4">
                        {["Overview", "Transcription", "Client Data"].map((tab) => (
                          <button
                            key={tab}
                            className={`pb-2 text-sm font-medium ${
                              activeTab === tab
                                ? "border-b-2 border-black text-black"
                                : "text-gray-500"
                            }`}
                            onClick={() => setActiveTab(tab)}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                      {/* Tab Content */}
                      {activeTab === "Overview" && (
                        <div className="text-sm text-gray-700 space-y-2 p-4 bg-gray-50 rounded shadow">
                          <p>
                            The agent from Hind Properties initiated a conversation in Hindi,
                            offering assistance in finding a suitable property...
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Call status:{" "}
                            <span className="text-green-600 font-medium">{metadata.status}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Channel Type: <span className="text-blue-600 font-medium">{metadata.channelType}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Application SID: <span className="text-purple-600 font-medium">{metadata.applicationSid}</span>
                          </p>
                        </div>
                      )}
                      {activeTab === "Transcription" && (
                        <div>
                          <div
                            ref={transcriptionRef}
                            className="space-y-4 max-h-[420px] overflow-y-auto pr-2"
                          >
                            {selectedConversation?.message_log?.length ? (
                              selectedConversation.message_log.map((e, i) => {
                                const isUser = e.sender === "user";
                                const timestamp = e.timestamp
                                  ? new Date(e.timestamp).toLocaleString()
                                  : "—";
                                return (
                                  <div
                                    key={i}
                                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                                  >
                                    <div className="max-w-[80%]">
                                      <div
                                        className={`rounded-xl px-4 py-2 text-sm shadow ${
                                          isUser
                                            ? "bg-green-50 text-gray-800 border border-green-200"
                                            : "bg-gray-100 text-gray-900 border border-gray-300"
                                        }`}
                                      >
                                        {e.message}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">{timestamp}</div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-sm text-gray-500">No messages found.</div>
                            )}
                          </div>
                        </div>
                      )}
                      {activeTab === "Client Data" && (
                        <div className="text-sm text-gray-500 italic p-4">
                          Client metadata coming soon...
                        </div>
                      )}
                    </div>
                    {/* Metadata Sidebar */}
                    <div className="w-64 flex-shrink-0 bg-gray-50 rounded p-4 shadow-inner overflow-y-auto h-full">
                      <h4 className="text-sm font-semibold mb-3">Metadata</h4>
                      <ul className="text-sm text-gray-700 space-y-2">
                        <li>
                          <strong>Date:</strong> {metadata.date}
                        </li>
                        <li>
                          <strong>Connection duration:</strong> {metadata.duration} Sec
                        </li>
                        <li>
                          <strong>Call status:</strong>{' '}
                          <span className="text-green-600 font-medium">{metadata.status}</span>
                        </li>
                        <li>
                          <strong>Channel Type:</strong>{' '}
                          <span className="text-blue-600 font-medium">{metadata.channelType}</span>
                        </li>
                        <li>
                          <strong>Application SID:</strong>{' '}
                          <span className="text-purple-600 font-medium">{metadata.applicationSid}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Reports; 