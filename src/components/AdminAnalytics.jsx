import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { BarChart, PieChart, TrendingUp, Clock, FileText, CheckCircle } from 'lucide-react';

const CHART_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'];

const AdminAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/issues/analytics');
        if (res.data.status === 'success') {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching analytics details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-transparent">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-center text-slate-500 text-xs">
        Failed to load analytical charts.
      </div>
    );
  }

  const { overallStats, categoryStats, statusStats, departmentStats, monthlyTrend } = stats;

  // Pie Chart calculations
  const totalCategoryIssues = categoryStats.reduce((sum, item) => sum + item.count, 0);
  let accumulatedPercent = 0;
  const pieSlices = categoryStats.slice(0, 5).map((item, idx) => {
    const percent = totalCategoryIssues > 0 ? (item.count / totalCategoryIssues) * 100 : 0;
    const strokeDasharray = `${percent} ${100 - percent}`;
    const strokeDashoffset = 100 - accumulatedPercent + 25; // 25 to start drawing from top (12 o'clock)
    accumulatedPercent += percent;
    return {
      ...item,
      color: CHART_COLORS[idx % CHART_COLORS.length],
      strokeDasharray,
      strokeDashoffset,
    };
  });

  // Line Chart trends plotting
  const maxTrendVal = Math.max(...monthlyTrend.map((m) => m.count), 5);
  const linePoints = monthlyTrend.map((m, idx) => {
    const x = 40 + idx * 70; // 5 points spread across 350px width canvas
    const y = 160 - (m.count / maxTrendVal) * 120; // scale values on a 150px height graph
    return { x, y, label: m._id, value: m.count };
  });
  const polylinePointsString = linePoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="space-y-6">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Total Complaints</span>
            <span className="text-xl font-bold">{overallStats.totalCount}</span>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Case Solved</span>
            <span className="text-xl font-bold">{overallStats.resolvedCount}</span>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Avg Resolution Time</span>
            <span className="text-xl font-bold">{overallStats.avgResolutionTimeHours} hrs</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category distribution donut chart */}
        <div className="glass p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <PieChart className="w-5 h-5 text-indigo-400" />
            <h4 className="font-bold text-sm">Issue Categories Distribution</h4>
          </div>
          {categoryStats.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-500">No category statistics available.</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
              {/* SVG Donut Circle */}
              <div className="relative w-36 h-36">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="5" />
                  {pieSlices.map((slice, idx) => (
                    <circle
                      key={slice._id}
                      cx="21"
                      cy="21"
                      r="15.915"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="5.2"
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      className="transition-all duration-500"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-slate-400">Total</span>
                  <span className="text-lg font-black text-slate-100">{totalCategoryIssues}</span>
                </div>
              </div>

              {/* Legends */}
              <div className="space-y-2 flex-1 text-xs">
                {pieSlices.map((slice) => (
                  <div key={slice._id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }}></span>
                      <span className="text-slate-350 truncate max-w-[120px]">{slice._id}</span>
                    </div>
                    <span className="font-bold text-slate-200">{slice.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Monthly Trend line chart */}
        <div className="glass p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h4 className="font-bold text-sm">Monthly Incident Trends</h4>
          </div>
          {monthlyTrend.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-500">No monthly trends logged.</div>
          ) : (
            <div className="py-2 flex flex-col justify-center items-center w-full">
              <svg className="w-full h-44 overflow-visible" viewBox="0 0 360 180">
                {/* Horizontal Grid lines */}
                <line x1="30" y1="40" x2="330" y2="40" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="30" y1="100" x2="330" y2="100" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="30" y1="160" x2="330" y2="160" stroke="#334155" strokeWidth="1" />

                {/* Trend Polyline */}
                {linePoints.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="url(#trend-gradient)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    points={polylinePointsString}
                  />
                )}
                
                {/* Area Gradient fill */}
                <defs>
                  <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>

                {/* Points Circle */}
                {linePoints.map((point, idx) => (
                  <g key={idx} className="group cursor-pointer">
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="4.5"
                      fill="#6366f1"
                      stroke="#0f172a"
                      strokeWidth="2.2"
                    />
                    <text
                      x={point.x}
                      y={point.y - 12}
                      textAnchor="middle"
                      className="text-[9px] font-bold fill-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {point.value}
                    </text>
                    <text
                      x={point.x}
                      y="176"
                      textAnchor="middle"
                      className="text-[8px] fill-slate-500 font-semibold"
                    >
                      {point.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </div>

        {/* Department performance stats */}
        <div className="glass p-6 rounded-2xl space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <BarChart className="w-5 h-5 text-indigo-400" />
            <h4 className="font-bold text-sm">Department Performance Metrics</h4>
          </div>
          {departmentStats.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-xs text-slate-500">
              No department performance metrics logged yet (requires resolved complaints).
            </div>
          ) : (
            <div className="space-y-4">
              {departmentStats.map((dept) => (
                <div key={dept.departmentName} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-350">{dept.departmentName}</span>
                    <div className="flex gap-4 font-mono font-bold text-[10px]">
                      <span className="text-emerald-400">Solved: {dept.resolvedCount}</span>
                      <span className="text-amber-400">Avg Speed: {dept.avgResolutionTimeHours} hrs</span>
                    </div>
                  </div>
                  {/* Progress bar representing solved count relative to overall solved count */}
                  <div className="w-full bg-slate-900 border border-slate-850 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((dept.resolvedCount / (overallStats.resolvedCount || 1)) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default AdminAnalytics;
