import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { 
  fetchChatsList, 
  fetchLeadMessages, 
  sendLeadMessage,
  fetchLeadProfile
} from '../features/leads/leadsThunks';
import { appendMessage } from '../features/leads/leadsSlice';
import Toast from '../components/Toast';

function Chats() {
  const dispatch = useDispatch();
  const chats = useSelector((state) => state.leads.chatsList);
  const messages = useSelector((state) => state.leads.currentLeadMessages);
  
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  const messagesEndRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const selectedLeadIdRef = useRef(selectedLeadId);

  // Keep the ref updated with the latest selected lead
  useEffect(() => {
    selectedLeadIdRef.current = selectedLeadId;
  }, [selectedLeadId]);

  // Initial load of chats
  useEffect(() => {
    dispatch(fetchChatsList());
  }, [dispatch]);

  // Establish real-time WebSockets connection
  useEffect(() => {
    const token = localStorage.getItem('crm_token');
    if (!token) return;

    // Connect to dedicated CRM Socket.IO server on port 4000
    const socket = io("http://localhost:4000", {
      query: { token }
    });

    socket.on("connect", () => {
      console.log("CRM Socket: Connected to WebSockets gateway successfully");
    });

    socket.on("crm_new_message", (message) => {
      console.log("CRM Socket: Received real-time message payload:", message);
      
      // 1. If this message belongs to the currently active conversation, append it directly
      if (selectedLeadIdRef.current && message.lead_id.toString() === selectedLeadIdRef.current.toString()) {
        dispatch(appendMessage(message));
      }
      
      // 2. Silently fetch the updated chats list to refresh sidebar snippets
      dispatch(fetchChatsList());
    });

    socket.on("disconnect", () => {
      console.log("CRM Socket: Disconnected from WebSockets gateway");
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  // Scroll to bottom when messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat messages when a lead is selected
  const handleSelectLead = async (leadId) => {
    setSelectedLeadId(leadId);
    setIsLoadingMessages(true);
    try {
      await Promise.all([
        dispatch(fetchLeadMessages(leadId)).unwrap(),
        dispatch(fetchLeadProfile(leadId)).unwrap()
      ]);
    } catch (err) {
      console.error("Failed to load chat details:", err);
      showToast(err || "Failed to retrieve conversation logs.");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedLeadId || isSending) return;
    
    setIsSending(true);
    try {
      // Unwrap the thunk to catch core offline/disconnected errors on QR engine
      await dispatch(sendLeadMessage({ id: selectedLeadId, message: chatInput })).unwrap();
      setChatInput('');
      
      // Immediately refresh chats list and history
      dispatch(fetchChatsList());
      dispatch(fetchLeadMessages(selectedLeadId));
    } catch (err) {
      console.error("WhatsApp delivery error:", err);
      showToast(err || "Message delivery failed. Ensure WhatsApp QR session is connected.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleAttachPlaceholder = () => {
    showToast("Media attachments are supported through your active EasyClient WhatsApp instance!");
  };

  // Filter chats list based on search query
  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.phone.includes(searchQuery)
  );

  const getSelectedLeadInfo = () => {
    return chats.find(c => c.id === selectedLeadId);
  };

  const selectedLead = getSelectedLeadInfo();

  // Helper to format timestamps cleanly
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const date = new Date(timeString);
    const now = new Date();
    
    // If today, show time. Otherwise, show date
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex h-full w-full overflow-hidden text-brand-text bg-brand-bg">
      
      {/* Left Column: Chats List */}
      <div className="w-full md:w-[380px] border-r border-brand-border flex flex-col bg-brand-card/25 shrink-0">
        
        {/* Inbox Header */}
        <header className="px-6 py-5 border-b border-brand-border bg-brand-card shrink-0 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight text-brand-text">Inbox</div>
          <span className="bg-brand-accent/25 text-brand-accent text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            {chats.length} Chats
          </span>
        </header>

        {/* Search Bar */}
        <div className="p-4 border-b border-brand-border shrink-0 bg-brand-card/10">
          <div className="relative flex items-center bg-brand-bg rounded-xl border border-brand-border focus-within:border-brand-accent transition-all duration-200">
            <svg 
              className="absolute left-4 w-4 h-4 text-brand-text-muted" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-brand-text pl-11 pr-4 py-3 rounded-xl focus:outline-none font-medium placeholder:text-brand-text-muted text-sm"
            />
          </div>
        </div>

        {/* Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-brand-text-muted text-sm font-medium">
              No chats found.
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isSelected = chat.id === selectedLeadId;
              const formattedTime = formatTime(chat.latest_message_time);
              
              return (
                <div 
                  key={chat.id}
                  onClick={() => handleSelectLead(chat.id)}
                  className={`flex gap-3.5 items-center px-5 py-3.5 border-b border-brand-border/30 cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'bg-brand-accent/10 border-l-4 border-brand-accent pl-[16px]' 
                      : 'hover:bg-brand-card/40 pl-5'
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-brand-accent/15 border border-brand-accent/20 flex items-center justify-center text-brand-accent text-sm font-extrabold uppercase shrink-0 shadow-sm">
                    {chat.name.charAt(0)}
                  </div>

                  {/* Meta Details */}
                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white text-sm truncate capitalize">{chat.name}</span>
                      <span className="text-[10px] text-brand-text-muted font-bold tracking-tight shrink-0">{formattedTime}</span>
                    </div>
                    
                    <div className="flex justify-between items-center gap-2 mt-1">
                      <span className="text-xs text-brand-text-muted truncate flex-1 font-medium">
                        {chat.latest_message_type === 'outgoing' && (
                          <span className="text-emerald-400 font-semibold mr-1">You:</span>
                        )}
                        {chat.latest_message || 'No messages yet'}
                      </span>
                      <span className="bg-[#25d366]/10 text-[#25d366] text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 border border-[#25d366]/20">
                        {chat.source}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Chat History Window */}
      <div className="flex-1 flex flex-col bg-brand-bg relative min-w-0 h-full">
        
        {selectedLead ? (
          <>
            {/* Chat Pane Header */}
            <header className="px-6 md:px-8 py-5 border-b border-brand-border bg-brand-card flex items-center justify-between shadow-sm z-10 h-[76px] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-[#25d366] rounded-full shadow-[0_0_8px_rgba(37,211,102,0.5)]"></div>
                <div className="flex flex-col">
                  <span className="font-bold text-brand-text text-lg tracking-tight capitalize">{selectedLead.name}</span>
                  <span className="text-xs text-brand-text-muted font-medium">{selectedLead.phone}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="bg-brand-accent/20 text-brand-accent text-xs px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider">
                  Stage: {selectedLead.stage_id.toUpperCase()}
                </span>
              </div>
            </header>

            {/* Chat Messages Body with WhatsApp Wallpaper background */}
            <div 
              className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col gap-6 scrollbar-hide bg-[url('https://i.ibb.co/3s1f9b3/bg-chat.png')] bg-repeat opacity-95" 
              style={{ backgroundSize: '400px' }}
            >
              {isLoadingMessages ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin shadow-lg"></div>
                  <span className="text-sm font-bold text-brand-text-muted animate-pulse tracking-wide">Syncing WhatsApp Conversation...</span>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => {
                    const isOutgoing = msg.type === 'outgoing';
                    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    if (isOutgoing) {
                      return (
                        <div key={msg.id || index} className="self-end max-w-[75%]">
                          <div className="bg-[#075e54] p-4 rounded-2xl rounded-tr-none shadow-card border border-[#128c7e]/30">
                            <p className="m-0 leading-relaxed text-[15px] text-white font-medium break-all whitespace-pre-wrap">{msg.message}</p>
                            <div className="text-[10px] text-white/60 mt-2 text-right font-bold uppercase tracking-widest flex items-center justify-end gap-1">
                              {time}
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={msg.id || index} className="self-start max-w-[75%]">
                          <div className="bg-brand-card p-4 rounded-2xl rounded-tl-none border border-brand-border shadow-card">
                            <p className="m-0 leading-relaxed text-[15px] text-brand-text font-medium break-all whitespace-pre-wrap">{msg.message}</p>
                            <div className="text-[10px] text-brand-text-muted mt-2 text-right font-bold uppercase tracking-widest">{time}</div>
                          </div>
                        </div>
                      );
                    }
                  })}

                  {messages.length === 0 && (
                    <div className="text-center text-brand-text-muted text-sm font-medium mt-10">
                      No messages found for this lead.
                    </div>
                  )}
                </>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Send Input Box */}
            <div className="p-4 md:p-6 bg-brand-card border-t border-brand-border shadow-lg shrink-0">
              <div className="flex gap-4 items-center max-w-4xl mx-auto bg-brand-bg p-2 rounded-2xl border border-brand-border focus-within:ring-2 focus-within:ring-brand-accent/20 transition-all duration-200">
                <button 
                  onClick={handleAttachPlaceholder}
                  className="p-2.5 text-brand-text-muted hover:text-brand-accent transition-colors shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                </button>
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSending || isLoadingMessages}
                  placeholder={isSending ? "Sending message..." : isLoadingMessages ? "Please wait..." : `Reply to ${selectedLead.name}...`} 
                  className="flex-1 bg-transparent border-none text-brand-text px-2 py-2 focus:outline-none font-medium placeholder:text-brand-text-muted min-w-0 disabled:opacity-60" 
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isSending || !chatInput.trim() || isLoadingMessages}
                  className="bg-brand-accent text-white p-3 rounded-xl hover:bg-brand-accent-hover transition-all hover:scale-105 shadow-md shadow-brand-accent/20 shrink-0 disabled:opacity-50 disabled:scale-100 disabled:hover:bg-brand-accent"
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State Dashboard View */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-brand-bg/50">
            <div className="w-20 h-20 bg-brand-accent/10 border border-brand-accent/20 rounded-3xl flex items-center justify-center text-brand-accent mb-6 shadow-soft animate-bounce duration-1000">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-brand-text mb-2 tracking-tight">Your CRM WhatsApp Inbox</h3>
            <p className="text-brand-text-muted text-[15px] max-w-md leading-relaxed font-medium">
              Select an active WhatsApp conversation from the left inbox panel to review full history and send real-time replies.
            </p>
          </div>
        )}
      </div>
      <Toast message={toast} position="top-right" onClose={() => setToast(null)} />
    </div>
  );
}

export default Chats;
