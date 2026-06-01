import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import { API_URLS } from "../services/apiUrls";
import { fetchAllLeads } from "../features/leads/leadsThunks";
import NiceTooltip from "../components/NiceTooltip";
import Toast from "../components/Toast";

/* ─── helpers ─── */
const fmtAgo = (ts) => {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const AVATAR_COLORS = [
  "bg-indigo-500", "bg-violet-500", "bg-sky-500",
  "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-pink-500", "bg-teal-500",
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

/* ─── priority badge ─── */
const PRIORITY_BADGE = {
  Low: "bg-slate-600/60  text-slate-200  border border-slate-500/40",
  Medium: "bg-blue-600/40   text-blue-200   border border-blue-500/40",
  High: "bg-amber-600/50  text-amber-100  border border-amber-500/40",
  Urgent: "bg-rose-600/60   text-rose-100   border border-rose-500/50",
};

/* ─── status dot ─── */
const STATUS_DOT = {
  "Open": { dot: "bg-sky-400", text: "text-sky-300" },
  "In Progress": { dot: "bg-amber-400", text: "text-amber-300" },
  "Resolved": { dot: "bg-emerald-400", text: "text-emerald-300" },
  "Closed": { dot: "bg-slate-400", text: "text-slate-300" },
};

/* ═══════════════════════════════════════════════════════════
   TICKET DETAIL DRAWER
═══════════════════════════════════════════════════════════ */
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
  const sd = STATUS_DOT[ticket.status] || STATUS_DOT["Open"];

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

  const isAgent = currentUser?.role === 'agent' || currentUser?.role === 'support';
  const isAssignedToMe = ticket.assigned_agent_id === currentUser?.agent_uid;
  const isUnassigned = !ticket.assigned_agent_id;
  const canUpdate = !isAgent || isAssignedToMe || isUnassigned;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/50 backdrop-blur-sm" />
      <div
        className="w-full max-w-[520px] bg-[#0f172a] border-l border-slate-700/60 flex flex-col h-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* drawer header */}
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-start justify-between gap-4 bg-slate-800/60">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <NiceTooltip content="Ticket Reference ID">
                <span className="text-[11px] font-bold text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded cursor-help">
                  #{ticket.id}
                </span>
              </NiceTooltip>
              <NiceTooltip content={`${ticket.priority} Priority`}>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider cursor-help ${pb}`}>
                  {ticket.priority}
                </span>
              </NiceTooltip>
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

        {/* customer + actions */}
        <div className="px-6 py-3 border-b border-slate-700/40 flex items-center justify-between gap-3 bg-slate-900/20">
          <div className="flex items-center gap-2.5">
            <NiceTooltip content={`Customer: ${ticket.lead_name || "Unknown"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 cursor-pointer ${avatarColor(ticket.lead_name)}`}>
                {initial(ticket.lead_name)}
              </div>
            </NiceTooltip>
            <div>
              <p className="text-[13px] font-semibold text-white leading-none">{ticket.lead_name || "Unknown"}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{ticket.lead_phone || "—"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <NiceTooltip content="Start chat with customer on WhatsApp">
              <button
                onClick={() => navigate("/chats")}
                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.82 11.82 0 0020.885 3.488" />
                </svg>
                Chat
              </button>
            </NiceTooltip>
            <NiceTooltip content="Open full customer profile details">
              <button
                onClick={() => navigate(`/lead/${ticket.lead_id}`)}
                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
              >
                Profile
              </button>
            </NiceTooltip>
          </div>
        </div>

        {/* controls */}
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
          /* body scroll */
          <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-5 flex flex-col gap-5">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Description</p>
              <p className="text-[13px] text-slate-300 leading-relaxed bg-slate-800/50 border border-slate-700/40 rounded-xl px-4 py-3 whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            {/* Activity & Responses Timeline */}
            <div className="border-t border-slate-700/40 pt-4 flex flex-col gap-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Activity & Responses ({history.length})
              </p>
              {history.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No activity or comments yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {history.map((item) => {
                    const isComment = !!item.comment;
                    const itemDate = new Date(item.created_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    });

                    if (isComment) {
                      return (
                        <div key={item.id} className="flex gap-2.5 items-start bg-slate-800/30 border border-slate-700/30 rounded-xl p-3 hover:bg-slate-800/40 transition-colors">
                          <NiceTooltip content={`Agent: ${item.agent_name || "System"}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 cursor-pointer ${avatarColor(item.agent_name)}`}>
                              {initial(item.agent_name)}
                            </div>
                          </NiceTooltip>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[12px] font-semibold text-slate-200">
                                {item.agent_name || "System"}
                              </span>
                              <NiceTooltip content={itemDate}>
                                <span className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-400">
                                  {fmtAgo(item.created_at)}
                                </span>
                              </NiceTooltip>
                            </div>
                            <p className="text-[13px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {item.comment}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 bg-slate-900/40 border border-slate-800/50 rounded-lg hover:border-slate-700/30 transition-all">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                          <span className="text-[11px] text-slate-400 font-medium">
                            {item.action}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            by <span className="font-semibold text-slate-400">{item.agent_name || "System"}</span>
                          </span>
                        </div>
                        <NiceTooltip content={itemDate}>
                          <span className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-400">
                            {fmtAgo(item.created_at)}
                          </span>
                        </NiceTooltip>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add Note */}
            <div className="border-t border-slate-700/40 pt-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Add Note</p>
              <form onSubmit={submit} className="flex flex-col gap-2">
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={!canUpdate}
                  placeholder={canUpdate ? "Write an internal note or update..." : "You must be the assigned agent to add notes."}
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-[13px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving || !canUpdate || !comment.trim()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all hover:-translate-y-px hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-40 disabled:translate-y-0 disabled:cursor-not-allowed"
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

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function Tickets() {
  const allLeads = useSelector((s) => s.leads.allLeads);
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ lead_id: "", subject: "", description: "", priority: "Medium", assigned_agent_id: "" });
  const [ferr, setFerr] = useState("");

  /* loaders */
  const loadTickets = async () => {
    try {
      const r = await apiClient.get(API_URLS.tickets.list);
      if (r.data.success) { setTickets(r.data.data); return r.data.data; }
    } catch (e) { console.error(e); }
  };

  const loadAgents = async () => {
    try {
      const r = await apiClient.get(API_URLS.agents.list);
      if (r.data.success) setAgents(r.data.data);
    } catch (e) { console.error(e); }
  };

  const loadHistory = async (id) => {
    try {
      const r = await apiClient.get(API_URLS.tickets.history(id));
      if (r.data.success) setHistory(r.data.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    dispatch(fetchAllLeads());
    loadAgents();
    setLoading(true);
    loadTickets().then((list) => { setLoading(false); });
  }, [dispatch]);

  const openTicket = (t) => { setSelected(t); setHistory([]); loadHistory(t.id); };
  const closeDrawer = () => setSelected(null);

  const updateField = async (field, value) => {
    if (!selected) return;
    setSaving(true);
    try {
      let body = {};
      if (field === "assigned_agent_id") {
        const ag = agents.find((a) => a.uid === value);
        body = { assigned_agent_id: value || null, assigned_agent_name: ag?.name || null };
      } else { body = { [field]: value }; }
      const r = await apiClient.put(API_URLS.tickets.update(selected.id), body);
      if (r.data.success) {
        const list = await loadTickets();
        const updated = list?.find((t) => t.id === selected.id) || r.data.data;
        const wasUnassigned = !selected.assigned_agent_id;
        const nowAssigned = !!updated.assigned_agent_id;
        setSelected(updated);
        await loadHistory(selected.id);

        if (wasUnassigned && nowAssigned) {
          showToast(`Ticket claimed and status updated to "${updated.status}"!`);
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
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const addComment = async (comment, cb) => {
    if (!selected) return;
    setSaving(true);
    try {
      const r = await apiClient.post(API_URLS.tickets.comments(selected.id), { comment });
      if (r.data.success) {
        setHistory(r.data.data);
        cb?.();
        showToast("Internal note added successfully!");
      }
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    if (!form.lead_id || !form.subject || !form.description) { setFerr("Fill all required fields."); return; }
    setFerr(""); setSaving(true);
    try {
      const ag = agents.find((a) => a.uid === form.assigned_agent_id);
      const r = await apiClient.post(API_URLS.tickets.create, {
        lead_id: parseInt(form.lead_id), subject: form.subject, description: form.description,
        priority: form.priority, status: "Open",
        assigned_agent_id: form.assigned_agent_id || null, assigned_agent_name: ag?.name || null,
      });
      if (r.data.success) {
        setModal(false); setForm({ lead_id: "", subject: "", description: "", priority: "Medium", assigned_agent_id: "" });
        await loadTickets();
        showToast("Support ticket created successfully!");
      }
    } catch (e) { setFerr(e.response?.data?.error || "Failed."); } finally { setSaving(false); }
  };

  /* derived */
  const cnt = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === "Open").length,
    active: tickets.filter((t) => t.status === "In Progress").length,
    resolved: tickets.filter((t) => t.status === "Resolved" || t.status === "Closed").length,
    urgent: tickets.filter((t) => t.priority === "Urgent").length,
  };

  const TABS = [
    { label: "All Tickets", val: "All" },
    { label: "Open", val: "Open" },
    { label: "In Progress", val: "In Progress" },
    { label: "Resolved", val: "Resolved" },
    { label: "Urgent", val: "Urgent" },
  ];

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    const ms =
      !q ||
      t.subject.toLowerCase().includes(q) ||
      (t.lead_name || "").toLowerCase().includes(q) ||
      (t.assigned_agent_name || "").toLowerCase().includes(q) ||
      String(t.id).includes(q);
    const mt =
      tab === "All" ||
      (tab === "Urgent" ? t.priority === "Urgent" :
        tab === "Resolved" ? (t.status === "Resolved" || t.status === "Closed") :
          t.status === tab);
    return ms && mt;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastTicket = validCurrentPage * itemsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - itemsPerPage;
  const currentTickets = filtered.slice(indexOfFirstTicket, indexOfLastTicket);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, tab]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filtered.length, totalPages, currentPage]);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      const start = Math.max(2, validCurrentPage - 1);
      const end = Math.min(totalPages - 1, validCurrentPage + 1);
      if (start > 2) {
        pages.push('ellipsis-start');
      }
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (end < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      pages.push(totalPages);
    }
    return pages;
  };

  /* ─── render ─── */
  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide bg-[#0b1120] text-slate-100">

      {/* ── Page Header ── */}
      <div className="px-8 pt-7 pb-5 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Support Center</h1>
            <p className="text-sm text-slate-400 mt-0.5">Monitor and resolve customer requests in real-time.</p>
          </div>
          {user?.role !== 'agent' && user?.role !== 'support' && (
            <button
              onClick={() => setModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-px"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create New Ticket
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="px-8 pb-6 grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[
          { label: "TOTAL TICKETS", value: cnt.all, color: "text-white", sub: "+12%", subColor: "text-emerald-400 bg-emerald-400/10" },
          { label: "OPEN NOW", value: cnt.open, color: "text-white", sub: null, subColor: "" },
          { label: "IN PROGRESS", value: cnt.active, color: "text-white", sub: null, subColor: "" },
          { label: "RESOLVED", value: cnt.resolved, color: "text-white", sub: `${cnt.all > 0 ? Math.round((cnt.resolved / cnt.all) * 100) : 0}%`, subColor: "text-slate-400" },
        ].map(({ label, value, color, sub, subColor }) => (
          <div key={label} className="bg-[#141c2f] border border-slate-700/50 rounded-2xl px-6 py-5 flex flex-col gap-3">
            <span className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">{label}</span>
            <div className="flex items-end justify-between">
              <span className={`text-4xl font-extrabold tracking-tight ${color}`}>
                {loading ? <span className="inline-block w-14 h-9 bg-slate-700/40 rounded animate-pulse" /> : value}
              </span>
              {sub && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg mb-1 ${subColor}`}>
                  {sub}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Section ── */}
      <div className="px-8 pb-8 flex flex-col gap-4 flex-1">
        {/* Filter tabs + search */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-[#141c2f] border border-slate-700/50 rounded-xl p-1">
            {TABS.map(({ label, val }) => (
              <button
                key={val}
                onClick={() => setTab(val)}
                className={`px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150 ${tab === val
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search tickets or customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[#141c2f] border border-slate-700/50 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors w-64"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#141c2f] border border-slate-700/50 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[160px_1fr_130px_160px_200px] gap-4 px-6 py-3 border-b border-slate-700/40">
            {["TICKET ID", "ISSUE DESCRIPTION", "PRIORITY", "STATUS", "ASSIGNED"].map((h) => (
              <span key={h} className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div className="flex flex-col divide-y divide-slate-700/30">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="grid grid-cols-[160px_1fr_130px_160px_200px] gap-4 px-6 py-4 animate-pulse">
                  <div className="h-4 bg-slate-700/40 rounded w-3/4" />
                  <div className="h-4 bg-slate-700/30 rounded" />
                  <div className="h-5 bg-slate-700/40 rounded-full w-16" />
                  <div className="h-4 bg-slate-700/30 rounded w-2/3" />
                  <div className="h-4 bg-slate-700/30 rounded w-3/4" />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
                <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <span className="text-sm">
                  {user?.role === 'agent' || user?.role === 'support' ? "No assigned tickets found." : "No tickets found"}
                </span>
              </div>
            ) : (
              currentTickets.map((t) => {
                const pb = PRIORITY_BADGE[t.priority] || PRIORITY_BADGE.Medium;
                const sd = STATUS_DOT[t.status] || STATUS_DOT["Open"];
                const isSelected = selected?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => openTicket(t)}
                    className={`w-full text-left grid grid-cols-[160px_1fr_130px_160px_200px] gap-4 px-6 py-4 transition-all duration-150 hover:bg-white/[0.03] ${isSelected ? "bg-indigo-600/5 border-l-2 border-l-indigo-500" : "border-l-2 border-l-transparent"
                      }`}
                  >
                    {/* Ticket ID */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[12px] font-bold text-slate-400">#TK-{String(t.id).padStart(4, "0")}</span>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[13px] font-semibold text-white line-clamp-1">{t.subject}</span>
                      <NiceTooltip content={`Created on ${new Date(t.created_at).toLocaleString()}`}>
                        <span className="text-[11px] text-slate-500 line-clamp-1 cursor-pointer">
                          Reported by {t.lead_name || "Unknown"} · {fmtAgo(t.created_at)}
                        </span>
                      </NiceTooltip>
                    </div>

                    {/* Priority */}
                    <div className="flex items-center">
                      <NiceTooltip content={`${t.priority} Priority`}>
                        <span className={`text-[11px] font-bold px-3 py-1 rounded uppercase tracking-wider cursor-help ${pb}`}>
                          {t.priority}
                        </span>
                      </NiceTooltip>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <NiceTooltip content={`Current Status: ${t.status}`}>
                        <div className="flex items-center gap-2 cursor-pointer">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${sd.dot}`} />
                          <span className={`text-[12px] font-semibold ${sd.text}`}>{t.status}</span>
                        </div>
                      </NiceTooltip>
                    </div>

                    {/* Assigned */}
                    <div className="flex items-center gap-2.5">
                      {t.assigned_agent_name ? (
                        <NiceTooltip content={`Assigned to ${t.assigned_agent_name}`}>
                          <div className="flex items-center gap-2.5 cursor-pointer max-w-full">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColor(t.assigned_agent_name)}`}>
                              {initial(t.assigned_agent_name)}
                            </div>
                            <span className="text-[12px] font-semibold text-slate-200 truncate">{t.assigned_agent_name}</span>
                          </div>
                        </NiceTooltip>
                      ) : (
                        <NiceTooltip content="No agent assigned to this ticket yet">
                          <span className="text-[12px] text-slate-500 cursor-help">Unassigned</span>
                        </NiceTooltip>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {!loading && filtered.length > 0 && (
            <div className="px-6 py-4 bg-[#141c2f] border-t border-slate-700/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-400 font-medium">
                Showing <span className="text-white font-semibold">{indexOfFirstTicket + 1}</span> to <span className="text-white font-semibold">{Math.min(indexOfLastTicket, filtered.length)}</span> of <span className="text-white font-semibold">{filtered.length}</span> tickets
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={validCurrentPage === 1}
                  className="p-2 rounded-lg bg-[#0f172a] border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-[#0f172a] disabled:hover:text-slate-400 disabled:cursor-not-allowed transition-all duration-200"
                  aria-label="Previous page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>

                {getPageNumbers().map((pageNum, index) => {
                  if (pageNum === 'ellipsis-start' || pageNum === 'ellipsis-end') {
                    return (
                      <span key={`ellipsis-${index}`} className="text-slate-500 px-1.5 font-bold">
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      type="button"
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${validCurrentPage === pageNum
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                        : 'bg-[#0f172a] border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={validCurrentPage === totalPages}
                  className="p-2 rounded-lg bg-[#0f172a] border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-[#0f172a] disabled:hover:text-slate-400 disabled:cursor-not-allowed transition-all duration-200"
                  aria-label="Next page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Ticket Drawer ── */}
      {selected && (
        <TicketDrawer
          ticket={selected}
          agents={agents}
          history={history}
          onClose={closeDrawer}
          onUpdate={updateField}
          onComment={addComment}
          saving={saving}
          currentUser={user}
        />
      )}

      {/* Sleek Floating Glassmorphic Toast/Tooltip */}
      <Toast message={toast} position="top-center" onClose={() => setToast(null)} />

      {/* ── Create Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-[#141c2f] border border-slate-700 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
              <h3 className="text-[15px] font-bold text-white">Create Support Ticket</h3>
              <button onClick={() => { setModal(false); setFerr(""); }} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={createTicket} className="px-6 py-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto scrollbar-hide">
              {ferr && <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">{ferr}</div>}

              {[
                {
                  label: "Customer", field: "lead_id", type: "select", required: true,
                  opts: allLeads.map((l) => ({ val: l.id, label: `${l.name} · ${l.phone}` })),
                  placeholder: "— Select a customer —"
                },
              ].map(({ label, field, opts, placeholder }) => (
                <div key={field} className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label} <span className="text-rose-400">*</span></label>
                  <select required value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors">
                    <option value="">{placeholder}</option>
                    {opts.map((o) => <option key={o.val} value={o.val}>{o.label}</option>)}
                  </select>
                </div>
              ))}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject <span className="text-rose-400">*</span></label>
                <input required type="text" placeholder="Brief summary of the issue..." value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description <span className="text-rose-400">*</span></label>
                <textarea required rows={4} placeholder="Explain the issue in detail..." value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors">
                    {["Low", "Medium", "High", "Urgent"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assign To</label>
                  <select value={form.assigned_agent_id} onChange={(e) => setForm({ ...form, assigned_agent_id: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors">
                    <option value="">Unassigned</option>
                    {agents.map((a) => <option key={a.uid} value={a.uid}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-700/40">
                <button type="button" onClick={() => { setModal(false); setFerr(""); }}
                  className="px-5 py-2.5 rounded-xl text-sm text-slate-400 border border-slate-700 hover:text-white hover:border-slate-500 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:translate-y-0">
                  {saving ? "Creating..." : "Create Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}