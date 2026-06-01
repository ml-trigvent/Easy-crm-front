import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchStages } from '../features/stages/stagesThunks';
import { fetchLeadProfile, fetchLeadMessages, sendLeadMessage, updateLeadStageAsync } from '../features/leads/leadsThunks';

function LeadProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const lead = useSelector((state) => state.leads.currentLead);
  const messages = useSelector((state) => state.leads.currentLeadMessages);
  const stages = useSelector((state) => state.stages.stages);
  const messagesEndRef = useRef(null);

  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    // Initial fetch
    dispatch(fetchStages());
    dispatch(fetchLeadProfile(id));
    dispatch(fetchLeadMessages(id));

    // Set up polling every 10 seconds
    const intervalId = setInterval(() => {
      dispatch(fetchLeadProfile(id));
      dispatch(fetchLeadMessages(id));
    }, 10000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [id, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    dispatch(sendLeadMessage({ id, message: chatInput }));
    setChatInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleStageChange = (e) => {
    const newStageId = e.target.value;
    dispatch(updateLeadStageAsync({ leadId: lead.id, stageId: newStageId }));
  };

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-full text-brand-text">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden text-brand-text bg-brand-bg">
      <header className="min-h-[76px] md:h-[76px] py-4 md:py-0 px-4 md:px-8 flex items-center gap-4 md:gap-6 border-b border-brand-border bg-brand-card z-10 shrink-0">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-brand-bg rounded-lg transition-colors text-brand-text-muted"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div className="text-xl font-bold tracking-tight text-brand-text">Lead Profile</div>
      </header>

      <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row">
        {/* Left Column - Info */}
        <div className="w-full md:w-[380px] border-b md:border-b-0 md:border-r border-brand-border h-auto md:h-full md:overflow-y-auto p-4 md:p-8 scrollbar-hide bg-brand-card/30 shrink-0">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent text-2xl font-bold uppercase shrink-0">
                {lead.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="m-0 text-xl font-bold text-brand-text tracking-tight capitalize truncate" title={lead.name}>{lead.name}</h2>
                <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-brand-text-muted">
                  <span className="bg-[#25d366]/20 text-[#25d366] px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide">{lead.source}</span>
                  Lead #{lead.id}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-brand-card p-5 rounded-2xl border border-brand-border shadow-soft">
                <div className="text-xs text-brand-text-muted mb-3 uppercase tracking-wider font-bold">Contact Info</div>
                <div className="mb-4">
                  <div className="text-brand-text-muted text-[13px] mb-1 font-medium">Phone Number</div>
                  <div className="text-[17px] font-semibold text-brand-text">{lead.phone}</div>
                </div>
                <div>
                  <div className="text-brand-text-muted text-[13px] mb-1 font-medium">Email Address</div>
                  <div className="text-[15px] font-medium text-brand-text">{lead.email || 'Not provided'}</div>
                </div>
              </div>

              <div className="bg-brand-card p-5 rounded-2xl border border-brand-border shadow-soft">
                <div className="text-xs text-brand-text-muted mb-4 uppercase tracking-wider font-bold">Deal Details</div>
                
                <div className="mb-4">
                  <div className="text-brand-text-muted text-[13px] mb-1.5 font-medium">Deal Value</div>
                  <div className="text-xl font-bold text-emerald-400">
                    ${lead.deal?.value || '0.00'}
                  </div>
                </div>

                <div>
                  <div className="text-brand-text-muted text-[13px] mb-2 font-medium">Current Stage</div>
                  <div className="relative">
                    <select
                      value={lead.stage_id}
                      onChange={handleStageChange}
                      className="w-full bg-brand-bg px-4 py-2.5 pr-10 rounded-xl border border-brand-border text-sm font-bold text-brand-text appearance-none cursor-pointer focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 transition-all uppercase"
                    >
                      {stages.map((stage) => (
                        <option key={stage.id} value={stage.id} className="bg-brand-card text-brand-text">
                          {stage.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-text-muted">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column - WhatsApp Chat UI Box */}
        <div className="flex-1 flex flex-col bg-brand-bg relative min-w-0 min-h-[500px] md:min-h-0">
          
          {/* Chat Header */}
          <div className="px-4 md:px-8 py-5 border-b border-brand-border bg-brand-card flex items-center gap-3 shadow-sm z-10 h-[76px] shrink-0">
            <div className="w-2.5 h-2.5 bg-[#25d366] rounded-full shadow-[0_0_8px_rgba(37,211,102,0.5)]"></div>
            <span className="font-bold text-brand-text text-lg tracking-tight">WhatsApp Conversation</span>
          </div>

          {/* Chat Body */}
          <div className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col gap-6 scrollbar-hide bg-[url('https://i.ibb.co/3s1f9b3/bg-chat.png')] bg-repeat opacity-90" style={{ backgroundSize: '400px' }}>
            
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
            
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 md:p-6 bg-brand-card border-t border-brand-border shadow-lg shrink-0">
            <div className="flex gap-4 items-center max-w-4xl mx-auto bg-brand-bg p-2 rounded-2xl border border-brand-border">
              <button className="p-2.5 text-brand-text-muted hover:text-brand-accent transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              </button>
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..." 
                className="flex-1 bg-transparent border-none text-brand-text px-2 py-2 focus:outline-none font-medium placeholder:text-brand-text-muted min-w-0" 
              />
              <button 
                onClick={handleSendMessage}
                className="bg-brand-accent text-white p-3 rounded-xl hover:bg-brand-accent-hover transition-all hover:scale-105 shadow-md shadow-brand-accent/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeadProfile;
