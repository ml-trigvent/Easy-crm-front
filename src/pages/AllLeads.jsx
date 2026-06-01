import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllLeads, createLeadAsync, deleteDealAsync } from '../features/leads/leadsThunks';
import { fetchStages } from '../features/stages/stagesThunks';
import Toast from '../components/Toast';

function AllLeads() {
  const allLeads = useSelector((state) => state.leads.allLeads);
  const stages = useSelector((state) => state.stages.stages);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', value: '', stage_id: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const confirmDelete = async () => {
    if (!leadToDelete) return;
    try {
      await dispatch(deleteDealAsync(leadToDelete)).unwrap();
      setLeadToDelete(null);
      showToast('Lead deleted successfully!');
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  useEffect(() => {
    // Initial fetch
    dispatch(fetchAllLeads());
    dispatch(fetchStages());

    // Set up polling every 10 seconds
    const intervalId = setInterval(() => {
      dispatch(fetchAllLeads());
    }, 10000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [dispatch]);

  const getStageName = (stageId) => {
    const stage = stages.find(s => s.id === stageId);
    return stage ? stage.name : stageId;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    // Validate phone number format
    const phoneRegex = /^\+?[0-9\s\-\(\)]{7,20}$/;
    if (!phoneRegex.test(formData.phone)) {
      setErrorMsg('Please enter a valid phone number (e.g. +1 234 567 8900)');
      return;
    }

    setErrorMsg('');

    // Assign a default stage if not selected
    const stageId = formData.stage_id || (stages.length > 0 ? stages[0].id : 'new');

    try {
      const responseData = await dispatch(createLeadAsync({
        name: formData.name,
        phone: formData.phone,
        value: formData.value || 0,
        stage_id: stageId
      })).unwrap();

      setIsCreateModalOpen(false);
      setFormData({ name: '', phone: '', value: '', stage_id: '' });
      showToast(responseData.message || 'Lead created successfully!');
    } catch (err) {
      setErrorMsg(err);
    }
  };

  const itemsPerPage = 10;
  const totalPages = Math.ceil(allLeads.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const indexOfLastLead = validCurrentPage * itemsPerPage;
  const indexOfFirstLead = indexOfLastLead - itemsPerPage;
  const currentLeads = allLeads.slice(indexOfFirstLead, indexOfLastLead);

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

  return (
    <div className="flex flex-col h-full overflow-hidden text-brand-text bg-brand-bg">
      <header className="min-h-[76px] md:h-[76px] py-4 md:py-0 px-4 md:px-8 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 md:gap-0 border-b border-brand-border bg-brand-card z-10 shrink-0">
        <div className="text-xl font-bold tracking-tight text-brand-text text-center sm:text-left">All Leads</div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-brand-accent text-white border-none py-2.5 px-5 rounded-lg font-medium text-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-accent/30 hover:bg-brand-accent-hover flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Lead
          </button>
        </div>
      </header>

      <div className="p-4 md:p-8 overflow-y-auto flex-1 scrollbar-hide">
        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-brand-bg border-b border-brand-border">
                <tr>
                  <th className="px-6 py-4 font-semibold text-brand-text-muted text-xs uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 font-semibold text-brand-text-muted text-xs uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 font-semibold text-brand-text-muted text-xs uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 font-semibold text-brand-text-muted text-xs uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-4 font-semibold text-brand-text-muted text-xs uppercase tracking-wider">Added</th>
                  <th className="px-6 py-4 font-semibold text-brand-text-muted text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-brand-border cursor-pointer transition-colors duration-200 hover:bg-brand-bg group"
                    onClick={() => navigate(`/lead/${lead.id}`)}
                  >
                    <td className="px-6 py-4 font-medium text-brand-text group-hover:text-brand-accent transition-colors">
                      <div className="truncate max-w-[200px] sm:max-w-[300px]" title={lead.name}>{lead.name}</div>
                    </td>
                    <td className="px-6 py-4 text-brand-text-muted">
                      <div className="truncate max-w-[120px] sm:max-w-[200px]" title={lead.phone}>{lead.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-[#25d366]/10 text-[#25d366] px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide">{lead.source}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-brand-bg border border-brand-border text-brand-text-muted px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
                        {getStageName(lead.stage_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-brand-text-muted text-sm">{formatDate(lead.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLeadToDelete(lead.id);
                        }}
                        className="p-1.5 bg-red-500/10 text-red-500 rounded-lg opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white group/btn inline-flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {allLeads.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-brand-text-muted font-medium">
                      No leads found. New leads will appear here when you receive WhatsApp messages.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {allLeads.length > 0 && (
            <div className="px-6 py-4 bg-brand-card border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-brand-text-muted font-medium">
                Showing <span className="text-white font-semibold">{indexOfFirstLead + 1}</span> to <span className="text-white font-semibold">{Math.min(indexOfLastLead, allLeads.length)}</span> of <span className="text-white font-semibold">{allLeads.length}</span> leads
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={validCurrentPage === 1}
                  className="p-2 rounded-lg bg-brand-bg border border-brand-border text-brand-text-muted hover:text-white hover:bg-brand-border disabled:opacity-40 disabled:hover:bg-brand-bg disabled:hover:text-brand-text-muted disabled:cursor-not-allowed transition-all duration-200"
                  aria-label="Previous page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>

                {getPageNumbers().map((pageNum, index) => {
                  if (pageNum === 'ellipsis-start' || pageNum === 'ellipsis-end') {
                    return (
                      <span key={`ellipsis-${index}`} className="text-brand-text-muted px-1.5 font-bold">
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
                        ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/25'
                        : 'bg-brand-bg border border-brand-border text-brand-text-muted hover:text-white hover:bg-brand-border'
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
                  className="p-2 rounded-lg bg-brand-bg border border-brand-border text-brand-text-muted hover:text-white hover:bg-brand-border disabled:opacity-40 disabled:hover:bg-brand-bg disabled:hover:text-brand-text-muted disabled:cursor-not-allowed transition-all duration-200"
                  aria-label="Next page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Lead Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card w-full max-w-md rounded-2xl shadow-2xl border border-brand-border overflow-hidden flex flex-col transform transition-all">
            <div className="px-6 py-5 border-b border-brand-border flex justify-between items-center bg-brand-bg">
              <h3 className="text-xl font-bold tracking-tight text-brand-text m-0">Add New Lead</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-brand-text-muted hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-6 flex flex-col gap-5">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {errorMsg}
                </div>
              )}
              <div>
                <label className="block text-brand-text-muted text-sm font-bold mb-2 uppercase tracking-wide">Lead Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter lead name"
                  className="w-full bg-brand-bg border border-brand-border text-brand-text px-4 py-3 rounded-xl focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-brand-text-muted text-sm font-bold mb-2 uppercase tracking-wide">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder="Enter phone number"
                  className="w-full bg-brand-bg border border-brand-border text-brand-text px-4 py-3 rounded-xl focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all font-medium"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-brand-text-muted text-sm font-bold mb-2 uppercase tracking-wide">Initial Deal Value ($)</label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full bg-brand-bg border border-brand-border text-brand-text px-4 py-3 rounded-xl focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all font-medium"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-brand-text-muted text-sm font-bold mb-2 uppercase tracking-wide">Stage</label>
                  <select
                    value={formData.stage_id}
                    onChange={(e) => setFormData({ ...formData, stage_id: e.target.value })}
                    className="w-full bg-brand-bg border border-brand-border text-brand-text px-4 py-3 rounded-xl focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all font-medium appearance-none"
                  >
                    <option value="" disabled>Select stage</option>
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setErrorMsg('');
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-brand-text-muted hover:text-white hover:bg-brand-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-brand-accent/30 hover:bg-brand-accent-hover hover:-translate-y-0.5 transition-all"
                >
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {leadToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card w-full max-w-sm rounded-2xl shadow-2xl border border-brand-border overflow-hidden flex flex-col transform transition-all text-center p-6">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-brand-text mb-2">Delete Lead?</h3>
            <p className="text-brand-text-muted text-sm mb-6">
              This action cannot be undone. This will permanently delete the lead, the deal, and all associated chat messages.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setLeadToDelete(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-brand-text-muted hover:text-white hover:bg-brand-bg transition-colors flex-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-red-500/30 hover:bg-red-600 hover:-translate-y-0.5 transition-all flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <Toast message={toast} position="top-right" onClose={() => setToast(null)} />
    </div>
  );
}

export default AllLeads;







