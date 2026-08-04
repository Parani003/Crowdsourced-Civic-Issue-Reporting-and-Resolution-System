import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ArrowLeft, ThumbsUp, Send, Calendar, User, MapPin, Shield, CheckCircle2, Clock } from 'lucide-react';

const STATUS_COLORS = {
  submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  assigned: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const IssueDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const [upvoting, setUpvoting] = useState(false);

  const fetchIssueDetails = async () => {
    try {
      const issueRes = await api.get(`/issues/${id}`);
      if (issueRes.data.status === 'success') {
        setIssue(issueRes.data.data.issue);
      }

      const commentsRes = await api.get(`/issues/${id}/comments`);
      if (commentsRes.data.status === 'success') {
        setComments(commentsRes.data.data.comments);
      }
    } catch (err) {
      console.error('Error fetching issue details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssueDetails();
  }, [id]);

  const handleUpvote = async () => {
    if (upvoting || !issue) return;
    setUpvoting(true);
    try {
      const res = await api.post(`/issues/${issue._id}/upvote`);
      if (res.data.status === 'success') {
        setIssue(prev => ({
          ...prev,
          upvotes: res.data.data.upvotes,
        }));
      }
    } catch (err) {
      console.error('Error toggling upvote:', err);
    } finally {
      setUpvoting(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || commenting) return;

    setCommenting(true);
    try {
      const res = await api.post(`/issues/${issue._id}/comments`, { text: newComment });
      if (res.data.status === 'success') {
        setComments(prev => [...prev, res.data.data.comment]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Error writing comment:', err);
    } finally {
      setCommenting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400 space-y-4">
        <span className="text-sm">Issue details not found.</span>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-indigo-650 hover:bg-indigo-550 text-white rounded-lg">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isUpvotedByMe = issue.upvotes?.includes(user._id);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Complaint Inspection</h1>
            <p className="text-slate-500 text-xs">Verify status track records, endorse priority, and discuss resolution plans</p>
          </div>
        </div>

        {/* Dynamic Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Block: Photo, Info, and Timeline */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Master Card Details */}
            <div className="glass p-6 rounded-2xl space-y-5">
              <div className="rounded-xl overflow-hidden border border-slate-850 h-[300px] bg-slate-950">
                <img 
                  src={issue.imageUrl.startsWith('/uploads') ? `http://localhost:5000${issue.imageUrl}` : issue.imageUrl} 
                  alt={issue.category} 
                  className="w-full h-full object-cover" 
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-100">{issue.category}</h2>
                    <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold mt-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{issue.address}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs uppercase font-mono font-bold border ${STATUS_COLORS[issue.status] || ''}`}>
                    {issue.status}
                  </span>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed border-t border-slate-850 pt-4">
                  {issue.description}
                </p>

                {/* Engagement Bar */}
                <div className="flex justify-between items-center border-t border-slate-850 pt-4">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4 text-indigo-400" />
                      <span>Reporter: <strong className="text-slate-300">{issue.createdBy?.name || 'Citizen'}</strong></span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      <span>Reported: <strong className="text-slate-300">{new Date(issue.createdAt).toLocaleDateString()}</strong></span>
                    </span>
                  </div>

                  {/* Upvote triggers */}
                  <button
                    onClick={handleUpvote}
                    disabled={upvoting}
                    className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer hover:-translate-y-0.5 ${
                      isUpvotedByMe
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-indigo-500/5'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${isUpvotedByMe ? 'fill-current' : ''}`} />
                    <span>Upvote ({issue.upvotes?.length || 0})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Vertical Milestone statusTimeline */}
            <div className="glass p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-lg">Resolution Status Timeline</h3>
              <div className="relative pl-6 border-l border-slate-800 space-y-6 pt-2">
                {issue.statusTimeline?.map((milestone, idx) => (
                  <div key={milestone._id || idx} className="relative space-y-1">
                    
                    {/* Circle bullet nodes */}
                    <span className="absolute -left-[31px] top-1 flex items-center justify-center w-4 h-4 rounded-full bg-slate-950 border-2 border-indigo-500 text-indigo-500">
                      {milestone.status === 'resolved' ? (
                        <CheckCircle2 className="w-2.5 h-2.5 fill-current" />
                      ) : (
                        <Clock className="w-2.5 h-2.5" />
                      )}
                    </span>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold uppercase tracking-wider text-indigo-300">
                        {milestone.status}
                      </span>
                      <span className="text-slate-550 font-medium">
                        {new Date(milestone.updatedAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-slate-400 text-sm">{milestone.remarks}</p>

                    <div className="text-[10px] text-slate-500">
                      Updated by <span className="font-semibold">{milestone.updatedBy?.name}</span> ({milestone.updatedBy?.role})
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Block: Discussion comments stream */}
          <div className="lg:col-span-5 glass p-6 rounded-2xl flex flex-col justify-between h-[650px] space-y-4">
            <div>
              <h3 className="font-bold text-lg">Incident Discussion</h3>
              <p className="text-slate-550 text-xs">Citizen-Officer coordination thread</p>
            </div>

            {/* Comment Thread listing */}
            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center p-6 space-y-1.5">
                  <svg className="w-8 h-8 opacity-30 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-xs">No comments posted yet. Start the conversation!</span>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="p-3 bg-slate-900/40 border border-slate-850/80 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-indigo-400">{comment.user?.name}</span>
                        <span className="uppercase px-1.5 py-0.5 rounded bg-slate-950 text-slate-500 border border-slate-800 font-mono scale-90">
                          {comment.user?.role}
                        </span>
                      </div>
                      <span className="text-slate-600 font-medium">
                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{comment.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Post Input Box */}
            <form onSubmit={handlePostComment} className="pt-4 border-t border-slate-850/70 flex gap-2">
              <input
                type="text"
                placeholder="Post a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:border-indigo-500/80 text-sm text-slate-250 transition-colors placeholder:text-slate-650"
                required
              />
              <button
                type="submit"
                disabled={commenting || !newComment.trim()}
                className="p-2.5 bg-indigo-650 hover:bg-indigo-550 border border-indigo-500/35 disabled:bg-indigo-950 disabled:text-indigo-400 rounded-xl text-white transition-all shadow-md cursor-pointer flex items-center justify-center shrink-0"
              >
                {commenting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>

          </div>

        </div>

      </div>
    </div>
  );
};

export default IssueDetails;
