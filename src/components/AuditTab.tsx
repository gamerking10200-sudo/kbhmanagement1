import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Bell, 
  Gauge, 
  Fuel, 
  FileCheck, 
  Search,
  MessageSquare,
  UserCheck,
  Trash2,
  CheckCheck,
  Archive,
  Filter
} from 'lucide-react';
import { AuditRecord, AuditStatus, BroadcastNotification, StationBalance, StationEntry, UserSession } from '../types';
import { formatDate, formatDateTime } from '../utils/formatters';

interface AuditTabProps {
  session: UserSession;
  audits: AuditRecord[];
  notifications: BroadcastNotification[];
  stationBalances: StationBalance[];
  entries: StationEntry[];
  onUpdateAuditStatus: (auditId: string, status: AuditStatus, notes?: string) => void;
  onDeleteAudit?: (auditId: string) => void;
  onClearAllAudits?: () => void;
  onDeleteNotification?: (notificationId: string) => void;
  onClearAllNotifications?: () => void;
}

export const AuditTab: React.FC<AuditTabProps> = ({
  session,
  audits,
  notifications,
  stationBalances,
  entries,
  onUpdateAuditStatus,
  onDeleteAudit,
  onClearAllAudits,
  onDeleteNotification,
  onClearAllNotifications,
}) => {
  const [activeTab, setActiveTab] = useState<'issues' | 'notifications'>('issues');
  const [auditFilter, setAuditFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [actionNotesInput, setActionNotesInput] = useState<{ [key: string]: string }>({});
  const [confirmClearAudits, setConfirmClearAudits] = useState(false);
  const [deletingAuditId, setDeletingAuditId] = useState<string | null>(null);

  // Check if today has entries
  const today = new Date().toISOString().split('T')[0];
  const stationNames = stationBalances.map(s => s.station);
  const missingToday = stationNames.filter(st => !entries.find(e => e.station === st && e.date === today));

  const handleAction = (auditId: string, status: AuditStatus) => {
    const note = actionNotesInput[auditId] || `Status updated to ${status} by ${session?.name || 'Admin'}`;
    onUpdateAuditStatus(auditId, status, note);
  };

  const getStatusBadge = (status: AuditStatus) => {
    switch (status) {
      case 'Audit Ordered':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'In Progress':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Resolved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Completed':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
  };

  const filteredAudits = audits.filter(a => {
    if (auditFilter === 'active') {
      return a.status !== 'Completed' && a.status !== 'Resolved';
    }
    if (auditFilter === 'completed') {
      return a.status === 'Completed' || a.status === 'Resolved';
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Header & Sub-tab navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Security & Audit Directives Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time compliance monitoring, variance checks, and multi-station notifications
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('issues')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'issues'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Audits & Alerts ({audits.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notifications Feed ({notifications.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'issues' ? (
        <div className="space-y-6">
          {/* Daily Closing Alert if missing */}
          {missingToday.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-300 uppercase">
                  Daily Closing Warning — Pending Station Shifts ({missingToday.length})
                </div>
                <div className="text-xs text-amber-200/80 mt-1">
                  The following stations have not finalized their shift entry for {today}:
                  <span className="font-bold text-white ml-1">{missingToday.join(', ')}</span>.
                </div>
              </div>
            </div>
          )}

          {/* Audits List with Filter Controls */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <span>Station Audits, Variances & Action Directives</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Actioning an item updates its status, records the audit trail, and broadcasts an alert
                </p>
              </div>

              {/* Status Filters & Reset All */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setAuditFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      auditFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({audits.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuditFilter('active')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      auditFilter === 'active' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Active ({audits.filter(a => a.status !== 'Completed' && a.status !== 'Resolved').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuditFilter('completed')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      auditFilter === 'completed' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Resolved Log ({audits.filter(a => a.status === 'Completed' || a.status === 'Resolved').length})
                  </button>
                </div>

                {onClearAllAudits && session.role === 'ceo_jalees' && audits.length > 0 && (
                  <div className="flex items-center">
                    {confirmClearAudits ? (
                      <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-600/60 px-2.5 py-1 rounded-xl text-xs">
                        <span className="text-rose-300 font-bold text-[11px]">Purge all {audits.length} logs?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onClearAllAudits();
                            setConfirmClearAudits(false);
                          }}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] rounded-lg cursor-pointer"
                        >
                          Yes, Reset All
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClearAudits(false)}
                          className="px-1.5 py-0.5 text-slate-400 hover:text-white text-[11px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmClearAudits(true)}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Reset and clear all audit directives"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Reset All Logs</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3.5">
              {filteredAudits.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No audit cases match this filter. All station operations are running within compliance.
                </div>
              ) : (
                filteredAudits.map(item => {
                  return (
                    <div
                      key={item.id}
                      className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 transition-all hover:border-slate-700"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300">
                            {item.type === 'nozzle_variance' ? (
                              <Gauge className="w-4 h-4 text-rose-400" />
                            ) : (
                              <Fuel className="w-4 h-4 text-amber-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-white">{item.station}</span>
                              <span className="text-xs text-slate-400 font-mono">{formatDate(item.date)}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusBadge(
                                  item.status
                                )}`}
                              >
                                {item.status.toUpperCase()}
                              </span>
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                                {item.severity} severity
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-200 mt-1">{item.title}</h3>
                            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start flex-wrap">
                          {item.varianceLiters && (
                            <div className="text-right shrink-0 bg-rose-950/40 border border-rose-800/40 px-3 py-1.5 rounded-xl">
                              <div className="text-sm font-black text-rose-400 font-mono">
                                {item.varianceLiters > 0 ? `+${item.varianceLiters.toFixed(1)}` : item.varianceLiters.toFixed(1)} L
                              </div>
                              <div className="text-[10px] text-rose-300 uppercase">Volume Var</div>
                            </div>
                          )}

                          {item.varianceAmount && (
                            <div className="text-right shrink-0 bg-amber-950/40 border border-amber-800/40 px-3 py-1.5 rounded-xl">
                              <div className="text-sm font-black text-amber-400 font-mono">
                                ₨{item.varianceAmount.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-amber-300 uppercase">Cash Impact</div>
                            </div>
                          )}

                          {/* Delete / Clear button without window.confirm */}
                          {onDeleteAudit && (
                            <div>
                              {deletingAuditId === item.id ? (
                                <div className="flex items-center gap-1 bg-rose-950/90 border border-rose-600/70 p-1 rounded-xl text-[10px]">
                                  <span className="text-rose-300 font-bold px-1">Delete?</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteAudit(item.id);
                                      setDeletingAuditId(null);
                                    }}
                                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded cursor-pointer"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingAuditId(null)}
                                    className="px-1 text-slate-400 hover:text-white cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeletingAuditId(item.id)}
                                  title="Delete this audit log entry"
                                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* EXACT NATURE OF IRREGULARITY */}
                      {item.irregularityNature && (
                        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 space-y-1 text-xs">
                          <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Exact Nature of Irregularity:
                          </span>
                          <p className="text-rose-200 font-semibold leading-relaxed">
                            {item.irregularityNature}
                          </p>
                        </div>
                      )}

                      {/* PERSON RESPONSIBLE CALLOUT */}
                      {item.personResponsible && (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-950/30 border border-amber-700/50 text-xs">
                          <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-[10px] uppercase font-black text-amber-400">Accountable Officer / Person Responsible:</span>
                          <span className="font-extrabold text-amber-200">{item.personResponsible}</span>
                        </div>
                      )}

                      {/* Action History / Notes if already acted upon */}
                      {item.actionNotes && (
                        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-semibold text-white">Action Log:</span> {item.actionNotes}
                            {item.actionTakenBy && (
                              <span className="text-slate-400 text-[11px] block mt-0.5">
                                By {item.actionTakenBy} • {item.actionTakenAt ? formatDateTime(item.actionTakenAt) : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="border-t border-slate-800/80 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase">
                          Take Audit Directive Action:
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Audit Ordered Button */}
                          <button
                            type="button"
                            onClick={() => handleAction(item.id, 'Audit Ordered')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                              item.status === 'Audit Ordered'
                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            Order Audit
                          </button>

                          {/* In Progress Button */}
                          <button
                            type="button"
                            onClick={() => handleAction(item.id, 'In Progress')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                              item.status === 'In Progress'
                                ? 'bg-blue-500 text-white border-blue-400'
                                : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border-blue-500/30'
                            }`}
                          >
                            In Progress
                          </button>

                          {/* Resolved Button */}
                          <button
                            type="button"
                            onClick={() => handleAction(item.id, 'Resolved')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                              item.status === 'Resolved'
                                ? 'bg-emerald-500 text-white border-emerald-400'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            Mark Resolved
                          </button>

                          {/* Completed Button */}
                          <button
                            type="button"
                            onClick={() => handleAction(item.id, 'Completed')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                              item.status === 'Completed'
                                ? 'bg-purple-600 text-white border-purple-500'
                                : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/30'
                            }`}
                          >
                            Complete Case
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Broadcast Notifications Feed */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-400" />
                <span>Executive Broadcast Notifications Log</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                All stakeholders (Partners, Managers, CEO) receive real-time action alerts
              </p>
            </div>

            {/* Clear All Notifications button */}
            {onClearAllNotifications && notifications.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Clear all notifications?')) {
                    onClearAllNotifications();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Clear All Feed</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No active notifications. All clear!
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex items-start justify-between gap-3 transition-all hover:border-slate-700"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-white text-sm">{notif.title}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatDateTime(notif.timestamp)}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{notif.message}</p>
                      <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-2">
                        <span>Authorized by: <b className="text-slate-200">{notif.actor}</b></span>
                        {notif.station && (
                          <span>• Station: <b className="text-blue-400">{notif.station}</b></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Individual Delete / Dismiss Button */}
                  {onDeleteNotification && (
                    <button
                      type="button"
                      onClick={() => onDeleteNotification(notif.id)}
                      title="Dismiss notification"
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
