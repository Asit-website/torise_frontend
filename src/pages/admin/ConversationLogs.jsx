import React, { useEffect, useState, useRef } from 'react';
import AdminLayout from './AdminLayout';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const ConversationLogs = () => {
  const navigate = useNavigate();
  const [conversationData, setConversationData] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [durationFilter, setDurationFilter] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const transcriptionRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/conversations`);
        const data = await res.json();
        console.log('Fetched conversations data:', data);
        setConversationData(data.conversations || data); // support both array and {conversations: []}
      } catch (err) {
        console.error("Failed to fetch conversations", err);
      }
    };
    fetchData();
  }, []);

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
    // Reset to first page when data changes
    setCurrentPage(1);
  }, [fromDate, toDate, conversationData]);

  const handleOpen = (conversation) => {
    setSelectedConversation(conversation);
    setOpen(true);
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

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      // Select all from the current filtered data (including duration filter)
      setSelectedRows(durationFilteredData.map(item => item.call_sid));
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

  // Apply duration filter to filteredData
  const durationFilteredData = filteredData.filter((item) => {
    if (!durationFilter) return true;
    const duration = item?.duration_minutes?.toString() || "";
    return duration.includes(durationFilter);
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = durationFilteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(durationFilteredData.length / itemsPerPage));
  
  // Ensure current page is valid
  const validCurrentPage = Math.min(currentPage, totalPages);
  if (validCurrentPage !== currentPage) {
    setCurrentPage(validCurrentPage);
  }

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    } else if (pageNumber > totalPages) {
      setCurrentPage(totalPages);
    } else if (pageNumber < 1) {
      setCurrentPage(1);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // PDF Download Function
  const downloadTranscriptionAsPDF = () => {
    if (!selectedConversation?.message_log?.length) {
      alert('No messages to download');
      return;
    }

    try {
      // Create PDF content
      const conversationId = selectedConversation?.call_sid || selectedConversation?.conversation_id || 'Unknown';
      const date = selectedConversation?.created_at ? new Date(selectedConversation.created_at).toLocaleDateString() : 'Unknown';
      const channelType = selectedConversation?.channel_type || 'Unknown';
      const applicationSid = selectedConversation?.application_sid || 'N/A';
      
      let pdfContent = `
        <html>
          <head>
            <title>Conversation Transcript - ${conversationId}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .metadata { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
              .metadata table { width: 100%; }
              .metadata td { padding: 5px; }
              .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
              .user-message { background: #e8f5e8; border-left: 4px solid #28a745; margin-left: 20px; }
              .agent-message { background: #f0f0f0; border-left: 4px solid #007bff; margin-right: 20px; }
              .timestamp { font-size: 12px; color: #666; margin-top: 5px; }
              .sender { font-weight: bold; margin-bottom: 5px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Conversation Transcript</h1>
              <h2>${conversationId}</h2>
            </div>
            
            <div class="metadata">
              <table>
                <tr><td><strong>Date:</strong></td><td>${date}</td></tr>
                <tr><td><strong>Channel Type:</strong></td><td>${channelType}</td></tr>
                <tr><td><strong>Application SID:</strong></td><td>${applicationSid}</td></tr>
                <tr><td><strong>Total Messages:</strong></td><td>${selectedConversation.message_log.length}</td></tr>
              </table>
            </div>
            
            <h3>Conversation Messages:</h3>
      `;

      // Add each message to PDF content
      selectedConversation.message_log.forEach((message, index) => {
        const isUser = message.sender === 'user';
        const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : '—';
        const sender = isUser ? 'User' : 'Agent';
        
        pdfContent += `
          <div class="message ${isUser ? 'user-message' : 'agent-message'}">
            <div class="sender">${sender}</div>
            <div>${message.message}</div>
            <div class="timestamp">${timestamp}</div>
          </div>
        `;
      });

      pdfContent += `
          </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `conversation-${conversationId}-${date}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('Conversation transcript downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download transcript');
    }
  };

  const handleExport = () => {
    // Get selected conversations from the filtered and paginated data
    const selectedConversations = durationFilteredData.filter(item => selectedRows.includes(item.call_sid));
    
    // If no rows are selected, show alert
    if (selectedConversations.length === 0) {
      alert('Please select at least one row to export.');
      return;
    }
    
    // Helper function to escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '""';
      const stringValue = String(value);
      // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
      }
      return stringValue;
    };
    
    // Helper function to format phone numbers
    const formatPhoneNumber = (phone) => {
      if (!phone) return '';
      // If it's a number, format it as text to prevent scientific notation
      if (typeof phone === 'number') {
        return `"${phone}"`;
      }
      return phone;
    };
    
    // Helper function to format dates
    const formatDate = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (error) {
        return dateString;
      }
    };
    
    // Convert to CSV with proper formatting
    const csvRows = [
      [
        "Call SID",
        "Application SID", 
        "Channel Type",
        "From Number",
        "To Number",
        "Attempted At",
        "Answered",
        "Answered At",
        "Terminated At",
        "Duration",
        "Message Count"
      ],
      ...selectedConversations.map(item => [
        escapeCSV(item.call_sid || ''),
        escapeCSV(item.application_sid || ''),
        escapeCSV(item.channel_type || ''),
        formatPhoneNumber(item.from_number || item.summary?.from || ''),
        formatPhoneNumber(item.to_number || item.summary?.to || ''),
        escapeCSV(formatDate(item.started_at)),
        escapeCSV(item.answered ? "Yes" : "No"),
        escapeCSV(formatDate(item.answered_at)),
        escapeCSV(formatDate(item.ended_at)),
        escapeCSV(item.duration_minutes || ''),
        escapeCSV((item.message_log || []).length)
      ])
    ];
    
    // Create CSV content with proper line endings
    const csvContent = csvRows.map(row => row.join(',')).join('\r\n');
    
    // Create blob with proper encoding
    const blob = new Blob(['\ufeff' + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `conversation_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log(`Exported ${selectedConversations.length} selected conversations`);
  };

  const handleExcelExport = () => {
    // Get selected conversations from the filtered and paginated data
    const selectedConversations = durationFilteredData.filter(item => selectedRows.includes(item.call_sid));
    
    // If no rows are selected, show alert
    if (selectedConversations.length === 0) {
      alert('Please select at least one row to export.');
      return;
    }
    
    // Helper function to format dates
    const formatDate = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (error) {
        return dateString;
      }
    };
    
    // Prepare data for Excel
    const excelData = selectedConversations.map(item => ({
      'Call SID': item.call_sid || '',
      'Application SID': item.application_sid || '',
      'Channel Type': item.channel_type || '',
      'From Number': item.from_number || item.summary?.from || '',
      'To Number': item.to_number || item.summary?.to || '',
      'Attempted At': formatDate(item.started_at),
      'Answered': item.answered ? "Yes" : "No",
      'Answered At': formatDate(item.answered_at),
      'Terminated At': formatDate(item.ended_at),
      'Duration': item.duration_minutes || '',
      'Message Count': (item.message_log || []).length
    }));
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    const columnWidths = [
      { wch: 25 }, // Call SID
      { wch: 20 }, // Application SID
      { wch: 12 }, // Channel Type
      { wch: 15 }, // From Number
      { wch: 15 }, // To Number
      { wch: 20 }, // Attempted At
      { wch: 8 },  // Answered
      { wch: 20 }, // Answered At
      { wch: 20 }, // Terminated At
      { wch: 12 }, // Duration
      { wch: 12 }  // Message Count
    ];
    worksheet['!cols'] = columnWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Conversation Logs');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `conversation_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log(`Exported ${selectedConversations.length} selected conversations to Excel`);
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
  
          {/* Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-6">
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
                      setDurationFilter("");
                      setFilteredData(conversationData);
                      setSelectedRows([]);
                      setSelectAll(false);
                    }}
                    className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg shadow hover:bg-red-600 transition flex items-center gap-2"
                  >
                    🔄 Reset All Filters
                  </button>
                </div>
              </div>
            </div>
  
            {/* Duration Filter */}
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
  
          {/* Export Section */}
          <div className="mb-4 flex items-center gap-4">
            {selectedRows.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition flex items-center gap-2"
                >
                  📄 Export CSV ({selectedRows.length})
                </button>
                <button
                  onClick={handleExcelExport}
                  className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition flex items-center gap-2"
                >
                  📊 Export Excel ({selectedRows.length})
                </button>
              </div>
            )}
            
            {durationFilteredData.length > 0 && (
              <button
                onClick={() => {
                  setSelectedRows(durationFilteredData.map(item => item.call_sid));
                  setSelectAll(true);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded shadow hover:bg-purple-700 transition flex items-center gap-2"
              >
                ☑️ Select All Visible ({durationFilteredData.length})
              </button>
            )}
            
            {selectedRows.length > 0 && (
              <button
                onClick={() => {
                  setSelectedRows([]);
                  setSelectAll(false);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded shadow hover:bg-gray-600 transition flex items-center gap-2"
              >
                ❌ Clear Selection
              </button>
            )}
            
            <span className="text-sm text-gray-600">
              Showing {currentItems.length} of {durationFilteredData.length} conversations
            </span>
          </div>
  
          {/* Table */}
          <div className="overflow-x-auto w-full">
            <table className="min-w-full w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-b whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b whitespace-nowrap">Call SID</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b whitespace-nowrap">Application SID</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b whitespace-nowrap">Channel Type</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b whitespace-nowrap">From</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b whitespace-nowrap">To</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b whitespace-nowrap">Attempted At</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b whitespace-nowrap">Answered</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b whitespace-nowrap">Answered At</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b whitespace-nowrap">Terminated At</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b whitespace-nowrap">Duration</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b whitespace-nowrap">Date</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b whitespace-nowrap">Messages</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item) => {
                    const className = "py-3 px-4 border-b border-gray-200 hover:bg-gray-50";
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
                               item.channel_type === 'voice' ? 'bg-blue-100 text-blue-800' : 
                               item.channel_type === 'chat' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                             }`}>
                               {item.channel_type || 'N/A'}
                             </span>
                        </td>
                        <td className={`${className} text-sm`}>{item.summary?.from || item.from_number}</td>
                        <td className={`${className} text-sm`}>{item.summary?.to || item.to_number}</td>
                        <td className={`${className} text-sm`}>
                          {item.started_at ? new Date(item.started_at).toLocaleString() : "—"}
                        </td>
                        <td className={`${className} text-sm`}>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.answered ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
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
                Showing {durationFilteredData.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, durationFilteredData.length)} of {durationFilteredData.length} results
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
              
              {totalPages > 0 && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                  {/* Left side */}
                  <div className="flex-1 overflow-y-auto pr-4 border-r">
                    <h3 className="text-lg font-semibold mb-4">
                      Conversation: {selectedConversation?.call_sid}
                    </h3>
  
                    {/* Tabs */}
                    <div className="flex space-x-4 border-b mb-4">
                      {["Overview", "Transcription"].map((tab) => (
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
  
                    {/* Tab content */}
                    {activeTab === "Overview" && (
                      <div className="text-sm text-gray-700 space-y-4 p-4 bg-gray-50 rounded shadow">
                        {/* AI Summary Section */}
                        {selectedConversation?.summary && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                              🤖 AI Conversation Summary
                            </h4>
                            <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                              <p className="text-gray-700 leading-relaxed">
                                {selectedConversation.summary}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Generated using OpenAI GPT-3.5
                            </p>
                          </div>
                        )}
                        
                        {/* Metadata Section */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h4 className="font-semibold text-gray-800 mb-2">📊 Conversation Details</h4>
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500">
                              Call status: <span className="text-green-600 font-medium">{metadata.status}</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              Channel Type: <span className="text-blue-600 font-medium">{metadata.channelType}</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              Application SID: <span className="text-purple-600 font-medium">{metadata.applicationSid}</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              Messages: <span className="text-orange-600 font-medium">{selectedConversation?.message_log?.length || 0}</span>
                            </p>
                            {selectedConversation?.summary && (
                              <p className="text-xs text-gray-500">
                                Summary: <span className="text-green-600 font-medium">Available</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
  
                    {activeTab === "Transcription" && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-sm font-semibold">Conversation Messages</h4>
                          {selectedConversation?.message_log?.length > 0 && (
                            <button 
                              onClick={() => downloadTranscriptionAsPDF()}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                            >
                              📄 Download PDF
                            </button>
                          )}
                        </div>
                        <div ref={transcriptionRef} className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                          {selectedConversation?.message_log?.length ? (
                            selectedConversation.message_log.map((e, i) => {
                              const isUser = e.sender === "user";
                              const timestamp = e.timestamp
                                ? new Date(e.timestamp).toLocaleString()
                                : "—";
                              return (
                                <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
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
                  </div>
  
                  {/* Right metadata panel */}
                  <div className="w-64 flex-shrink-0 bg-gray-50 rounded p-4 shadow-inner overflow-y-auto h-full">
                    <h4 className="text-sm font-semibold mb-3">Metadata</h4>
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li><strong>Date:</strong> {metadata.date}</li>
                      <li><strong>Connection duration:</strong> {metadata.duration} Sec</li>
                      <li><strong>Call status:</strong> <span className="text-green-600 font-medium">{metadata.status}</span></li>
                      <li><strong>Channel Type:</strong> <span className="text-blue-600 font-medium">{metadata.channelType}</span></li>
                      <li><strong>Application SID:</strong> <span className="text-purple-600 font-medium">{metadata.applicationSid}</span></li>
                      <li><strong>Messages:</strong> <span className="text-orange-600 font-medium">{selectedConversation?.message_log?.length || 0}</span></li>
                      <li><strong>AI Summary:</strong> 
                        {selectedConversation?.summary ? (
                          <span className="text-green-600 font-medium">Available</span>
                        ) : (
                          <span className="text-gray-500 font-medium">Not Available</span>
                        )}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
    </AdminLayout>
  );
};

export default ConversationLogs;
