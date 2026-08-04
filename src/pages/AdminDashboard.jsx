import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LogOut, FileText, CheckCircle, Clock, Users, Shield, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import AdminAnalytics from '../components/AdminAnalytics';

const STATUS_COLORS = {
  submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  assigned: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [issues, setIssues] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab] = useState('tickets');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      // Fetch all issues in system
      const issuesUrl = filterStatus ? `/issues?status=${filterStatus}` : '/issues';
      const issuesRes = await api.get(issuesUrl);
      if (issuesRes.data.status === 'success') {
        const list = issuesRes.data.data.issues;
        setIssues(list);
        
        // Default select first issue if selected one no longer exists
        if (list.length > 0) {
          setSelectedIssue(list[0]);
        } else {
          setSelectedIssue(null);
        }
      }

      // Fetch all officers for assignment
      const officersRes = await api.get('/users/officers');
      if (officersRes.data.status === 'success') {
        setOfficers(officersRes.data.data.officers);
      }
    } catch (err) {
      console.error('Error fetching admin workspace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [filterStatus]);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedOfficerId || !selectedIssue) return;

    setAssigning(true);
    setApiError(null);

    // Find the department matching the selected officer
    const officer = officers.find(o => o._id === selectedOfficerId);
    const departmentId = officer?.department?._id || officer?.department;

    try {
      const res = await api.patch(`/issues/${selectedIssue._id}/assign`, {
        officerId: selectedOfficerId,
        departmentId,
        remarks: `Assigned to officer ${officer?.name} by Administrator.`
      });

      if (res.data.status === 'success') {
        setSelectedOfficerId('');
        await fetchAdminData();
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to route assignment.');
    } finally {
      setAssigning(false);
    }
  };

  // Stats Counters
  const totalCount = issues.length;
  const pendingCount = issues.filter(i => ['submitted', 'assigned', 'in-progress'].includes(i.status)).length;
  const resolvedCount = issues.filter(i => i.status === 'resolved').length;

  if (loading && totalCount === 0) {
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
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-gradient block">CivicConnect</span>
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                System Administrator Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-300">
              Admin: <span className="text-red-400">{user.name}</span>
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

        {/* Tab selection */}
        <div className="flex gap-4 border-b border-slate-800 pb-1 text-sm">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`pb-2 px-1 border-b-2 font-bold transition-all cursor-pointer ${
              activeTab === 'tickets'
                ? 'border-indigo-500 text-indigo-400 animate-pulse-once'
                : 'border-transparent text-slate-500 hover:text-slate-350'
            }`}
          >
            Complaints Queue
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-2 px-1 border-b-2 font-bold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-indigo-500 text-indigo-400 animate-pulse-once'
                : 'border-transparent text-slate-500 hover:text-slate-350'
            }`}
          >
            System Analytics
          </button>
        </div>

        {activeTab === 'analytics' ? (
          <AdminAnalytics />
        ) : (
          <>
            {/* Counters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3.5 bg-blue-500/10 border border-blue-500/25 rounded-2xl text-blue-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-semibold block uppercase">Total Incidents</span>
                  <span className="text-2xl font-bold">{totalCount}</span>
                </div>
              </div>

              <div className="glass p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-amber-400">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-semibold block uppercase">Active Complaints</span>
                  <span className="text-2xl font-bold">{pendingCount}</span>
                </div>
              </div>

              <div className="glass p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-semibold block uppercase">Resolved Cases</span>
                  <span className="text-2xl font-bold">{resolvedCount}</span>
                </div>
              </div>
            </div>

            {/* Master Inspector Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left panel: Incidents search/grid list */}
              <div className="lg:col-span-5 glass p-5 rounded-2xl space-y-4 h-[550px] flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">Civic Complaints</h3>
                    <p className="text-slate-500 text-xs">All reported cases in city jurisdiction</p>
                  </div>
                  
                  {/* Filter */}
                  <div className="flex gap-2">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] focus:outline-none focus:border-indigo-500 text-slate-450 font-semibold"
                    >
                      <option value="">All Statuses</option>
                      <option value="submitted">Submitted</option>
                      <option value="assigned">Assigned</option>
                      <option value="in-progress">In-Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <button
                      onClick={fetchAdminData}
                      className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-450 hover:text-slate-205 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 mt-4 space-y-3 pr-1">
                  {issues.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500 space-y-2">
                      <AlertCircle className="w-8 h-8 opacity-40" />
                      <span className="text-xs">No matching issues found in the database.</span>
                    </div>
                  ) : (
                    issues.map((issue) => (
                      <button
                        key={issue._id}
                        onClick={() => {
                          setSelectedIssue(issue);
                          setApiError(null);
                          setSelectedOfficerId('');
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

              {/* Right panel: Inspector detailing and assignment tool */}
              <div className="lg:col-span-7 glass p-6 rounded-2xl h-[550px] overflow-y-auto">
                {selectedIssue ? (
                  <div className="space-y-6">
                    
                    {/* Details Header */}
                    <div className="border-b border-slate-800 pb-4 space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h2 className="text-xl font-bold">{selectedIssue.category}</h2>
                          <p className="text-slate-400 text-xs">
                            Reported by <span className="text-indigo-400 font-semibold">{selectedIssue.createdBy?.name || 'Citizen'}</span>
                          </p>
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

                    {/* Media and assignment options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      
                      {/* Photo Display */}
                      <div className="space-y-2">
                        <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Complaint Snapshot
                        </span>
                        <div className="rounded-xl overflow-hidden border border-slate-800 h-[180px] bg-slate-950">
                          <img 
                            src={selectedIssue.imageUrl.startsWith('/uploads') ? `http://localhost:5000${selectedIssue.imageUrl}` : selectedIssue.imageUrl} 
                            alt="Issue" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      </div>

                      {/* Assignment block */}
                      <div className="space-y-4">
                        <div>
                          <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Assignment & Ownership Status
                          </span>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-850">
                              <span className="text-slate-550">Department:</span>
                              <span className="font-semibold text-slate-300">{selectedIssue.department?.name || 'Unassigned'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-850">
                              <span className="text-slate-550">Assigned Officer:</span>
                              <span className="font-semibold text-slate-350">{selectedIssue.assignedTo?.name || 'None'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Routing form */}
                        {['submitted', 'assigned', 'in-progress'].includes(selectedIssue.status) && (
                          <form onSubmit={handleAssign} className="space-y-3 pt-2">
                            {apiError && (
                              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-[10px]">
                                {apiError}
                              </div>
                            )}
                            
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                Assign Officer
                              </label>
                              <select
                                value={selectedOfficerId}
                                onChange={(e) => setSelectedOfficerId(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-indigo-500 text-slate-300"
                                required
                              >
                                <option value="" disabled>Select officer...</option>
                                {officers.map(o => (
                                  <option key={o._id} value={o._id} className="text-slate-350">
                                    {o.name} ({o.department?.name || 'No Dept'})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <button
                              type="submit"
                              disabled={assigning || !selectedOfficerId}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-indigo-400 border border-indigo-500/35 text-white font-semibold rounded-lg transition-colors text-xs cursor-pointer flex items-center justify-center"
                            >
                              {assigning ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                'Assign & Acknowledge'
                              )}
                            </button>
                          </form>
                        )}
                      </div>

                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 space-y-2">
                    <AlertCircle className="w-10 h-10 opacity-30" />
                    <span className="text-sm">Select an incident from the grid list to inspect details.</span>
                  </div>
                )}
              </div>

            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
