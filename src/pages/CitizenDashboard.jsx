import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LogOut, FileText, CheckCircle, Clock, Plus, MapPin, AlertCircle } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';

const STATUS_COLORS = {
  submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  assigned: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const CitizenDashboard = () => {
  const { user, logout } = useAuth();
  const [allIssues, setAllIssues] = useState([]);
  const [myIssues, setMyIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch all unresolved issues for mapping
        const allRes = await api.get('/issues');
        if (allRes.data.status === 'success') {
          setAllIssues(allRes.data.data.issues);
        }

        // Fetch user's own reported issues
        const myRes = await api.get(`/issues?createdBy=${user._id}`);
        if (myRes.data.status === 'success') {
          setMyIssues(myRes.data.data.issues);
        }
      } catch (err) {
        setError('Failed to load dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user._id]);

  // Compute stat totals
  const totalReported = myIssues.length;
  const totalResolved = myIssues.filter((i) => i.status === 'resolved').length;
  const totalPending = myIssues.filter((i) => ['submitted', 'assigned', 'in-progress'].includes(i.status)).length;

  if (loading) {
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-gradient block">CivicConnect</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Citizen Hub</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-300">
              Welcome, <span className="text-indigo-400">{user.name}</span>
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

        {/* Status Dashboard Counter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/25 rounded-2xl text-blue-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 text-xs font-semibold block uppercase">Total Reported</span>
              <span className="text-2xl font-bold">{totalReported}</span>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-amber-400">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-slate-400 text-xs font-semibold block uppercase">Pending Action</span>
              <span className="text-2xl font-bold">{totalPending}</span>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 text-xs font-semibold block uppercase">Resolved Issues</span>
              <span className="text-2xl font-bold">{totalResolved}</span>
            </div>
          </div>
        </div>

        {/* Map & Actions split view */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Map canvas */}
          <div className="lg:col-span-2 glass p-5 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Active Issue Heatmap</h3>
                <p className="text-slate-500 text-xs">Real-time localized civic incidents reported in your area</p>
              </div>
              <Link
                to="/report-issue"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/35 text-white font-semibold text-xs rounded-xl shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Report Issue
              </Link>
            </div>

            <div className="w-full h-[360px] rounded-xl overflow-hidden border border-slate-800 shadow-inner relative z-10">
              <MapContainer
                center={[12.9716, 77.5946]} // Default center coords
                zoom={12}
                style={{ height: '100%', width: '100%', background: '#0b0f19' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
                />
                {allIssues.map((issue) => (
                  <Marker 
                    key={issue._id} 
                    position={[issue.location.coordinates[1], issue.location.coordinates[0]]}
                  >
                    <Popup className="leaflet-popup-dark">
                      <div className="p-2 space-y-1.5 max-w-[200px]">
                        <h4 className="font-bold text-sm text-slate-100 border-b border-slate-800 pb-1">{issue.category}</h4>
                        <p className="text-slate-400 text-xs line-clamp-2">{issue.description}</p>
                        <div className="flex justify-between items-center pt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-semibold border ${STATUS_COLORS[issue.status] || ''}`}>
                            {issue.status}
                          </span>
                          <Link to={`/issues/${issue._id}`} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                            View details
                          </Link>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Quick list of user's own reports */}
          <div className="glass p-5 rounded-2xl flex flex-col justify-between h-[450px]">
            <div>
              <h3 className="font-bold text-lg">My Reported Complaints</h3>
              <p className="text-slate-500 text-xs">Tracking statuses of reports filed by you</p>
            </div>

            <div className="overflow-y-auto flex-1 mt-4 space-y-3 pr-1">
              {myIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500 space-y-2">
                  <AlertCircle className="w-8 h-8 opacity-40 text-slate-400" />
                  <span className="text-xs">You have not submitted any complaints yet.</span>
                </div>
              ) : (
                myIssues.map((issue) => (
                  <Link 
                    key={issue._id} 
                    to={`/issues/${issue._id}`} 
                    className="flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/60 rounded-xl transition-all group"
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
                  </Link>
                ))
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default CitizenDashboard;
