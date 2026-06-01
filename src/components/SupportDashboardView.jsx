import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import { API_URLS } from "../services/apiUrls";
import Toast from "./Toast";

/* Helper: human readable duration ago */
const fmtAgo = (ts) => {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const AVATAR_COLORS = [
  "bg-indigo-500", "bg-violet-500", "bg-sky-500",
  "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-pink-500", "bg-teal-500"
];

const avatarColor = (n) => {
  const str = typeof n === "string" ? n : String(n || "");
  let s = 0;
  for (const c of str) s += c.charCodeAt(0);
  return AVATAR_COLORS[s % AVATAR_COLORS.length];
};

const initial = (n) => {
  const str = typeof n === "string" ? n : String(n || "?");
  return str.charAt(0).toUpperCase();
};

const PRIORITY_BADGE = {
  Low: "bg-slate-600/60  text-slate-200  border border-slate-500/40",
  Medium: "bg-blue-600/40   text-blue-200   border border-blue-500/40",
  High: "bg-amber-600/50  text-amber-100  border border-amber-500/40",
  Urgent: "bg-rose-600/60   text-rose-100   border border-rose-500/50",
};

const STATUS_DOT = {
  "Open": { dot: "bg-sky-400", text: "text-sky-300" },
  "In Progress": { dot: "bg-amber-400", text: "text-amber-300" },
  "Resolved": { dot: "bg-emerald-400", text: "text-emerald-300" },
  "Closed": { dot: "bg-slate-400", text: "text-slate-300" },
};

/* ─── TICKET DRAWER ─── */
function TicketDrawer({ ticket, agents, history = [], onClose, onUpdate, onComment, saving, currentUser }) {
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [activeTab, setActiveTab] = useState("notes");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatReply, setChatReply] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const messagesEndRef = React.useRef(null);

  if (!ticket) return null;

  const pb = PRIORITY_BADGE[ticket.priority] || PRIORITY_BADGE.Medium;
  const isAgent = currentUser?.role === 'agent' || currentUser?.role === 'support';
  const isAssignedToMe = ticket.assigned_agent_id === currentUser?.agent_uid;
  const isUnassigned = !ticket.assigned_agent_id;
  const canUpdate = !isAgent || isAssignedToMe || isUnassigned;

  const submit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    onComment(comment, () => setComment(""));
  };

  const fetchChatMessages = async () => {
    if (!ticket?.lead_id) return;
    setChatLoading(true);
    try {
      const r = await apiClient.get(API_URLS.leads.messages(ticket.lead_id));
      if (r.data.success) {
        setChatMessages(r.data.data);
      }
    } catch (e) {
      console.error("Failed to load chat messages", e);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "chat") {
      fetchChatMessages();
    }
  }, [activeTab, ticket?.lead_id]);

  useEffect(() => {
    if (activeTab === "chat" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  const handleSendWhatsApp = async (e) => {
    e.preventDefault();
    if (!chatReply.trim() || !ticket?.lead_id) return;
    const msgText = chatReply;
    setChatReply("");
    try {
      const r = await apiClient.post(API_URLS.leads.messages(ticket.lead_id), { message: msgText });
      if (r.data.success) {
        const newMsg = r.data.data || {
          id: Date.now(),
          lead_id: ticket.lead_id,
          message: msgText,
          type: "outgoing",
          created_at: new Date().toISOString()
        };
        setChatMessages((prev) => [...prev, newMsg]);
        fetchChatMessages();
      }
    } catch (e) {
      console.error("Failed to send WhatsApp message", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/60 backdrop-blur-sm" />
      <div
        className="w-full max-w-[520px] bg-[#0f172a] border-l border-slate-700/60 flex flex-col h-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-start justify-between gap-4 bg-slate-800/60">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded">
                #{ticket.id}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider ${pb}`}>
                {ticket.priority}
              </span>
              {saving && <span className="text-[10px] text-slate-500 animate-pulse">Saving...</span>}
            </div>
            <h2 className="text-[15px] font-bold text-white leading-snug">{ticket.subject}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lead profile */}
        <div className="px-6 py-3 border-b border-slate-700/40 flex items-center justify-between gap-3 bg-slate-900/20">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColor(ticket.lead_name)}`}>
              {initial(ticket.lead_name)}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white leading-none">{ticket.lead_name || "Unknown"}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{ticket.lead_phone || "—"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/chats")}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all"
            >
              Chat
            </button>
            <button
              onClick={() => navigate(`/lead/${ticket.lead_id}`)}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
            >
              Profile
            </button>
          </div>
        </div>

        {/* Selectors */}
        {isAgent && (
          <div className="px-6 py-3 border-b border-slate-700/40 flex flex-wrap gap-3 items-center">
            {[
              { label: "Status", field: "status", val: ticket.status, opts: ["Open", "In Progress", "Resolved", "Closed"] },
              { label: "Priority", field: "priority", val: ticket.priority, opts: ["Low", "Medium", "High", "Urgent"] },
            ].map(({ label, field, val, opts }) => (
              <div key={field} className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
                <select
                  value={val}
                  onChange={(e) => onUpdate(field, e.target.value)}
                  disabled={saving || !canUpdate}
                  className="bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 disabled:opacity-50 cursor-pointer"
                >
                  {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Agent</span>
              <select
                value={ticket.assigned_agent_id || ""}
                onChange={(e) => onUpdate("assigned_agent_id", e.target.value)}
                disabled={saving || isAgent}
                className="bg-slate-800 border border-slate-700 text-slate-100 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 disabled:opacity-50 cursor-pointer"
              >
                <option value="">Unassigned</option>
                {agents.map((a) => <option key={a.uid} value={a.uid}>{a.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* tabs switcher */}
        <div className="px-6 border-b border-slate-700/40 flex bg-slate-900/10 shrink-0">
          <button
            onClick={() => setActiveTab("notes")}
            className={`py-3 px-4 font-semibold text-xs border-b-2 tracking-wider uppercase transition-all ${activeTab === "notes"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
          >
            Internal Notes
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`py-3 px-4 font-semibold text-xs border-b-2 tracking-wider uppercase transition-all flex items-center gap-1.5 ${activeTab === "chat"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.82 11.82 0 0020.885 3.488" />
            </svg>
            WhatsApp Chat
          </button>
        </div>

        {activeTab === "notes" ? (
          /* Scroll body */
          <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-5 flex flex-col gap-5">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Description</p>
              <p className="text-[13px] text-slate-300 leading-relaxed bg-slate-800/50 border border-slate-700/40 rounded-xl px-4 py-3 whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            {/* History Timeline */}
            <div className="border-t border-slate-700/40 pt-4 flex flex-col gap-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Activity & Comments ({history.length})
              </p>
              {history.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No activity or comments yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {history.map((item) => {
                    const isComment = !!item.comment;
                    const itemDate = new Date(item.created_at).toLocaleString();

                    if (isComment) {
                      return (
                        <div key={item.id} className="flex gap-2.5 items-start bg-slate-800/30 border border-slate-700/30 rounded-xl p-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${avatarColor(item.agent_name)}`}>
                            {initial(item.agent_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[12px] font-semibold text-slate-200">
                                {item.agent_name || "System"}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {fmtAgo(item.created_at)}
                              </span>
                            </div>
                            <p className="text-[13px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {item.comment}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 bg-slate-900/40 border border-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                          <span className="text-[11px] text-slate-400 font-medium">
                            {item.action}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            by <span className="font-semibold text-slate-400">{item.agent_name || "System"}</span>
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {fmtAgo(item.created_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add conversational note */}
            <div className="border-t border-slate-700/40 pt-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Add Conversation Note</p>
              <form onSubmit={submit} className="flex flex-col gap-2">
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={!canUpdate}
                  placeholder={canUpdate ? "Write an internal note or reply update..." : "You must be the assigned agent to add notes."}
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-[13px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving || !canUpdate || !comment.trim()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Add Note"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* WhatsApp Chat */
          <>
            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-5 flex flex-col gap-4 bg-[#0f172a]/40">
              {chatLoading && chatMessages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-10">
                  <span className="text-xs text-slate-500 animate-pulse">Loading conversation...</span>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
                  <svg className="w-10 h-10 opacity-30 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.82 11.82 0 0020.885 3.488" />
                  </svg>
                  <span className="text-xs text-slate-400">No WhatsApp messages synced yet</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {chatMessages.map((msg) => {
                    const isOutgoing = msg.type === "outgoing";
                    const msgDate = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={msg.id} className={`flex flex-col ${isOutgoing ? "items-end" : "items-start"}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm transition-all hover:scale-[1.01] ${isOutgoing
                              ? "bg-emerald-600 text-white rounded-tr-none"
                              : "bg-slate-800 text-slate-100 border border-slate-700/40 rounded-tl-none"
                            }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                          <span className={`block text-[9px] mt-1 text-right ${isOutgoing ? "text-emerald-200" : "text-slate-400"}`}>
                            {msgDate}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* WhatsApp chat input */}
            <div className="p-4 border-t border-slate-700/40 bg-[#1e293b]/30">
              <form onSubmit={handleSendWhatsApp} className="flex gap-2">
                <input
                  type="text"
                  value={chatReply}
                  onChange={(e) => setChatReply(e.target.value)}
                  disabled={!canUpdate}
                  placeholder={canUpdate ? "Type a WhatsApp reply..." : "You must be the assigned agent to reply."}
                  className="flex-1 bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={!canUpdate || !chatReply.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN SUPPORT DASHBOARD VIEW ─── */
export default function SupportDashboardView({ user }) {
  const [data, setData] = useState({
    metrics: { openTickets: 0, myTickets: 0, urgentTickets: 0, unassignedTickets: 0 },
    myTicketsList: [],
    unassignedTicketsList: [],
    recentSupportActivity: []
  });
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* Side Drawer States */
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get(API_URLS.dashboard);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch support dashboard statistics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadTicketHistory = async (id) => {
    try {
      const r = await apiClient.get(API_URLS.tickets.history(id));
      if (r.data.success) setHistory(r.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAgentsList = async () => {
    try {
      const r = await apiClient.get(API_URLS.agents.list);
      if (r.data.success) setAgents(r.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchAgentsList();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  /* Claim Unassigned Ticket */
  const handleClaimTicket = async (e, ticketId) => {
    e.stopPropagation();
    try {
      setSaving(true);
      await apiClient.put(API_URLS.tickets.update(ticketId), {
        assigned_agent_id: user.agent_uid || user.uid,
        assigned_agent_name: user.name
      });
      await fetchDashboardData();
      showToast("Ticket claimed successfully!");
    } catch (e) {
      console.error("Failed to self-assign ticket:", e);
    } finally {
      setSaving(false);
    }
  };

  /* Open Side Drawer */
  const handleOpenTicket = (ticket) => {
    setSelectedTicket(ticket);
    setHistory([]);
    loadTicketHistory(ticket.id);
  };

  /* Drawer Update field */
  const handleUpdateField = async (field, value) => {
    if (!selectedTicket) return;
    setSaving(true);
    try {
      let body = {};
      if (field === "assigned_agent_id") {
        const ag = agents.find((a) => a.uid === value);
        body = { assigned_agent_id: value || null, assigned_agent_name: ag?.name || null };
      } else {
        body = { [field]: value };
      }
      const r = await apiClient.put(API_URLS.tickets.update(selectedTicket.id), body);
      if (r.data.success) {
        await fetchDashboardData();
        const wasUnassigned = !selectedTicket.assigned_agent_id;
        const updatedTicket = { ...selectedTicket, ...body, ...r.data.data };
        const nowAssigned = !!updatedTicket.assigned_agent_id;
        setSelectedTicket(updatedTicket);
        await loadTicketHistory(selectedTicket.id);

        if (wasUnassigned && nowAssigned) {
          showToast(`Ticket claimed and status updated to "${updatedTicket.status}"!`);
        } else if (field === "status") {
          showToast(`Status updated to "${value}" successfully!`);
        } else if (field === "priority") {
          showToast(`Priority updated to "${value}" successfully!`);
        } else if (field === "assigned_agent_id") {
          const ag = agents.find((a) => a.uid === value);
          showToast(ag ? `Assigned to ${ag.name} successfully!` : "Ticket unassigned successfully!");
        } else {
          showToast("Ticket updated successfully!");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  /* Drawer Add Comment */
  const handleAddComment = async (comment, cb) => {
    if (!selectedTicket) return;
    setSaving(true);
    try {
      const r = await apiClient.post(API_URLS.tickets.comments(selectedTicket.id), { comment });
      if (r.data.success) {
        setHistory(r.data.data);
        cb?.();
        await fetchDashboardData();
        showToast("Internal note added successfully!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-300 bg-[#0b1120]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const { metrics, myTicketsList, unassignedTicketsList, recentSupportActivity } = data;

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide text-slate-100 bg-[#0b1120] p-4 md:p-8 gap-6">

      {/* 1. Header Row */}
      <div className="bg-[#141c2f] border border-slate-700/50 rounded-2xl py-3 px-5 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md shadow-xl shrink-0 hover:border-slate-700 transition-all">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 shadow-inner shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white m-0">Welcome Back, {user?.name || "Support Specialist"}</h1>
            <p className="text-xs text-slate-400 mt-0.5 m-0">Support Center Workspace · Customer requests status queue.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={handleRefresh}
            className={`p-2 bg-[#0b1120] hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-400 hover:text-white transition-all ${refreshing ? "animate-spin" : ""}`}
            title="Refresh statistics"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>
          <div className="bg-[#0b1120] border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
            Support Center Active
          </div>
        </div>
      </div>

      {/* 2. Top support KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Open Support Queue", value: metrics.openTickets, color: "bg-sky-500", shadow: "shadow-sky-500/10" },
          { label: "My Assigned Active", value: metrics.myTickets, color: "bg-indigo-500", shadow: "shadow-indigo-500/10" },
          { label: "Urgent SLAs", value: metrics.urgentTickets, color: "bg-rose-500", shadow: "shadow-rose-500/10", attention: metrics.urgentTickets > 0 },
          { label: "Unassigned Queue", value: metrics.unassignedTickets, color: "bg-amber-500", shadow: "shadow-amber-500/10" }
        ].map(({ label, value, color, shadow, attention }) => (
          <div
            key={label}
            className={`bg-[#141c2f] border rounded-2xl p-5 flex flex-col justify-between h-[120px] relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${shadow} ${attention ? "border-rose-500/60" : "border-slate-700/50 hover:border-slate-700"
              }`}
          >
            <div className={`absolute top-0 left-0 h-full w-1.5 ${color}`}></div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
            <span className={`text-4xl font-extrabold tracking-tight ${attention ? "text-rose-400" : "text-white"}`}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* 3. Center Section: Personal Active Queue & Unassigned Claims */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Column: My Tickets */}
        <div className="bg-[#141c2f] border border-slate-700/50 rounded-2xl p-5 shadow-xl flex flex-col h-[400px] overflow-hidden hover:border-slate-700 transition-all">
          <div className="flex justify-between items-center mb-5 shrink-0">
            <h2 className="text-base font-bold text-white flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              My Active Support Queue ({myTicketsList.length})
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-hide">
            {myTicketsList.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
                <svg className="w-8 h-8 opacity-40 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                No active tickets assigned to you currently.
              </div>
            ) : (
              myTicketsList.map(ticket => {
                const pb = PRIORITY_BADGE[ticket.priority] || PRIORITY_BADGE.Medium;
                const sd = STATUS_DOT[ticket.status] || STATUS_DOT["Open"];
                return (
                  <div
                    key={ticket.id}
                    onClick={() => handleOpenTicket(ticket)}
                    className="flex items-center justify-between p-3.5 bg-[#0b1120]/50 border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-[#0b1120]/75 cursor-pointer transition-all"
                  >
                    <div className="flex flex-col gap-1 min-w-0 pr-3">
                      <span className="text-[13px] font-semibold text-white truncate">{ticket.subject}</span>
                      <span className="text-[11px] text-slate-500">
                        Customer: <span className="font-semibold text-slate-400">{ticket.lead_name || "Unknown"}</span> · {fmtAgo(ticket.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${pb}`}>
                        {ticket.priority}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${sd.dot}`} />
                        <span className={`text-[11px] font-semibold ${sd.text}`}>{ticket.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Unassigned Ticket Queue */}
        <div className="bg-[#141c2f] border border-slate-700/50 rounded-2xl p-5 shadow-xl flex flex-col h-[400px] overflow-hidden hover:border-slate-700 transition-all">
          <div className="flex justify-between items-center mb-5 shrink-0">
            <h2 className="text-base font-bold text-white flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Unclaimed Support Tickets ({unassignedTicketsList.length})
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-hide">
            {unassignedTicketsList.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
                <svg className="w-8 h-8 opacity-40 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                Excellent! All support tickets are claimed.
              </div>
            ) : (
              unassignedTicketsList.map(ticket => {
                const pb = PRIORITY_BADGE[ticket.priority] || PRIORITY_BADGE.Medium;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => handleOpenTicket(ticket)}
                    className="flex items-center justify-between p-3.5 bg-[#0b1120]/50 border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-[#0b1120]/75 cursor-pointer transition-all"
                  >
                    <div className="flex flex-col gap-1 min-w-0 pr-3">
                      <span className="text-[13px] font-semibold text-white truncate">{ticket.subject}</span>
                      <span className="text-[11px] text-slate-500">
                        Customer: <span className="font-semibold text-slate-400">{ticket.lead_name || "Unknown"}</span> · {fmtAgo(ticket.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${pb}`}>
                        {ticket.priority}
                      </span>
                      <button
                        onClick={(e) => handleClaimTicket(e, ticket.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-md transition-all hover:scale-[1.02]"
                      >
                        Claim Ticket
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* 4. Bottom Row: Recent Timeline / Support Audit logs */}
      <div className="bg-[#141c2f] border border-slate-700/50 rounded-2xl p-5 shadow-xl flex flex-col h-[320px] overflow-hidden hover:border-slate-700 transition-all shrink-0">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-base font-bold text-white flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Support Activity timeline ({recentSupportActivity.length})
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-hide">
          {recentSupportActivity.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 italic">No recent log activities.</div>
          ) : (
            recentSupportActivity.map((log) => {
              const isComment = !!log.comment;
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-3 p-3 bg-[#0b1120]/40 border border-slate-800 rounded-lg hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isComment ? "bg-indigo-400" : "bg-slate-500"}`} />
                    <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-slate-300">
                      <span className="font-semibold text-white">{log.agent_name || "System"}</span>
                      <span className="text-slate-500">
                        {isComment ? "added internal note" : log.action}
                      </span>
                      <span className="text-slate-500">on</span>
                      <span className="text-indigo-400 font-semibold truncate max-w-[200px]">
                        "{log.ticket_subject}"
                      </span>
                      {isComment && (
                        <span className="text-slate-400 italic truncate max-w-[250px] bg-slate-900/60 px-2 py-0.5 rounded ml-1">
                          "{log.comment}"
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">{fmtAgo(log.created_at)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. Ticket Drawer Overlay */}
      {selectedTicket && (
        <TicketDrawer
          ticket={selectedTicket}
          agents={agents}
          history={history}
          onClose={() => setSelectedTicket(null)}
          onUpdate={handleUpdateField}
          onComment={handleAddComment}
          saving={saving}
          currentUser={user}
        />
      )}

      {/* Sleek Floating Glassmorphic Toast/Tooltip */}
      <Toast message={toast} position="top-center" onClose={() => setToast(null)} />

    </div>
  );
}
