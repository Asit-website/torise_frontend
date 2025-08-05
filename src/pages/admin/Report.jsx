import React, { useEffect, useState,useRef } from 'react';
import api from '../../services/admin/api';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { useAuth } from '../../contexts/AuthContext';

const Report = () => {

    const [conversationData, setConversationData] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState(null);
  
    const [selectedDate, setSelectedDate] = useState("");
    const [filteredData, setFilteredData] = useState(conversationData);
  
    const [durationFilter, setDurationFilter] = useState("");
  
    const [selectedRows, setSelectedRows] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
  
    const [activeTab, setActiveTab] = useState("Overview");
  
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
  
    const transcriptionRef = useRef();
  
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/conver`);
          const data = await res.json();
          setConversationData(data);
        } catch (err) {
          console.error("Failed to fetch conversations", err);
        }
      };
  
      fetchData();
    }, []);
  
  
    // useEffect(() => {
    //   if (selectedDate) {
    //     const filtered = conversationData.filter(({ createdAt }) => {
    //       const created = new Date(createdAt).toLocaleDateString();
    //       const selected = new Date(selectedDate).toLocaleDateString();
    //       return created === selected;
    //     });
    //     setFilteredData(filtered);
    //   } else {
    //     setFilteredData(conversationData);
    //   }
    // }, [selectedDate, conversationData]);
  
    useEffect(() => {
      if (fromDate && toDate) {
        const start = new Date(fromDate);
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999); // Include the entire "toDate"
  
        const filtered = conversationData.filter(({ createdAt }) => {
          const created = new Date(createdAt);
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
  
  
    // ===========excel download========
  
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
  
    const exportSelectedRows = () => {
      const selectedData = filteredData.filter(row => selectedRows.includes(row.call_sid));
      const exportData = selectedData.map(row => ({
        "Call SID": row.call_sid,
        "Conversation ID": row.conversation_id,
        "Attempted At": new Date(row.summary?.attempted_at).toLocaleString(),
        "Answered": row.summary?.answered ? "true" : "false",
        "Answered At": new Date(row.summary?.answered_at).toLocaleString(),
        "Terminated At": new Date(row.summary?.terminated_at).toLocaleString(),
        "Duration": `${row.summary?.duration} Sec`,
        "From": row.summary?.from,
        "To": row.summary?.to,
        "Date": new Date(row.createdAt).toLocaleDateString()
      }));
  
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Conversations");
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const file = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(file, "conversation-report.xlsx");
    };
  
    // Metadata values derived from selectedConversation
    console.log(selectedConversation);
    const metadata = {
      date: new Date(selectedConversation?.events[0].
        createdAt).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
  
        }),
      duration: selectedConversation?.summary?.duration
        ? `${Math.floor(selectedConversation?.summary?.duration / 60)}:${String(
          selectedConversation?.summary?.duration % 60
        ).padStart(2, "0")}`
        : "—",
      cost: `${selectedConversation?.cost || 0} credits`,
      price: selectedConversation?.price
        ? `$${selectedConversation.price.toFixed(2)}`
        : "—",
      status: "Successful", // Optional, can be dynamic too
    };
  
  
    const handleDownloadPDF = async () => {
      const input = transcriptionRef.current;
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
  
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("conversation-transcription.pdf");
    };
  
    const validDates = conversationData
      .map(item => new Date(item.createdAt))
      .filter(date => !isNaN(date));
  
    const maxDate = validDates.length
      ? new Date(Math.max(...validDates)).toISOString().split("T")[0]
      : "";

      const navigate = useNavigate();

      return (
        <AdminLayout>
        <div className="mt-12 mb-8 flex flex-col gap-12 max-w-full">
          <div className="bg-white rounded-lg shadow-md max-w-full">
            <h1 className="mb-8 p-6 text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-500 text-white rounded-t-lg flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="mr-3 text-blue-200 hover:text-white focus:outline-none"
                title="Go Back"
                style={{ fontSize: '1.5rem', lineHeight: 1 }}
              >
                ←
              </button>
                Reports table
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
    
                {selectedRows.length > 0 && (
                  <button
                    onClick={exportSelectedRows}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
                  >
                    Download Selected ({selectedRows.length})
                  </button>
                )}
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
                      <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Conversation ID</th>
                      <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Attempted At</th>
                      <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Answered</th>
                      <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Answered At</th>
                      <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Terminated At</th>
                      <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Duration</th>
                      <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Calling Number</th>
                      <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">IVR Number</th>
                      <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Date</th>
                      <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Messages</th>
                      <th className="py-3 px-4 text-sm font-semibold text-gray-700 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData
                    .filter((item) => {
                      if (!durationFilter) return true;
                      const duration = item?.summary?.duration?.toString() || "";
                      return duration === durationFilter;
                    })
                    .map(({ audio_url, call_sid, conversation_id, createdAt, summary, events }) => {
                        const className = `py-3 px-4 border-b border-gray-200 hover:bg-gray-50`;
                      const isChecked = selectedRows.includes(call_sid);
    
                      return (
                          <tr key={call_sid} className="hover:bg-gray-50">
                          <td className={className}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                    setSelectedRows((prev) => prev.filter((id) => id !== call_sid));
                                } else {
                                    setSelectedRows((prev) => [...prev, call_sid]);
                                }
                              }}
                                className="rounded"
                            />
                          </td>
                            <td className={`${className} text-sm`}>{call_sid}</td>
                            <td className={`${className} text-sm`}>{conversation_id}</td>
                            <td className={`${className} text-sm`}>
                            {summary?.attempted_at ? new Date(summary.attempted_at).toLocaleString() : "—"}
                          </td>
                            <td className={`${className} text-sm`}>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  summary?.answered ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}
                              >
                                {summary?.answered ? "Yes" : "No"}
                              </span>
                            </td>
                            <td className={`${className} text-sm`}>
                            {summary?.answered_at ? new Date(summary.answered_at).toLocaleString() : "—"}
                          </td>
                            <td className={`${className} text-sm`}>
                            {summary?.terminated_at ? new Date(summary.terminated_at).toLocaleString() : "—"}
                          </td>
                            <td className={`${className} text-sm font-medium`}>
                              {summary?.duration} Sec
                            </td>
                            <td className={`${className} text-sm`}>{summary?.from}</td>
                            <td className={`${className} text-sm`}>{summary?.to}</td>
                            <td className={`${className} text-sm`}>
                            {createdAt ? new Date(createdAt).toLocaleDateString() : "—"}
                          </td>
                            <td className={`${className} text-sm font-medium`}>
                            {events?.length - 1}
                          </td>
                          <td className={className}>
                            <button
                              onClick={() => handleOpen({ audio_url, call_sid, events, summary })}
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
                        </div>
                      )}
    
                      {activeTab === "Transcription" && (
                        <>
                          <button
                            onClick={handleDownloadPDF}
                            className="ml-auto mb-2 px-4 py-2 bg-blue-600 text-white text-sm rounded shadow hover:bg-blue-700 transition"
                          >
                            Download PDF
                          </button>
                            <div
                              ref={transcriptionRef}
                              className="space-y-4 max-h-[420px] overflow-y-auto pr-2"
                            >
                            {selectedConversation?.events?.length ? (
                              selectedConversation.events
                                  .filter(
                                    (e) => e.type === "agent_response" || e.type === "user_transcript"
                                  )
                                .map((e, i) => {
                                  const isUser = e.type === "user_transcript";
                                  const message = isUser ? e.user_transcript : e.agent_response;
                                    const timestamp = e.createdAt
                                      ? new Date(e.createdAt).toLocaleString()
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
                                          {message}
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
                        </>
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
                          <strong>Call status:</strong>{" "}
                          <span className="text-green-600 font-medium">{metadata.status}</span>
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

export default Report; 