import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LogOut, FileText, CheckCircle, Clock, Upload, AlertCircle, RefreshCw } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';

const STATUS_COLORS = {
  submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  assigned: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const OfficerDashboard = () => {
  const { user, logout } = useAuth();
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [apiError, setApiError] = useState(null);

  const fetchDepartmentIssues = async () => {
    try {
      setLoading(true);
      // Fetch issues assigned to the officer's department
      const res = await api.get(`/issues?department=${user.department._id || user.department}`);
      if (res.data.status === 'success') {
        setIssues(res.data.data.issues);
        // Default select first issue if exists
        if (res.data.data.issues.length > 0) {
          setSelectedIssue(res.data.data.issues[0]);
        } else {
          setSelectedIssue(null);
        }
      }
    } catch (err) {
      console.error('Error fetching department complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.department) {
      fetchDepartmentIssues();
    }
  }, [user.department]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResolutionPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!statusInput) return;
    if (statusInput === 'resolved' && !resolutionPhoto) {
      setApiError('A completion photograph is required to resolve issues.');
      return;
    }

    setUpdating(true);
    setApiError(null);

    const formData = new FormData();
    formData.append('status', statusInput);
    formData.append('remarks', remarks);
    if (resolutionPhoto) {
      formData.append('image', resolutionPhoto);
    }

    try {
      const res = await api.patch(`/issues/${selectedIssue._id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.status === 'success') {
        setRemarks('');
        setStatusInput('');
        setResolutionPhoto(null);
        setPhotoPreview(null);
        
        // Refresh local issues
        await fetchDepartmentIssues();
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to update issue state.');
    } finally {
      setUpdating(false);
    }
  };

  // Stats calculation
  const totalAssigned = issues.length;
  const inProgressCount = issues.filter(i => i.status === 'in-progress').length;
  const resolvedCount = issues.filter(i => i.status === 'resolved').length;

  if (loading && totalAssigned === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-gradient block">CivicConnect</span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                Officer Console ({user.department?.name || 'Department Officer'})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-300">
              Officer: <span className="text-indigo-400">{user.name}</span>
            </span>
            <NotificationBell />
            <button
              onClick={logout}
              className="p-2.5 bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-xl transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Counter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3.5 bg-purple-500/10 border border-purple-500/25 rounded-2xl text-purple-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 text-xs font-semibold block uppercase">Department Queue</span>
              <span className="text-2xl font-bold">{totalAssigned}</span>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-amber-400">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-slate-400 text-xs font-semibold block uppercase">In Progress</span>
              <span className="text-2xl font-bold">{inProgressCount}</span>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 text-xs font-semibold block uppercase">Resolved Works</span>
              <span className="text-2xl font-bold">{resolvedCount}</span>
            </div>
          </div>
        </div>

        {/* Split Screen Master View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left panel: Queue listing */}
          <div className="lg:col-span-5 glass p-5 rounded-2xl space-y-4 h-[550px] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Assigned Incidents</h3>
                <p className="text-slate-500 text-xs">Work queue for your department</p>
              </div>
              <button 
                onClick={fetchDepartmentIssues}
                className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
                title="Refresh queue"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 mt-4 space-y-3 pr-1">
              {issues.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500 space-y-2">
                  <AlertCircle className="w-8 h-8 opacity-40" />
                  <span className="text-xs">No issues currently assigned to your department.</span>
                </div>
              ) : (
                issues.map((issue) => (
                  <button
                    key={issue._id}
                    onClick={() => {
                      setSelectedIssue(issue);
                      setApiError(null);
                    }}
                    className={`w-full text-left flex items-center gap-3 p-3 border rounded-xl transition-all group cursor-pointer ${
                      selectedIssue?._id === issue._id
                        ? 'bg-indigo-600/10 border-indigo-500/50 shadow-md shadow-indigo-500/5'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700/60'
                    }`}
                  >
                    <img
                      src={issue.imageUrl.startsWith('/uploads') ? `http://localhost:5000${issue.imageUrl}` : issue.imageUrl}
                      alt={issue.category}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-950 border border-slate-800 shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-xs font-bold text-slate-200 truncate group-hover:text-indigo-400 transition-colors">
                          {issue.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-mono font-bold border shrink-0 ${STATUS_COLORS[issue.status] || ''}`}>
                          {issue.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{issue.address}</p>
                    </div>
                  </button>
                ))
              )}
            </div>

          </div>

          {/* Right panel: Detail inspection & Updates */}
          <div className="lg:col-span-7 glass p-6 rounded-2xl h-[550px] overflow-y-auto">
            {selectedIssue ? (
              <div className="space-y-6">
                
                {/* Details Header */}
                <div className="border-b border-slate-800 pb-4 space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h2 className="text-xl font-bold">{selectedIssue.category}</h2>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">ID: {selectedIssue._id}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs uppercase font-mono font-bold border ${STATUS_COLORS[selectedIssue.status] || ''}`}>
                      {selectedIssue.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">{selectedIssue.description}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{selectedIssue.address}</span>
                  </div>
                </div>

                {/* Main Media Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl overflow-hidden border border-slate-800 h-[160px] bg-slate-950">
                    <img 
                      src={selectedIssue.imageUrl.startsWith('/uploads') ? `http://localhost:5000${selectedIssue.imageUrl}` : selectedIssue.imageUrl} 
                      alt="Complaint snapshot" 
                      className="w-full h-full object-cover" 
                    />
                  </div>

                  {/* Operational Status update form */}
                  <form onSubmit={handleStatusUpdate} className="space-y-3">
                    
                    {/* Error Alerts */}
                    {apiError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{apiError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Transition Status To
                      </label>
                      <select
                        value={statusInput}
                        onChange={(e) => setStatusInput(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-indigo-500 text-slate-300"
                        required
                      >
                        <option value="" disabled>Select transition...</option>
                        {selectedIssue.status === 'submitted' && <option value="assigned">Acknowledge (Assign)</option>}
                        {['submitted', 'assigned'].includes(selectedIssue.status) && <option value="in-progress">Mark In-Progress</option>}
                        {['assigned', 'in-progress'].includes(selectedIssue.status) && <option value="resolved">Mark Resolved (Fix Done)</option>}
                        {['submitted', 'assigned', 'in-progress'].includes(selectedIssue.status) && <option value="rejected">Reject Complaint</option>}
                      </select>
                    </div>

                    {statusInput === 'resolved' && (
                      <div className="space-y-2">
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Completion Photograph
                        </label>
                        {photoPreview ? (
                          <div className="relative rounded-lg overflow-hidden border border-slate-850 h-[80px]">
                            <img src={photoPreview} alt="Resolution preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => { setResolutionPhoto(null); setPhotoPreview(null); }}
                              className="absolute top-1 right-1 px-1.5 py-0.5 bg-red-600 text-[8px] font-bold rounded text-white"
                            >
                              Reset
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-800 hover:border-indigo-500/50 rounded-lg cursor-pointer bg-slate-900/10 text-xs font-semibold text-slate-400 hover:text-slate-300 transition-colors">
                            <Upload className="w-4 h-4 text-slate-500" />
                            <span>Select photo...</span>
                            <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} required />
                          </label>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Resolution Notes / Remarks
                      </label>
                      <textarea
                        rows={2}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Add remarks or notes explaining actions taken..."
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-indigo-500 text-slate-350 resize-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={updating || !statusInput}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-indigo-400 border border-indigo-500/35 text-white font-semibold rounded-lg transition-colors text-xs cursor-pointer flex items-center justify-center"
                    >
                      {updating ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        'Submit Status Update'
                      )}
                    </button>
                  </form>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 space-y-2">
                <AlertCircle className="w-10 h-10 opacity-30" />
                <span className="text-sm">Select an incident from the queue to manage.</span>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default OfficerDashboard;
