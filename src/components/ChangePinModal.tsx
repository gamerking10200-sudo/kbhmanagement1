import React, { useState } from 'react';
import { KeyRound, X, Check, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { AppCredentials, UserSession } from '../types';
import { StorageService } from '../utils/storage';

interface ChangePinModalProps {
  isOpen?: boolean;
  onClose: () => void;
  credentials?: AppCredentials;
  currentSession?: UserSession;
  onSaveCredentials?: (updated: AppCredentials) => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen = true,
  onClose,
  credentials,
  currentSession,
  onSaveCredentials,
}) => {
  const activeCreds = credentials || StorageService.getCredentials();
  const [partnerPin, setPartnerPin] = useState(activeCreds?.partnerPin || '1234');
  const [managerPin, setManagerPin] = useState(activeCreds?.managerPin || '5678');
  const [adminPin, setAdminPin] = useState(activeCreds?.adminPin || '1122');
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (isOpen === false) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!/^\d{4}$/.test(partnerPin)) {
      setStatusMessage({ text: 'Partner PIN must be exactly 4 numeric digits.', type: 'error' });
      return;
    }
    if (!/^\d{4}$/.test(managerPin)) {
      setStatusMessage({ text: 'Manager PIN must be exactly 4 numeric digits.', type: 'error' });
      return;
    }
    if (!/^\d{4}$/.test(adminPin)) {
      setStatusMessage({ text: 'CEO / Admin PIN must be exactly 4 numeric digits.', type: 'error' });
      return;
    }

    const updated: AppCredentials = {
      partnerPin,
      managerPin,
      adminPin,
    };

    if (onSaveCredentials) {
      onSaveCredentials(updated);
    } else {
      StorageService.setCredentials(updated);
      StorageService.addNotification({
        title: 'Security PINs Updated',
        message: 'Security PINs were updated by CEO/Admin Jalees.',
        type: 'password_change',
        actor: currentSession?.name || 'CEO Jalees',
      });
    }

    setStatusMessage({ text: 'Security PINs successfully updated for all roles!', type: 'success' });
    setTimeout(() => {
      onClose();
      setStatusMessage(null);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Security PIN Management</h2>
              <p className="text-xs text-slate-400">CEO / Admin Jalees Master Override</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              As CEO / Admin Jalees, you can update security PINs for Partners, Managers, and your confidential Admin PIN at any time.
            </span>
          </div>

          {/* Partner PIN Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Partner PIN (Eyes-Only / Read-Only Viewers)
            </label>
            <input
              type="text"
              maxLength={4}
              value={partnerPin}
              onChange={e => setPartnerPin(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 1234"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-blue-400 focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Visible on login screen for authorized partner audit review.</p>
          </div>

          {/* Manager PIN Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Manager PIN (Eyes-Only / Read-Only Viewers)
            </label>
            <input
              type="text"
              maxLength={4}
              value={managerPin}
              onChange={e => setManagerPin(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 5678"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Visible on login screen for station supervisor shifts.</p>
          </div>

          {/* CEO / Admin Jalees PIN Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              CEO / Admin Jalees Master PIN (Invisible to Others)
            </label>
            <div className="relative">
              <input
                type={showAdminPin ? 'text' : 'password'}
                maxLength={4}
                value={adminPin}
                onChange={e => setAdminPin(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 1122"
                className="w-full bg-slate-800/80 border border-indigo-700/60 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowAdminPin(!showAdminPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showAdminPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Kept confidential and hidden from login screen.</p>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' && <Check className="w-4 h-4 text-emerald-400" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
            >
              Save New PINs
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
