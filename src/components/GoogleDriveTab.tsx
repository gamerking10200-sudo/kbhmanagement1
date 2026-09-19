import React, { useState, useEffect, useCallback } from 'react';
import { 
  Folder, 
  FileText, 
  Download, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  Upload, 
  FolderPlus, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  Cloud, 
  CloudUpload, 
  LogOut, 
  FileCode, 
  FileSpreadsheet, 
  Database,
  Lock,
  ArrowRight,
  Info
} from 'lucide-react';
import { 
  AppTheme, 
  AuditRecord, 
  BankAccount, 
  BankDepositRecord, 
  CreditClientLoan, 
  FuelRates, 
  Partner, 
  PartnerWithdrawal, 
  StationBalance, 
  StationEntry, 
  UserSession 
} from '../types';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logoutGoogle, getAccessToken } from '../services/googleAuth';
import { GoogleDriveService, DriveFile } from '../services/googleDrive';
import { generatePrintableHtmlContent, generateExcelMacroBlob } from '../utils/exportFiles';
import { StorageService } from '../utils/storage';
import { formatDate } from '../utils/formatters';

interface GoogleDriveTabProps {
  session: UserSession;
  theme?: AppTheme;
  entries: StationEntry[];
  stationBalances: StationBalance[];
  partners: Partner[];
  withdrawals: PartnerWithdrawal[];
  bankAccounts: BankAccount[];
  bankDeposits: BankDepositRecord[];
  creditLoans: CreditClientLoan[];
  audits: AuditRecord[];
  rates?: FuelRates;
  onRestoreBackup?: (json: string) => void;
}

export const GoogleDriveTab: React.FC<GoogleDriveTabProps> = ({
  session,
  theme = 'iphone-dark',
  entries,
  stationBalances,
  partners,
  withdrawals,
  bankAccounts,
  bankDeposits,
  creditLoans,
  audits,
  rates,
  onRestoreBackup,
}) => {
  const isCeo = session.role === 'ceo_jalees';

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Drive Files State
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [appFolderId, setAppFolderId] = useState<string | null>(null);

  // Actions State
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTargetFile, setDeleteTargetFile] = useState<DriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New Folder Modal
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Restore Confirmation Modal
  const [restoreTargetFile, setRestoreTargetFile] = useState<DriveFile | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, authToken) => {
        setUser(authUser);
        setToken(authToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        showStatus(`Connected to Google Drive as ${result.user.email}`);
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setAuthError(err?.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Sign Out
  const handleGoogleSignOut = async () => {
    await logoutGoogle();
    setUser(null);
    setToken(null);
    setFiles([]);
    setAppFolderId(null);
    showStatus('Disconnected from Google Drive.');
  };

  // Fetch Drive Files
  const loadDriveFiles = useCallback(async (authToken?: string) => {
    const activeToken = authToken || token || (await getAccessToken());
    if (!activeToken) return;

    setIsLoadingFiles(true);
    try {
      // Find or create dedicated app folder
      const folderId = await GoogleDriveService.getOrCreateAppFolder(activeToken);
      setAppFolderId(folderId);

      // Load files inside that folder
      const fetched = await GoogleDriveService.listFiles(activeToken, searchQuery, folderId);
      setFiles(fetched);
    } catch (err: any) {
      console.error('Failed to load Google Drive files:', err);
      showStatus(err?.message || 'Failed to list Google Drive files', 'error');
    } finally {
      setIsLoadingFiles(false);
    }
  }, [token, searchQuery]);

  useEffect(() => {
    if (token) {
      loadDriveFiles(token);
    }
  }, [token, loadDriveFiles]);

  // Upload Backup: Final HTML Statement
  const handleBackupHtmlStatement = async () => {
    if (!token) return;
    setIsUploading(true);
    try {
      const payload = {
        session,
        entries,
        stationBalances,
        partners,
        withdrawals,
        bankAccounts,
        bankDeposits,
        creditLoans,
        audits,
        rates,
      };
      const htmlContent = generatePrintableHtmlContent(payload, 'FINAL EXECUTIVE FUEL OPERATIONS & PARTNERS SETTLEMENT STATEMENT');
      const fileName = `Kashfi_Holdings_Executive_Report_${new Date().toISOString().split('T')[0]}.html`;

      await GoogleDriveService.uploadFile(
        token,
        fileName,
        htmlContent,
        'text/html',
        appFolderId || undefined
      );

      showStatus(`Saved "${fileName}" to Google Drive folder!`);
      loadDriveFiles();
    } catch (err: any) {
      console.error('Backup HTML failed:', err);
      showStatus(err?.message || 'Failed to upload HTML statement to Drive', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Upload Backup: Excel Macro (.XLSM)
  const handleBackupExcelMacro = async () => {
    if (!token) return;
    setIsUploading(true);
    try {
      const blob = generateExcelMacroBlob({
        session,
        entries,
        stationBalances,
        partners,
        withdrawals,
        bankAccounts,
        bankDeposits,
        creditLoans,
        audits,
        rates,
      });

      const fileName = `Kashfi_Holdings_Treasury_Macro_${new Date().toISOString().split('T')[0]}.xlsm`;

      await GoogleDriveService.uploadFile(
        token,
        fileName,
        blob,
        'application/vnd.ms-excel.sheet.macroEnabled.12',
        appFolderId || undefined
      );

      showStatus(`Saved "${fileName}" to Google Drive folder!`);
      loadDriveFiles();
    } catch (err: any) {
      console.error('Backup Excel failed:', err);
      showStatus(err?.message || 'Failed to upload Excel macro to Drive', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Upload Backup: Full JSON Database
  const handleBackupJsonDatabase = async () => {
    if (!token) return;
    setIsUploading(true);
    try {
      const backupJson = StorageService.exportBackupJson();
      const fileName = `Kashfi_Holdings_Database_Backup_${new Date().toISOString().split('T')[0]}_${Date.now().toString().slice(-4)}.json`;

      await GoogleDriveService.uploadFile(
        token,
        fileName,
        backupJson,
        'application/json',
        appFolderId || undefined
      );

      showStatus(`Full system database backed up to Google Drive: "${fileName}"`);
      loadDriveFiles();
    } catch (err: any) {
      console.error('Backup JSON failed:', err);
      showStatus(err?.message || 'Failed to backup database to Drive', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Manual File Upload from Computer to Drive
  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile || !token) return;

    setIsUploading(true);
    try {
      await GoogleDriveService.uploadFile(
        token,
        uploadedFile.name,
        uploadedFile,
        uploadedFile.type || 'application/octet-stream',
        appFolderId || undefined
      );

      showStatus(`Uploaded "${uploadedFile.name}" to Google Drive.`);
      loadDriveFiles();
    } catch (err: any) {
      console.error('Upload failed:', err);
      showStatus(err?.message || 'Failed to upload file to Google Drive', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Create New Folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !token) return;

    try {
      await GoogleDriveService.createFolder(token, newFolderName.trim(), appFolderId || undefined);
      showStatus(`Folder "${newFolderName}" created in Google Drive.`);
      setNewFolderName('');
      setShowNewFolderModal(false);
      loadDriveFiles();
    } catch (err: any) {
      showStatus(err?.message || 'Failed to create folder', 'error');
    }
  };

  // Delete File (MANDATORY EXPLICIT CONFIRMATION)
  const handleConfirmDelete = async () => {
    if (!deleteTargetFile || !token) return;
    setIsDeleting(true);
    try {
      await GoogleDriveService.deleteFile(token, deleteTargetFile.id);
      showStatus(`File "${deleteTargetFile.name}" deleted from Google Drive.`);
      setDeleteTargetFile(null);
      loadDriveFiles();
    } catch (err: any) {
      showStatus(err?.message || 'Failed to delete file', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Restore Database from JSON file in Drive
  const handleConfirmRestore = async () => {
    if (!restoreTargetFile || !token) return;
    setIsRestoring(true);
    try {
      const content = await GoogleDriveService.getFileContent(token, restoreTargetFile.id);
      if (onRestoreBackup) {
        onRestoreBackup(content);
      } else {
        const success = StorageService.importBackupJson(content);
        if (success) {
          window.location.reload();
        } else {
          throw new Error('Invalid JSON structure');
        }
      }
      showStatus(`Database successfully restored from Google Drive: "${restoreTargetFile.name}"`);
      setRestoreTargetFile(null);
    } catch (err: any) {
      showStatus(err?.message || 'Failed to restore database from file', 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Google Drive Cloud Storage
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Google Workspace
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Direct cloud archiving, automated financial statements & real-time Drive backup synchronization
              </p>
            </div>
          </div>

          {/* User Account / Auth Controls */}
          {user ? (
            <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 p-2 rounded-2xl">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-xl border border-slate-700 object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold text-sm">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'G'}
                </div>
              )}
              <div className="text-left pr-2">
                <div className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[180px]">
                  {user.displayName || 'Google User'}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[140px] sm:max-w-[180px]">
                  {user.email}
                </div>
              </div>
              <button
                type="button"
                onClick={handleGoogleSignOut}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Disconnect Google Drive"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              {/* Official Google GSI Styled Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm shadow-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Status Message Banner */}
        {statusMessage && (
          <div className={`mt-4 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between animate-fadeIn ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}>
            <span className="flex items-center gap-2">
              {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {statusMessage.text}
            </span>
          </div>
        )}

        {authError && (
          <div className="mt-4 px-4 py-2.5 rounded-2xl text-xs font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{authError}</span>
          </div>
        )}
      </div>

      {/* When NOT Logged In: Informative Onboarding State */}
      {!user ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center max-w-2xl mx-auto shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
            <CloudUpload className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">Connect Google Drive to Petroleum Cloud</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
              Authenticate with your Google account to automatically store daily station shifts, partner equity balances, and full database backups in your Google Drive cloud storage.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <FileCode className="w-5 h-5 text-emerald-400 mb-2" />
              <div className="text-xs font-bold text-white">Final HTML Statements</div>
              <div className="text-[11px] text-slate-400 mt-1">Upload standalone offline executive settlement reports</div>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <FileSpreadsheet className="w-5 h-5 text-teal-400 mb-2" />
              <div className="text-xs font-bold text-white">Excel Macro Files</div>
              <div className="text-[11px] text-slate-400 mt-1">Sync .XLSM and .XLSX workbooks for bankers and accountants</div>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <Database className="w-5 h-5 text-blue-400 mb-2" />
              <div className="text-xs font-bold text-white">Full JSON Backups</div>
              <div className="text-[11px] text-slate-400 mt-1">1-Click database restore and tamper-proof cloud archiving</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoggingIn}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            <span>{isLoggingIn ? 'Connecting to Google...' : 'Authorize & Sign in with Google'}</span>
          </button>
        </div>
      ) : (
        <>
          {/* 1-CLICK BACKUP CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Backup Final HTML Statement */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-colors">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3">
                  <FileCode className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Save Final HTML Statement</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Uploads the verified executive statement with partner designations & net investments to your Drive folder.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBackupHtmlStatement}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <CloudUpload className="w-4 h-4" />
                <span>{isUploading ? 'Uploading to Drive...' : 'Save HTML to Drive'}</span>
              </button>
            </div>

            {/* Backup Excel Macro (.XLSM) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-teal-500/40 transition-colors">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-teal-500/15 text-teal-400 flex items-center justify-center mb-3">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Save Excel Macro (.XLSM)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Generates and uploads the comprehensive multi-sheet financial workbook with VBA macro modules to Drive.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBackupExcelMacro}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <CloudUpload className="w-4 h-4" />
                <span>{isUploading ? 'Uploading...' : 'Save .XLSM to Drive'}</span>
              </button>
            </div>

            {/* Backup Full JSON Database */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-colors">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-3">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Save Full Database Backup</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Exports a complete timestamped snapshot of entries, partners, rates, banks, and loans into Google Drive.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBackupJsonDatabase}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <CloudUpload className="w-4 h-4" />
                <span>{isUploading ? 'Backing up...' : 'Save Database to Drive'}</span>
              </button>
            </div>
          </div>

          {/* GOOGLE DRIVE FILE EXPLORER */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Folder className="w-5 h-5 text-amber-400" />
                  <span>Google Drive Petroleum Records Archive</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Folder: <code className="text-blue-300 font-mono">Kashfi Bro Holdings — Fuel Station Records</code>
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadDriveFiles()}
                    placeholder="Search Drive files..."
                    className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-36 sm:w-48"
                  />
                </div>

                {/* Refresh */}
                <button
                  type="button"
                  onClick={() => loadDriveFiles()}
                  disabled={isLoadingFiles}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  title="Refresh File List"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin text-blue-400' : ''}`} />
                </button>

                {/* New Folder */}
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>New Folder</span>
                </button>

                {/* Upload Local File to Drive */}
                <label className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                  <input
                    type="file"
                    onChange={handleManualUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Files List Table */}
            {isLoadingFiles ? (
              <div className="text-center py-16 text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                <span>Synchronizing with Google Drive API...</span>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-16 bg-slate-950/40 rounded-2xl border border-slate-800/40 space-y-3">
                <Folder className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="text-xs font-bold text-slate-400">No files found in your petroleum records folder yet.</div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Click any of the backup buttons above to save your first executive report or database backup directly to Google Drive.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3 rounded-l-xl">File Name</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Size</th>
                      <th className="py-3 px-3">Modified</th>
                      <th className="py-3 px-3 text-right rounded-r-xl">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {files.map(file => {
                      const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                      const isHtml = file.name.endsWith('.html') || file.mimeType.includes('html');
                      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xlsm') || file.mimeType.includes('spreadsheet') || file.mimeType.includes('excel');
                      const isJson = file.name.endsWith('.json') || file.mimeType.includes('json');

                      let sizeDisplay = '—';
                      if (file.size) {
                        const bytes = Number(file.size);
                        if (bytes > 1024 * 1024) {
                          sizeDisplay = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                        } else if (bytes > 1024) {
                          sizeDisplay = `${(bytes / 1024).toFixed(0)} KB`;
                        } else {
                          sizeDisplay = `${bytes} B`;
                        }
                      }

                      return (
                        <tr key={file.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3 flex items-center gap-2.5 font-bold text-white">
                            {isFolder ? (
                              <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                            ) : isHtml ? (
                              <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : isExcel ? (
                              <FileSpreadsheet className="w-4 h-4 text-teal-400 shrink-0" />
                            ) : isJson ? (
                              <Database className="w-4 h-4 text-blue-400 shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className="truncate max-w-[200px] sm:max-w-md">{file.name}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-400">
                            {isFolder ? 'Folder' : isHtml ? 'HTML Report' : isExcel ? 'Excel Workbook' : isJson ? 'JSON Database' : 'Document'}
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{sizeDisplay}</td>
                          <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                            {file.modifiedTime ? formatDate(file.modifiedTime.split('T')[0]) : '—'}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Open in Google Drive */}
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                  title="Open in Google Drive"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                                </a>
                              )}

                              {/* Restore (if JSON) */}
                              {isJson && isCeo && (
                                <button
                                  type="button"
                                  onClick={() => setRestoreTargetFile(file)}
                                  className="px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-[10px] transition-colors cursor-pointer"
                                  title="Restore system from this backup"
                                >
                                  Restore
                                </button>
                              )}

                              {/* Delete File (with mandatory explicit user confirmation) */}
                              {isCeo && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteTargetFile(file)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Delete from Google Drive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* MANDATORY CONFIRMATION DIALOG: DELETE FROM GOOGLE DRIVE */}
      {/* ======================================================== */}
      {deleteTargetFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-white">Delete from Google Drive?</h3>
              <p className="text-xs text-slate-400 mt-2">
                Are you sure you want to permanently delete <strong className="text-white">"{deleteTargetFile.name}"</strong> from your Google Drive?
              </p>
              <p className="text-[11px] text-rose-400/90 mt-2 bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/40">
                ⚠️ This will remove the file from your Google Drive cloud storage. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetFile(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete from Drive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONFIRMATION DIALOG: RESTORE DATABASE FROM DRIVE FILE */}
      {/* ======================================================== */}
      {restoreTargetFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-blue-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
              <Database className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-white">Restore Database from Google Drive?</h3>
              <p className="text-xs text-slate-400 mt-2">
                This will overwrite current system records with data from <strong className="text-white">"{restoreTargetFile.name}"</strong>.
              </p>
              <p className="text-[11px] text-amber-400/90 mt-2 bg-amber-950/40 p-2.5 rounded-xl border border-amber-900/40">
                ⚠️ All current entries, rates, partners, and station balances will be updated to match the backup snapshot.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRestoreTargetFile(null)}
                disabled={isRestoring}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isRestoring ? 'Restoring Data...' : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE NEW DRIVE FOLDER */}
      {/* ======================================================== */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Create New Folder</h3>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Folder Name *</label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="e.g. 2026 Audit Statements"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-colors cursor-pointer"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
