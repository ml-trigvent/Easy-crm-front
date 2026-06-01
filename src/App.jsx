import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './features/auth/authSlice';
import Toast from './components/Toast';

import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import AllLeads from './pages/AllLeads';
import Settings from './pages/Settings';
import LeadProfile from './pages/LeadProfile';
import Pending from './pages/Pending';
import Login from './pages/Login';
import Chats from './pages/Chats';
import Tickets from './pages/Tickets';


function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    const storedToast = sessionStorage.getItem('crm_login_toast');
    if (storedToast) {
      setToast(storedToast);
      sessionStorage.removeItem('crm_login_toast');
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="flex h-screen w-screen overflow-hidden text-brand-text bg-brand-bg font-sans">
        
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Modern Dark Sidebar */}
        <aside className={`fixed inset-y-0 left-0 w-[260px] bg-brand-sidebar flex flex-col p-6 z-50 shadow-2xl transition-transform duration-300 transform md:relative md:translate-x-0 shrink-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Close button for mobile */}
          <button 
            className="absolute top-6 right-6 md:hidden text-brand-text-muted hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <div className="flex flex-col gap-1 mb-8">
            <div className="flex items-center gap-3 text-2xl font-bold text-white tracking-tight">
              <div className="w-8 h-8 bg-brand-accent text-white rounded-lg flex justify-center items-center shadow-lg shadow-brand-accent/30">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
              </div>
              EasyCRM
            </div>
            {user && (
              <div className="text-sm text-brand-text-muted mt-2 ml-11">
                Welcome, {user.name}
              </div>
            )}
          </div>
          <nav className="flex flex-col gap-1.5 flex-1">
            <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/20' : 'text-brand-text-muted hover:bg-brand-sidebar-hover hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="9" width="9" height="11" rx="2"></rect><path d="M9 22V12h6v10"></path><path d="M2 10.6L12 2l10 8.6"></path></svg>
              Dashboard
            </NavLink>
            
            {user?.role !== 'agent' && user?.role !== 'support' && (
              <>
                <NavLink to="/pipeline" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/20' : 'text-brand-text-muted hover:bg-brand-sidebar-hover hover:text-white'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
                  Pipeline
                </NavLink>
                <NavLink to="/leads" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/20' : 'text-brand-text-muted hover:bg-brand-sidebar-hover hover:text-white'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  All Leads
                </NavLink>
              </>
            )}

            <NavLink to="/chats" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/20' : 'text-brand-text-muted hover:bg-brand-sidebar-hover hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              Chats
            </NavLink>

            {user?.role !== 'agent' && user?.role !== 'support' && (
              <NavLink to="/pending" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/20' : 'text-brand-text-muted hover:bg-brand-sidebar-hover hover:text-white'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Pending Tasks
              </NavLink>
            )}

            <NavLink to="/tickets" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/20' : 'text-brand-text-muted hover:bg-brand-sidebar-hover hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
              Support Tickets
            </NavLink>

            {user?.role !== 'agent' && user?.role !== 'support' && (
              <>
                <div className="my-2 border-t border-brand-border opacity-20"></div>
                <NavLink to="/settings" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/20' : 'text-brand-text-muted hover:bg-brand-sidebar-hover hover:text-white'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                  Settings
                </NavLink>
              </>
            )}
          </nav>

          <div className="mt-auto">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium w-full text-brand-text-muted hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Mobile Top Header */}
          <header className="md:hidden h-[64px] bg-brand-sidebar border-b border-brand-border flex items-center px-4 shrink-0 shadow-sm z-30 relative">
            <button 
              className="p-2 text-brand-text-muted hover:text-white"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="ml-3 font-bold text-lg tracking-tight text-white flex items-center gap-2">
              <div className="w-6 h-6 bg-brand-accent text-white rounded flex justify-center items-center shadow-lg shadow-brand-accent/30">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
              </div>
              EasyCRM
            </div>
          </header>

          <main className="flex-1 flex flex-col relative overflow-hidden bg-brand-bg">
            <Routes>
              {user?.role === 'agent' || user?.role === 'support' ? (
                <>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/chats" element={<Chats />} />
                  <Route path="/tickets" element={<Tickets />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/pipeline" element={<Pipeline />} />
                  <Route path="/leads" element={<AllLeads />} />
                  <Route path="/chats" element={<Chats />} />
                  <Route path="/pending" element={<Pending />} />
                  <Route path="/tickets" element={<Tickets />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/lead/:id" element={<LeadProfile />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              )}
            </Routes>
          </main>
        </div>
      </div>
      <Toast message={toast} position="top-right" onClose={() => setToast(null)} />
    </Router>
  );
}

export default App;
