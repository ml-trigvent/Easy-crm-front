import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTasks, completeTaskAsync, createTask, deleteTaskAsync } from '../features/tasks/tasksThunks';
import { fetchAllLeads } from '../features/leads/leadsThunks';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Toast from '../components/Toast';

function Pending() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    dispatch(fetchAllLeads());
    dispatch(fetchTasks());
  }, [dispatch]);

  const tasks = useSelector((state) => state.tasks.tasks);
  const leads = useSelector((state) => state.leads.allLeads);
  const pendingTasks = tasks.filter(t => !t.completed);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(pendingTasks.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const indexOfLastTask = validCurrentPage * itemsPerPage;
  const indexOfFirstTask = indexOfLastTask - itemsPerPage;
  const currentTasks = pendingTasks.slice(indexOfFirstTask, indexOfLastTask);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [pendingTasks.length, totalPages, currentPage]);

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

  const getLeadName = (leadId) => {
    const lead = leads.find(l => l.id.toString() === leadId.toString());
    return lead ? lead.name : 'Unknown';
  };

  const handleComplete = async (e, taskId) => {
    e.stopPropagation();
    try {
      await dispatch(completeTaskAsync(taskId)).unwrap();
      showToast('Task completed successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e, taskId) => {
    e.stopPropagation();
    try {
      await dispatch(deleteTaskAsync(taskId)).unwrap();
      showToast('Task deleted successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  const formik = useFormik({
    initialValues: {
      title: '',
      leadId: '',
      priority: 'Medium',
      dueDate: ''
    },

    validationSchema: Yup.object({
      title: Yup.string().min(3, 'Title must be at least 3 characters').required('Required'),
      leadId: Yup.string().required('Required'),
      priority: Yup.string().oneOf(['Low', 'Medium', 'High']).required('Required'),
      dueDate: Yup.date().required('Required')
    }),

    onSubmit: async (values, { resetForm }) => {
      try {
        await dispatch(createTask(values)).unwrap();
        resetForm();
        setIsModalOpen(false);
        showToast('Task created successfully!');
      } catch (err) {
        console.error(err);
      }
    },
  });

  return (
    <div className="flex flex-col h-full overflow-hidden text-brand-text bg-brand-bg relative">
      <header className="min-h-[76px] md:h-[76px] py-4 md:py-0 px-4 md:px-8 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 md:gap-0 border-b border-brand-border bg-brand-card z-10 shrink-0">
        <div className="text-xl font-bold tracking-tight text-brand-text text-center sm:text-left">Pending Tasks</div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-accent text-white border-none py-2.5 px-5 rounded-lg font-medium text-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-accent/30 hover:bg-brand-accent-hover flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Task
          </button>
        </div>
      </header>

      <div className="p-4 md:p-8 overflow-y-auto flex-1 scrollbar-hide">
        {pendingTasks.length === 0 ? (
          <div className="bg-brand-card p-12 rounded-2xl border border-brand-border text-center text-brand-text-muted shadow-soft flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-30 text-gray-400">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h3 className="text-xl font-bold text-brand-text mb-2">All Caught Up!</h3>
            <p className="text-[15px]">You have no pending tasks right now.</p>
          </div>
        ) : (
          <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
              <thead className="bg-brand-bg border-b border-brand-border">
                <tr>
                  <th className="px-6 py-4 font-semibold text-brand-text-muted text-xs uppercase tracking-wider">Task</th>
                  <th className="px-6 py-4 font-semibold text-brand-text-muted text-xs uppercase tracking-wider">Lead</th>
                  <th className="px-6 py-4 font-semibold text-brand-text-muted text-xs uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 font-semibold text-brand-text-muted text-xs uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-4 font-semibold text-brand-text-muted text-xs uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentTasks.map((task) => (
                  <tr 
                    key={task.id} 
                    className="border-b border-brand-border cursor-pointer transition-colors duration-200 hover:bg-brand-bg group"
                    onClick={() => navigate(`/lead/${task.leadId}`)}
                  >
                    <td className="px-6 py-4 font-medium text-brand-text group-hover:text-brand-accent transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : task.priority === 'Medium' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`}></div>
                        {task.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-brand-accent font-medium">{getLeadName(task.leadId)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                        task.priority === 'High' ? 'bg-red-500/20 text-red-400' : 
                        task.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-brand-text-muted text-sm font-medium">{task.dueDate}</td>
                     <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <button 
                           className="bg-brand-bg text-brand-text-muted border border-brand-border px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 hover:bg-brand-border hover:text-brand-text shadow-sm"
                           onClick={(e) => handleComplete(e, task.id)}
                         >
                           Complete
                         </button>
                         <button 
                           type="button"
                           className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200 inline-flex items-center justify-center shadow-sm"
                           onClick={(e) => handleDelete(e, task.id)}
                           title="Delete Task"
                         >
                           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                         </button>
                       </div>
                     </td>
                  </tr>
                ))}
              {pendingTasks.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-brand-text-muted font-medium">
                    No pending tasks found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          {/* Pagination Controls */}
          {pendingTasks.length > 0 && (
            <div className="px-6 py-4 bg-brand-card border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-brand-text-muted font-medium">
                Showing <span className="text-white font-semibold">{indexOfFirstTask + 1}</span> to <span className="text-white font-semibold">{Math.min(indexOfLastTask, pendingTasks.length)}</span> of <span className="text-white font-semibold">{pendingTasks.length}</span> tasks
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                        validCurrentPage === pageNum
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
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-brand-card border border-brand-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-brand-border flex justify-between items-center bg-brand-bg/50">
              <h2 className="text-xl font-bold text-brand-text m-0">Create New Task</h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  formik.resetForm();
                }}
                className="bg-transparent border-none text-brand-text-muted hover:text-brand-text cursor-pointer p-1 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="create-task-form" onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-brand-text-muted">Task Title</label>
                  <input 
                    name="title"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.title}
                    type="text" 
                    placeholder="E.g., Call client..." 
                    className={`w-full bg-brand-bg border ${formik.touched.title && formik.errors.title ? 'border-red-500' : 'border-brand-border'} rounded-lg px-4 py-2.5 text-brand-text focus:outline-none focus:border-brand-accent transition-colors`}
                  />
                  {formik.touched.title && formik.errors.title ? (
                    <div className="text-red-500 text-xs">{formik.errors.title}</div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-brand-text-muted">Related Lead</label>
                  <select 
                    name="leadId"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.leadId}
                    className={`w-full bg-brand-bg border ${formik.touched.leadId && formik.errors.leadId ? 'border-red-500' : 'border-brand-border'} rounded-lg px-4 py-2.5 text-brand-text focus:outline-none focus:border-brand-accent transition-colors`}
                  >
                    <option value="">Select a lead</option>
                    {leads.map(lead => (
                      <option key={lead.id} value={lead.id}>{lead.name}</option>
                    ))}
                  </select>
                  {formik.touched.leadId && formik.errors.leadId ? (
                    <div className="text-red-500 text-xs">{formik.errors.leadId}</div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-brand-text-muted">Priority</label>
                  <select 
                    name="priority"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.priority}
                    className={`w-full bg-brand-bg border ${formik.touched.priority && formik.errors.priority ? 'border-red-500' : 'border-brand-border'} rounded-lg px-4 py-2.5 text-brand-text focus:outline-none focus:border-brand-accent transition-colors`}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                  {formik.touched.priority && formik.errors.priority ? (
                    <div className="text-red-500 text-xs">{formik.errors.priority}</div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-brand-text-muted">Due Date</label>
                  <input 
                    name="dueDate"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.dueDate}
                    type="date" 
                    className={`w-full bg-brand-bg border ${formik.touched.dueDate && formik.errors.dueDate ? 'border-red-500' : 'border-brand-border'} rounded-lg px-4 py-2.5 text-brand-text focus:outline-none focus:border-brand-accent transition-colors`}
                    style={{ colorScheme: 'dark' }}
                  />
                  {formik.touched.dueDate && formik.errors.dueDate ? (
                    <div className="text-red-500 text-xs">{formik.errors.dueDate}</div>
                  ) : null}
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-3 bg-brand-bg/50 mt-auto">
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  formik.resetForm();
                }}
                className="bg-transparent border border-brand-border text-brand-text px-4 py-2 rounded-lg font-medium hover:bg-brand-border transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="create-task-form"
                disabled={formik.isSubmitting}
                className="bg-brand-accent text-white border-none px-4 py-2 rounded-lg font-medium hover:bg-brand-accent-hover transition-colors shadow-sm disabled:opacity-50"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
      <Toast message={toast} position="top-right" onClose={() => setToast(null)} />
    </div>
  );
}

export default Pending;
