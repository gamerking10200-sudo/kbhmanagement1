import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  CheckCheck, 
  Trash2, 
  Check, 
  ShieldAlert, 
  Fuel, 
  KeyRound, 
  Coins, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { AppTheme, BroadcastNotification } from '../types';

interface NotificationsModalProps {
  theme?: AppTheme;
  notifications: BroadcastNotification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onDeleteNotification?: (id: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  theme = 'iphone-dark',
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onDeleteNotification,
}) => {
  const isLight = theme === 'iphone-light';
  const [filter, setFilter] = useState<'all' | 'unread' | 'audit' | 'system'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'audit') return n.type === 'audit_action';
    if (filter === 'system') return n.type !== 'audit_action';
    return true;
  });

  const getIcon = (type: BroadcastNotification['type']) => {
    switch (type) {
      case 'audit_action':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'entry_reset':
        return <RotateCcw className="w-4 h-4 text-rose-400" />;
      case 'investment_override':
        return <Coins className="w-4 h-4 text-amber-400" />;
      case 'password_change':
        return <KeyRound className="w-4 h-4 text-indigo-400" />;
      case 'station_added':
      case 'station_status':
        return <Fuel className="w-4 h-4 text-blue-400" />;
      default:
        return <Bell className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div
        className={`relative w-full max-w-2xl rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all my-8 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-inherit">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-500">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">
                  Terminal Notification Center
                </h2>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Audit alerts, closing submissions, status changes & executive overrides
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4 pt-1">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl border bg-slate-950/40 border-inherit text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('audit')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filter === 'audit'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Audits
            </button>
          </div>

          {/* Bulk Buttons */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs font-bold transition-all cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="mt-4 space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No notifications matching current filter.
            </div>
          ) : (
            filtered.map(item => {
              const isUnread = !item.read;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                    isUnread
                      ? isLight
                        ? 'bg-blue-50/70 border-blue-200 text-slate-900 shadow-sm'
                        : 'bg-slate-800/90 border-blue-500/40 text-white shadow-md'
                      : isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-700 opacity-80'
                      : 'bg-slate-850/60 border-slate-800 text-slate-300 opacity-80'
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-xl bg-slate-900 border border-slate-700/60 shrink-0">
                    {getIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">{item.title}</span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {onDeleteNotification && (
                          <button
                            type="button"
                            onClick={() => onDeleteNotification(item.id)}
                            title="Dismiss notification"
                            className="text-slate-400 hover:text-rose-400 p-1 rounded-md transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs mt-1 text-slate-400 leading-relaxed break-words">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-inherit text-[10px] text-slate-400">
                      <span>By: <b className="text-slate-300">{item.actor}</b> {item.station ? `• Station: ${item.station}` : ''}</span>

                      <div className="flex items-center gap-3">
                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => onMarkAsRead(item.id)}
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark Read</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-inherit mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
