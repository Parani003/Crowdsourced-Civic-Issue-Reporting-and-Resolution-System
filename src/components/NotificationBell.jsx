import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Bell, Check, MailOpen, AlertCircle } from 'lucide-react';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.status === 'success') {
        const list = res.data.data.notifications;
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Setup background polling (every 15 seconds)
    const interval = setInterval(fetchNotifications, 15000);

    // Event listener to close dropdown on clicking outside
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notif) => {
    setIsOpen(false);
    try {
      if (!notif.isRead) {
        await api.patch(`/notifications/${notif._id}/read`);
        fetchNotifications();
      }
      navigate(`/issues/${notif.issue}`);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all cursor-pointer relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-650 text-[10px] font-bold text-white ring-2 ring-slate-950 animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 glass rounded-2xl shadow-2xl overflow-hidden z-[1000] border border-slate-800/80 animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-slate-850 flex justify-between items-center bg-slate-950/40">
            <span className="font-bold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-850">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 space-y-1.5 flex flex-col items-center">
                <MailOpen className="w-6 h-6 opacity-30 text-slate-400" />
                <span className="text-xs">All caught up! No notifications.</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left p-3.5 transition-colors flex gap-2 cursor-pointer ${
                    notif.isRead ? 'bg-transparent text-slate-400' : 'bg-indigo-500/5 text-slate-200'
                  } hover:bg-slate-900/60`}
                >
                  <div className="mt-0.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${notif.isRead ? 'bg-transparent' : 'bg-indigo-500'}`}></div>
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-xs leading-normal font-medium">{notif.message}</p>
                    <span className="text-[9px] text-slate-500 font-semibold uppercase block">
                      {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
