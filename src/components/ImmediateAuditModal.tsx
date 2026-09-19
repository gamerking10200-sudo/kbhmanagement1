import React from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  X, 
  UserCheck, 
  ArrowRight, 
  CheckCircle2, 
  Gauge, 
  Building2, 
  Calendar,
  AlertOctagon,
  FileCheck
} from 'lucide-react';
import { AppTheme, ImmediateAuditResult } from '../types';

interface ImmediateAuditModalProps {
  isOpen: boolean;
  result: ImmediateAuditResult | null;
  onClose: () => void;
  onNavigateToAuditCenter: () => void;
  theme?: AppTheme;
}

export const ImmediateAuditModal: React.FC<ImmediateAuditModalProps> = ({
  isOpen,
  result,
  onClose,
  onNavigateToAuditCenter,
  theme = 'iphone-dark',
}) => {
  const isLight = theme === 'iphone-light' || theme === 'nordic-light' || theme === 'sandstone-light';

  if (!isOpen || !result || result.anomalies.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden my-auto transition-all ${
          isLight ? 'bg-white border-rose-200 text-slate-900' : 'bg-slate-900 border-rose-900/60 text-white'
        }`}
      >
        {/* Modal Alert Header */}
        <div className="p-5 bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 border-b border-rose-800/60 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center justify-center shrink-0 animate-pulse">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/40">
                  CRITICAL FORENSIC ALERT
                </span>
                <span className="text-[11px] text-rose-300 font-mono">
                  Station: {result.station}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-1">
                Automated Audit Anomaly Surfaced Immediately Upon Submission
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-rose-300 hover:text-white hover:bg-rose-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-slate-300 text-xs leading-relaxed">
            The event-driven automated forensic audit engine intercepted an operational disparity during this transaction. An official compliance investigation case has been automatically generated in the Security &amp; Audit Registry.
          </div>

          <div className="space-y-3.5">
            {result.anomalies.map((anom, idx) => (
              <div 
                key={idx}
                className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 transition-all ${
                  isLight 
                    ? 'bg-rose-50/60 border-rose-200 shadow-sm' 
                    : 'bg-slate-950/80 border-rose-900/50'
                }`}
              >
                {/* Header of Anomaly */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5 border-rose-200 dark:border-rose-900/40">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400">
                      {anom.title}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40 self-start sm:self-auto">
                    {anom.severity} COMPLIANCE IRREGULARITY
                  </span>
                </div>

                {/* EXACT NATURE OF IRREGULARITY */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Exact Nature of Irregularity:
                  </div>
                  <div className={`p-3 rounded-xl border text-xs font-semibold leading-relaxed ${
                    isLight 
                      ? 'bg-white border-rose-200 text-rose-950' 
                      : 'bg-slate-900 border-rose-900/40 text-rose-200'
                  }`}>
                    {anom.irregularityNature}
                  </div>
                </div>

                {/* PERSON RESPONSIBLE CALLOUT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                    isLight ? 'bg-amber-50 border-amber-200 text-amber-950' : 'bg-amber-950/40 border-amber-700/50 text-amber-200'
                  }`}>
                    <UserCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Person Responsible:
                      </div>
                      <div className="text-xs font-black">
                        {anom.personResponsible}
                      </div>
                    </div>
                  </div>

                  {/* METRIC COMPARISON */}
                  {anom.metricComparison && (
                    <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}>
                      <Gauge className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Forensic Comparison:
                        </div>
                        <div className="text-xs font-mono font-bold">
                          {anom.metricComparison}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* RECOMMENDED ACTION */}
                {anom.recommendedAction && (
                  <div className="text-[11px] text-slate-400 flex items-start gap-2 pt-1">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><b>Required Action:</b> {anom.recommendedAction}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-mono">
              Auto-Audit Order dispatched to Station Dispatch Desk
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl font-bold transition-all ${
                  isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Acknowledge &amp; Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToAuditCenter();
                }}
                className="px-5 py-2 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md shadow-rose-600/30 flex items-center gap-2 cursor-pointer"
              >
                <span>Investigate in Audit Center</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
