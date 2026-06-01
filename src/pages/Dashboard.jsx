import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import apiClient from '../services/apiClient';
import { API_URLS } from '../services/apiUrls';
import SupportDashboardView from '../components/SupportDashboardView';

function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  const [data, setData] = useState({
    metrics: { openDeals: 0, untouchedDeals: 0, pendingTasks: 0, myLeads: 0, closedDeals: 0, totalRevenue: 0, missedFollowups: 0 },
    todaysLeads: [],
    recentDeals: [],
    openTasks: [],
    recentConversations: [],
    employeePerformance: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [readMessageKeys, setReadMessageKeys] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_read_message_keys');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get(API_URLS.dashboard);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-poll every 10 seconds to keep the dashboard live and real-time!
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (user?.role === 'agent' || user?.role === 'support') {
    return <SupportDashboardView user={user} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-brand-text bg-brand-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  const openTasks = data.openTasks || [];
  const recentConversations = data.recentConversations || [];
  const todaysLeads = data.todaysLeads || [];
  const recentDeals = data.recentDeals || [];

  const unreadConversations = recentConversations.filter(msg => {
    const key = `${msg.leadId}_${msg.message}`;
    return !readMessageKeys.includes(key);
  });
  const unreadCount = unreadConversations.length;

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide text-brand-text bg-brand-bg p-4 md:p-8 gap-6">
      
      {/* 1. Header & Welcome Banner */}
      <div className="bg-brand-card border border-brand-border/60 rounded-2xl py-3 px-5 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md shadow-xl shrink-0 transition-all duration-300 hover:border-brand-border relative z-50">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 bg-brand-accent/10 border border-brand-accent/20 rounded-xl flex items-center justify-center text-brand-accent shadow-inner shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white m-0">Welcome, {user?.name || 'User'}</h1>
            <p className="text-xs text-brand-text-muted mt-0.5 m-0">Here is what's happening with your sales and leads today.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Notification Bell Dropdown wrapper */}
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
              }}
              className="p-2 bg-brand-bg hover:bg-brand-sidebar-hover border border-brand-border rounded-xl text-brand-text-muted hover:text-white transition-all relative"
              title="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white animate-pulse shadow-md">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2.5 w-80 bg-brand-card border border-brand-border rounded-2xl shadow-2xl p-4 z-50 flex flex-col gap-3 backdrop-blur-md bg-opacity-95">
                <div className="flex justify-between items-center border-b border-brand-border/60 pb-2">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5 font-sans">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    Incoming Messages
                  </span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const allKeys = recentConversations.map(msg => `${msg.leadId}_${msg.message}`);
                          setReadMessageKeys(prev => {
                            const next = Array.from(new Set([...prev, ...allKeys]));
                            localStorage.setItem('crm_read_message_keys', JSON.stringify(next));
                            return next;
                          });
                        }}
                        className="text-[10px] text-brand-accent hover:text-brand-accent-hover font-bold transition-all bg-transparent border-none cursor-pointer hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                    {recentConversations.length > 0 && (
                      <span className="text-[10px] bg-brand-accent/20 text-brand-accent font-bold px-2 py-0.5 rounded-full">
                        {recentConversations.length} Active
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto scrollbar-hide">
                  {!recentConversations || recentConversations.length === 0 ? (
                    <span className="text-xs text-brand-text-muted italic py-4 text-center">No incoming messages yet.</span>
                  ) : (
                    recentConversations.map((msg, idx) => {
                      const msgKey = `${msg.leadId}_${msg.message}`;
                      const isUnread = !readMessageKeys.includes(msgKey);
                      return (
                        <div 
                          key={idx} 
                          onClick={() => {
                            setReadMessageKeys(prev => {
                              if (prev.includes(msgKey)) return prev;
                              const next = [...prev, msgKey];
                              localStorage.setItem('crm_read_message_keys', JSON.stringify(next));
                              return next;
                            });
                            setNotificationsOpen(false);
                            navigate(`/lead/${msg.leadId}`);
                          }}
                          className={`flex flex-col p-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                            isUnread 
                              ? 'bg-brand-accent/5 border-brand-accent/30 hover:border-brand-accent/60 hover:bg-brand-accent/10 shadow-sm' 
                              : 'bg-brand-bg/25 border-brand-border/20 hover:border-brand-accent/30 hover:bg-brand-sidebar-hover/5 opacity-75'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1 gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {isUnread && (
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse shrink-0" title="Unread"></span>
                              )}
                              <span className={`text-xs text-white truncate max-w-[140px] capitalize ${isUnread ? 'font-bold' : 'font-semibold'}`}>
                                {msg.leadName}
                              </span>
                            </div>
                            <span className="text-[9px] text-brand-text-muted font-semibold shrink-0">{msg.timeFormatted}</span>
                          </div>
                          <span className={`text-[11px] truncate pr-2 ${isUnread ? 'text-white/90 font-medium' : 'text-brand-text-muted'}`}>
                            {msg.message}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={handleRefresh}
            className={`p-2 bg-brand-bg hover:bg-brand-sidebar-hover border border-brand-border rounded-xl text-brand-text-muted hover:text-white transition-all ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>
          <div className="bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs font-semibold text-brand-text flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            {user?.name || 'Agent'}'s Home
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards (Responsive Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        
        {/* Card 1: Total Leads */}
        <div 
          onClick={() => navigate('/leads')}
          className="bg-brand-card border border-brand-border/60 hover:border-blue-500/50 rounded-2xl p-5 flex flex-col justify-between h-[120px] overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-card relative group"
        >
          <div className="absolute top-0 left-0 h-full w-1.5 bg-blue-500 group-hover:w-2 transition-all"></div>
          <span className="text-[11px] font-extrabold text-brand-text-muted uppercase tracking-wider mb-2">Total Leads</span>
          <span className="text-3xl font-extrabold text-white tracking-tight">{data.metrics.myLeads}</span>
        </div>

        {/* Card 2: Closed Deals */}
        <div 
          onClick={() => navigate('/pipeline')}
          className="bg-brand-card border border-brand-border/60 hover:border-emerald-500/50 rounded-2xl p-5 flex flex-col justify-between h-[120px] overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-card relative group"
        >
          <div className="absolute top-0 left-0 h-full w-1.5 bg-emerald-500 group-hover:w-2 transition-all"></div>
          <span className="text-[11px] font-extrabold text-brand-text-muted uppercase tracking-wider mb-2">Closed Deals</span>
          <span className="text-3xl font-extrabold text-white tracking-tight">{data.metrics.closedDeals || 0}</span>
        </div>

        {/* Card 3: Total Revenue */}
        <div 
          onClick={() => navigate('/pipeline')}
          className="bg-brand-card border border-brand-border/60 hover:border-amber-500/50 rounded-2xl p-5 flex flex-col justify-between h-[120px] overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-card relative group"
        >
          <div className="absolute top-0 left-0 h-full w-1.5 bg-amber-500 group-hover:w-2 transition-all"></div>
          <span className="text-[11px] font-extrabold text-brand-text-muted uppercase tracking-wider mb-2">Total Revenue</span>
          <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">${Number(data.metrics.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        {/* Card 4: Missed Follow-ups */}
        <div 
          onClick={() => navigate('/pending')}
          className={`bg-brand-card border rounded-2xl p-5 flex flex-col justify-between h-[120px] overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-card relative group ${
            (data.metrics.missedFollowups || 0) > 0 ? 'border-rose-500/60 hover:border-rose-500' : 'border-brand-border/60 hover:border-rose-500/50'
          }`}
        >
          <div className="absolute top-0 left-0 h-full w-1.5 bg-rose-500 group-hover:w-2 transition-all"></div>
          <span className="text-[11px] font-extrabold text-brand-text-muted uppercase tracking-wider mb-2">Missed Follow-ups</span>
          <span className={`text-3xl font-extrabold tracking-tight ${
            (data.metrics.missedFollowups || 0) > 0 ? 'text-rose-400' : 'text-white'
          }`}>{data.metrics.missedFollowups || 0}</span>
        </div>

        {/* Card 5: Pending Tasks */}
        <div 
          onClick={() => navigate('/pending')}
          className="bg-brand-card border border-brand-border/60 hover:border-amber-500/50 rounded-2xl p-5 flex flex-col justify-between h-[120px] overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-card relative group"
        >
          <div className="absolute top-0 left-0 h-full w-1.5 bg-amber-500 group-hover:w-2 transition-all"></div>
          <span className="text-[11px] font-extrabold text-brand-text-muted uppercase tracking-wider mb-2">Pending Tasks</span>
          <span className="text-3xl font-extrabold text-white tracking-tight">{data.metrics.pendingTasks}</span>
        </div>

      </div>

      {/* 3. Middle Section: Leads & Deals Closing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Table: Today's Leads */}
        <div className="bg-brand-card border border-brand-border/60 rounded-2xl p-5 shadow-xl flex flex-col h-[380px] overflow-hidden transition-all duration-300 hover:border-brand-border">
          <div className="flex justify-between items-center mb-5 shrink-0">
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Today's New Leads
            </h2>
            <button 
              onClick={() => navigate('/leads')} 
              className="text-xs font-extrabold text-brand-accent hover:text-brand-accent-hover uppercase tracking-wider transition-colors"
            >
              All Leads
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-auto min-w-full scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border/60">
                  <th className="pb-3.5 text-xs font-bold uppercase tracking-wider text-brand-text-muted">Lead Name</th>
                  <th className="pb-3.5 text-xs font-bold uppercase tracking-wider text-brand-text-muted">Phone</th>
                  <th className="pb-3.5 text-xs font-bold uppercase tracking-wider text-brand-text-muted">Source</th>
                  <th className="pb-3.5 text-xs font-bold uppercase tracking-wider text-brand-text-muted">Stage</th>
                </tr>
              </thead>
              <tbody>
                {todaysLeads.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-10 text-center text-sm text-brand-text-muted">No new leads added today.</td>
                  </tr>
                ) : (
                  todaysLeads.map(lead => (
                    <tr key={lead.id} className="border-b border-brand-border/30 hover:bg-brand-sidebar-hover/20 transition-all duration-200">
                      <td onClick={() => navigate(`/lead/${lead.id}`)} className="py-4 text-sm font-semibold text-brand-accent hover:underline cursor-pointer transition-all">{lead.name}</td>
                      <td className="py-4 text-sm text-brand-text-muted">{lead.phone}</td>
                      <td className="py-4 text-sm">
                        <span className="bg-[#25d366]/10 text-[#25d366] px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border border-[#25d366]/20">
                          {lead.source}
                        </span>
                      </td>
                      <td className="py-4 text-sm">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          lead.stage === 'new' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          lead.stage === 'won' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {lead.stage}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table: Deals Closing This Month */}
        <div className="bg-brand-card border border-brand-border/60 rounded-2xl p-5 shadow-xl flex flex-col h-[380px] overflow-hidden transition-all duration-300 hover:border-brand-border">
          <div className="flex justify-between items-center mb-5 shrink-0">
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              My Deals closing
            </h2>
            <button 
              onClick={() => navigate('/pipeline')} 
              className="text-xs font-extrabold text-brand-accent hover:text-brand-accent-hover uppercase tracking-wider transition-colors"
            >
              Deals Board
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-auto min-w-full scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border/60">
                  <th className="pb-3.5 text-xs font-bold uppercase tracking-wider text-brand-text-muted">Deal Name</th>
                  <th className="pb-3.5 text-xs font-bold uppercase tracking-wider text-brand-text-muted">Amount</th>
                  <th className="pb-3.5 text-xs font-bold uppercase tracking-wider text-brand-text-muted">Stage</th>
                </tr>
              </thead>
              <tbody>
                {recentDeals.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-10 text-center text-sm text-brand-text-muted">No active deals mapped currently.</td>
                  </tr>
                ) : (
                  recentDeals.map(deal => (
                    <tr key={deal.dealId} className="border-b border-brand-border/30 hover:bg-brand-sidebar-hover/20 transition-all duration-200">
                      <td onClick={() => navigate(`/lead/${deal.leadId}`)} className="py-4 text-sm font-semibold text-brand-accent hover:underline cursor-pointer transition-all">{deal.leadName}</td>
                      <td className="py-4 text-sm font-bold text-emerald-400">${Number(deal.value).toFixed(2)}</td>
                      <td className="py-4 text-sm">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          deal.stage === 'new' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          deal.stage === 'won' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {deal.stage}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 4. Lower Section: Open Tasks & Recent Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Open Tasks List */}
        <div className="bg-brand-card border border-brand-border/60 rounded-2xl p-5 shadow-xl flex flex-col h-[380px] overflow-hidden transition-all duration-300 hover:border-brand-border">
          <div className="flex justify-between items-center mb-5 shrink-0">
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              Upcoming Open Tasks
            </h2>
            <button 
              onClick={() => navigate('/pending')} 
              className="text-xs font-extrabold text-brand-accent hover:text-brand-accent-hover uppercase tracking-wider transition-colors"
            >
              All Tasks
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-hide">
            {openTasks.length === 0 ? (
              <div className="py-10 text-center text-sm text-brand-text-muted flex flex-col items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 text-brand-text-muted/55">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                No pending tasks found. All caught up!
              </div>
            ) : (
              openTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3.5 bg-brand-bg/50 border border-brand-border/30 rounded-xl hover:border-brand-border hover:bg-brand-sidebar-hover/10 transition-all duration-200">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-semibold text-white truncate">{task.title}</span>
                    <div className="flex items-center gap-2 text-xs text-brand-text-muted">
                      <span>Lead:</span>
                      <span onClick={() => navigate(`/lead/${task.leadId}`)} className="text-brand-accent hover:underline font-medium cursor-pointer transition-all">{task.leadName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      task.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {task.priority}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-brand-text-muted font-medium bg-brand-card px-2 py-1 rounded border border-brand-border/40">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      {task.dueDate}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent WhatsApp Conversations */}
        <div className="bg-brand-card border border-brand-border/60 rounded-2xl p-5 shadow-xl flex flex-col h-[380px] overflow-hidden transition-all duration-300 hover:border-brand-border">
          <div className="flex justify-between items-center mb-5 shrink-0">
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              Recent WhatsApp Chats
            </h2>
            <button 
              onClick={() => navigate('/chats')} 
              className="text-xs font-extrabold text-brand-accent hover:text-brand-accent-hover uppercase tracking-wider transition-colors"
            >
              All Chats
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-hide">
            {recentConversations.length === 0 ? (
              <div className="py-10 text-center text-sm text-brand-text-muted flex flex-col items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 text-brand-text-muted/55">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
                No recent chat messages mapped.
              </div>
            ) : (
              recentConversations.map((chat, idx) => (
                <div 
                  key={idx} 
                  onClick={() => navigate(`/lead/${chat.leadId}`)}
                  className="flex items-center gap-3.5 p-3.5 bg-brand-bg/50 border border-brand-border/30 rounded-xl hover:border-brand-accent/40 hover:bg-brand-sidebar-hover/10 cursor-pointer transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                    {chat.leadName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white group-hover:text-brand-accent transition-colors truncate">{chat.leadName}</span>
                      <span className="text-[10px] text-brand-text-muted font-medium shrink-0">{chat.timeFormatted}</span>
                    </div>
                    <span className="text-xs text-brand-text-muted truncate pr-3">{chat.message}</span>
                  </div>
                  <div className="shrink-0 flex items-center">
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-emerald-500/20">
                      WhatsApp
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 5. Employee Performance Leaderboard Section */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-brand-card border border-brand-border/60 rounded-2xl p-5 shadow-xl flex flex-col h-[380px] overflow-hidden transition-all duration-300 hover:border-brand-border">
          <div className="flex justify-between items-center mb-5 shrink-0">
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent"><path d="M17 21v-2a4 4 0 0 0-3-3.87"></path><path d="M9 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Employee Performance Leaderboard
            </h2>
            <div className="bg-brand-bg border border-brand-border rounded-xl px-3 py-1 text-xs font-semibold text-brand-text-muted">
              Ranked by Revenue
            </div>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-auto min-w-full scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border/60">
                  <th className="pb-3.5 text-xs font-bold uppercase tracking-wider text-brand-text-muted">Employee Name</th>
                  <th className="pb-3.5 text-xs font-bold uppercase tracking-wider text-brand-text-muted text-center">Total Leads</th>
                  <th className="pb-3.5 text-xs font-bold uppercase tracking-wider text-brand-text-muted text-center">Closed Deals</th>
                  <th className="pb-3.5 text-xs font-bold uppercase tracking-wider text-brand-text-muted text-right">Closed Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(!data.employeePerformance || data.employeePerformance.length === 0) ? (
                  <tr>
                    <td colSpan="4" className="py-10 text-center text-sm text-brand-text-muted">
                      No active employee assignments recorded yet. Assign leads to employees to see rankings!
                    </td>
                  </tr>
                ) : (
                  data.employeePerformance.map((emp, index) => (
                    <tr key={index} className="border-b border-brand-border/30 hover:bg-brand-sidebar-hover/20 transition-all duration-200">
                      <td className="py-4 text-sm font-semibold text-white flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          index === 1 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30' :
                          index === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' :
                          'bg-brand-bg text-brand-text-muted border border-brand-border/40'
                        }`}>
                          {index + 1}
                        </div>
                        {emp.employeeName}
                      </td>
                      <td className="py-4 text-sm text-center font-medium text-brand-text">{emp.totalLeads}</td>
                      <td className="py-4 text-sm text-center font-medium text-emerald-400">{emp.closedDeals}</td>
                      <td className="py-4 text-sm text-right font-bold text-emerald-400">${Number(emp.closedRevenue).toFixed(2)}</td>
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
}

export default Dashboard;

