import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchStages } from '../features/stages/stagesThunks';
import { fetchPipeline, updateLeadStageAsync, createDealAsync, deleteDealAsync } from '../features/leads/leadsThunks';
import Toast from '../components/Toast';

function Pipeline() {
  const deals = useSelector((state) => state.leads.leads);
  const stages = useSelector((state) => state.stages.stages);
  const loading = useSelector((state) => state.leads.loading);
  const dispatch = useDispatch();
  
  const [draggedDeal, setDraggedDeal] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', value: '', stage_id: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    // Initial fetch
    dispatch(fetchStages());
    dispatch(fetchPipeline());

    // Set up polling every 10 seconds
    const intervalId = setInterval(() => {
      dispatch(fetchPipeline());
    }, 10000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [dispatch]);

  const handleDragStart = (deal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); 
  };

  const handleDrop = (stageId) => {
    if (draggedDeal && draggedDeal.stage !== stageId) {
      dispatch(updateLeadStageAsync({ leadId: draggedDeal.leadId, stageId }));
    }
    setDraggedDeal(null);
  };

  const handleCreateDeal = async (e) => {
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
      const responseData = await dispatch(createDealAsync({ 
        name: formData.name, 
        phone: formData.phone, 
        value: formData.value || 0, 
        stage_id: stageId 
      })).unwrap();

      console.log('DEBUG: Backend Response Data (Unwrapped):', responseData);
      
      setIsCreateModalOpen(false);
      setFormData({ name: '', phone: '', value: '', stage_id: '' });
      showToast(responseData.message || 'Deal created successfully!');
    } catch (err) {
      console.error('DEBUG: Backend Error:', err);
      setErrorMsg(err);
    }
  };

  const confirmDelete = async () => {
    if (!dealToDelete) return;
    try {
      await dispatch(deleteDealAsync(dealToDelete)).unwrap();
      setDealToDelete(null);
      showToast('Deal deleted successfully!');
    } catch (err) {
      console.error('Failed to delete deal:', err);
    }
  };

  if (loading && stages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-brand-text">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden text-brand-text bg-brand-bg">
      <header className="min-h-[76px] md:h-[76px] py-4 md:py-0 px-4 md:px-8 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 md:gap-0 border-b border-brand-border bg-brand-card z-10 shrink-0">
        <div className="text-xl font-bold tracking-tight text-brand-text text-center sm:text-left">Sales Pipeline</div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-brand-accent text-white border-none py-2.5 px-5 rounded-lg font-medium text-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-accent/30 hover:bg-brand-accent-hover flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Create Deal
          </button>
        </div>
      </header>

      <div className="flex gap-4 md:gap-6 p-4 md:p-8 flex-1 overflow-x-auto overflow-y-hidden z-[1]">
        {stages.map((stage) => {
          const stageDeals = deals.filter(d => d.stage === stage.id);
          
          return (
            <div 
              key={stage.id} 
              className="min-w-[320px] w-[320px] flex flex-col h-full pb-2"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
            >
              <div className="p-2 mb-2 flex justify-between items-center shrink-0">
                <div className="font-semibold text-[15px] flex items-center gap-2.5 text-brand-text">
                  <div 
                    className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]"
                    style={{ 
                      backgroundColor: stage.color,
                      boxShadow: `0 0 8px ${stage.color}80` 
                    }}
                  ></div>
                  {stage.name}
                </div>
                <div className="bg-brand-card border border-brand-border px-2.5 py-0.5 rounded-md text-xs font-semibold text-brand-text-muted">{stageDeals.length}</div>
              </div>
              
              <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 scrollbar-hide px-1">
                {stageDeals.map((deal) => (
                  <div 
                    key={deal.id} 
                    className="bg-brand-card border border-brand-border rounded-xl p-4 cursor-grab transition-all duration-200 relative group hover:-translate-y-1 hover:shadow-card hover:border-brand-accent/50 active:cursor-grabbing"
                    draggable
                    onDragStart={() => handleDragStart(deal)}
                    onClick={() => navigate(`/lead/${deal.leadId}`)}
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDealToDelete(deal.leadId); }}
                      className="absolute top-3 right-3 p-1.5 bg-red-500/10 text-red-500 rounded-lg opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white group/btn"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                      {/* Custom Tooltip */}
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-brand-card border border-brand-border text-brand-text px-2 py-1 rounded-md text-[11px] font-bold opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-20">
                        Delete Deal
                      </span>
                    </button>
                    
                    <div className="font-semibold text-[15px] mb-2 pr-8 text-brand-text tracking-tight truncate" title={deal.leadName}>{deal.leadName}</div>
                    <div className="text-xs text-brand-text-muted flex items-center gap-2 mb-3.5 min-w-0">
                      <span className="bg-[#25d366]/10 text-[#25d366] px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide shrink-0">WhatsApp</span>
                      <span className="truncate" title={deal.phone}>{deal.phone}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-brand-border pt-3">
                      <span className="text-sm font-semibold text-emerald-400">{deal.value}</span>
                      <span className="text-xs font-medium text-brand-text-muted">{deal.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Deal Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card w-full max-w-md rounded-2xl shadow-2xl border border-brand-border overflow-hidden flex flex-col transform transition-all">
            <div className="px-6 py-5 border-b border-brand-border flex justify-between items-center bg-brand-bg">
              <h3 className="text-xl font-bold tracking-tight text-brand-text m-0">Create New Deal</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-brand-text-muted hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateDeal} className="p-6 flex flex-col gap-5">
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
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="e.g. John Doe"
                  className="w-full bg-brand-bg border border-brand-border text-brand-text px-4 py-3 rounded-xl focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all font-medium"
                />
              </div>
              
              <div>
                <label className="block text-brand-text-muted text-sm font-bold mb-2 uppercase tracking-wide">Phone Number</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                  placeholder="e.g. +1 234 567 8900"
                  className="w-full bg-brand-bg border border-brand-border text-brand-text px-4 py-3 rounded-xl focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all font-medium"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-brand-text-muted text-sm font-bold mb-2 uppercase tracking-wide">Deal Value ($)</label>
                  <input 
                    type="number" 
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full bg-brand-bg border border-brand-border text-brand-text px-4 py-3 rounded-xl focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all font-medium"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-brand-text-muted text-sm font-bold mb-2 uppercase tracking-wide">Stage</label>
                  <select 
                    value={formData.stage_id}
                    onChange={(e) => setFormData({...formData, stage_id: e.target.value})}
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
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {dealToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card w-full max-w-sm rounded-2xl shadow-2xl border border-brand-border overflow-hidden flex flex-col transform transition-all text-center p-6">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-brand-text mb-2">Delete Deal?</h3>
            <p className="text-brand-text-muted text-sm mb-6">
              This action cannot be undone. This will permanently delete the lead, the deal, and all associated chat messages.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setDealToDelete(null)}
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

export default Pipeline;
