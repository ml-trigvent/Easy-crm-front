import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchStages, saveStages } from '../features/stages/stagesThunks';

function Settings() {
  const globalStages = useSelector((state) => state.stages.stages);
  const dispatch = useDispatch();
  const [stages, setStages] = useState([]);

  useEffect(() => {
    dispatch(fetchStages());
  }, [dispatch]);

  useEffect(() => {
    if (globalStages.length > 0) {
      setStages(globalStages);
    }
  }, [globalStages]);

  const handleStageChange = (id, field, value) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleAddStage = () => {
    const newId = `stage_${Date.now()}`;
    const newStage = {
      id: newId,
      name: 'New Stage',
      color: '#3b82f6',
      position: stages.length + 1
    };
    setStages([...stages, newStage]);
  };

  const handleRemoveStage = (id) => {
    setStages(stages.filter(s => s.id !== id));
  };

  const handleSave = () => {
    dispatch(saveStages(stages));
    alert('Settings saved successfully!');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-brand-text bg-brand-bg">
      <header className="min-h-[76px] md:h-[76px] py-4 md:py-0 px-4 md:px-8 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 md:gap-0 border-b border-brand-border bg-brand-card z-10 shrink-0">
        <div className="text-xl font-bold tracking-tight text-brand-text text-center sm:text-left">CRM Settings</div>
        <div className="flex gap-4">
          <button 
            onClick={handleSave}
            className="bg-brand-accent text-white border-none py-2.5 px-6 rounded-lg font-medium text-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-accent/30 hover:bg-brand-accent-hover"
          >
            Save Settings
          </button>
        </div>
      </header>

      <div className="p-4 md:p-8 overflow-y-auto flex-1 scrollbar-hide">
        <div className="max-w-3xl flex flex-col gap-6 md:gap-8">
          
          {/* Pipeline Stages Section */}
          <section className="bg-brand-card p-7 rounded-2xl border border-brand-border shadow-soft">
            <h3 className="mb-2 text-brand-text text-lg font-bold tracking-tight">Pipeline Stages</h3>
            <p className="text-brand-text-muted mb-6 text-sm font-medium">
              Configure the stages that appear on your Kanban board.
            </p>
            
            <div className="flex flex-col gap-4">
              {stages.map((stage) => (
                <div key={stage.id} className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4 items-center group">
                  <input 
                    type="text" 
                    value={stage.name} 
                    onChange={(e) => handleStageChange(stage.id, 'name', e.target.value)}
                    className="flex-1 w-full sm:w-auto min-w-[150px] bg-brand-bg border border-brand-border text-brand-text px-4 py-2.5 rounded-xl transition-all focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 font-medium" 
                  />
                  <input 
                    type="color" 
                    value={stage.color} 
                    onChange={(e) => handleStageChange(stage.id, 'color', e.target.value)}
                    className="w-11 h-11 p-0 bg-transparent border-none cursor-pointer rounded-xl overflow-hidden shadow-sm shrink-0" 
                  />
                  <button 
                    onClick={() => handleRemoveStage(stage.id)}
                    className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-xl cursor-pointer transition-colors hover:bg-red-500 hover:text-white font-semibold text-sm opacity-100 sm:opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              <button 
                onClick={handleAddStage}
                className="bg-brand-bg text-brand-text-muted border border-brand-border py-3 rounded-xl cursor-pointer mt-2 hover:bg-brand-border hover:text-brand-text transition-colors font-bold text-sm shadow-sm flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                + Add Stage
              </button>
            </div>
          </section>

          {/* Webhook integration */}
          <section className="bg-brand-card p-7 rounded-2xl border border-brand-border shadow-soft">
            <h3 className="mb-2 text-brand-text text-lg font-bold tracking-tight">Easy Client Integration</h3>
            <p className="text-brand-text-muted mb-6 text-sm font-medium">
              Your webhook URL to paste into Easy Client for receiving automatic WhatsApp Leads.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                readOnly 
                value="http://localhost:4000/webhook/easyclient" 
                className="flex-1 bg-brand-bg border border-brand-border text-brand-accent font-mono px-5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all font-medium" 
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText("http://localhost:4000/webhook/easyclient");
                  alert('URL copied to clipboard!');
                }}
                className="bg-brand-accent text-white border-none py-3 px-6 rounded-xl font-bold text-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-accent/30 hover:bg-brand-accent-hover flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                Copy URL
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

export default Settings;
