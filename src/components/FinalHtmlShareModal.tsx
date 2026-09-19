import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Printer, 
  FileCode, 
  ShieldCheck, 
  Sparkles,
  Share2,
  Users,
  CloudUpload
} from 'lucide-react';
import { ExportDataPayload, generatePrintableHtmlContent, downloadGraphicalHtmlFile, triggerBrowserPrint } from '../utils/exportFiles';
import { AppTheme } from '../types';
import { getAccessToken, googleSignIn } from '../services/googleAuth';
import { GoogleDriveService } from '../services/googleDrive';

interface FinalHtmlShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ExportDataPayload;
  theme?: AppTheme;
}

export const FinalHtmlShareModal: React.FC<FinalHtmlShareModalProps> = ({
  isOpen,
  onClose,
  data,
  theme = 'iphone-dark',
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [driveStatus, setDriveStatus] = useState<string | null>(null);

  const htmlContent = useMemo(() => {
    return generatePrintableHtmlContent(data, 'FINAL EXECUTIVE FUEL OPERATIONS & PARTNERS SETTLEMENT STATEMENT');
  }, [data]);

  if (!isOpen) return null;

  const handleSaveToDrive = async () => {
    setIsUploadingToDrive(true);
    setDriveStatus(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        const signin = await googleSignIn();
        token = signin?.accessToken || null;
      }
      if (!token) {
        throw new Error('Google Drive authorization required.');
      }

      const folderId = await GoogleDriveService.getOrCreateAppFolder(token);
      const fileName = `Kashfi_Holdings_Executive_Report_${new Date().toISOString().split('T')[0]}.html`;
      await GoogleDriveService.uploadFile(token, fileName, htmlContent, 'text/html', folderId);

      setDriveStatus('Saved to Google Drive!');
      setTimeout(() => setDriveStatus(null), 4000);
    } catch (err: any) {
      console.error('Drive upload failed:', err);
      setDriveStatus(err?.message || 'Drive save failed');
      setTimeout(() => setDriveStatus(null), 4000);
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = htmlContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleDownload = () => {
    downloadGraphicalHtmlFile(data, 'FINAL EXECUTIVE FUEL OPERATIONS & PARTNERS SETTLEMENT STATEMENT');
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleOpenNewTab = () => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    triggerBrowserPrint(data, 'FINAL EXECUTIVE FUEL OPERATIONS & PARTNERS SETTLEMENT STATEMENT');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Final HTML Statement for Sharing
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Verified & Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Self-contained offline document with partner designations, net investments, profits & station fleet
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="font-semibold">All-Stakeholders Release</span>
            <span className="text-slate-500 hidden sm:inline">• Includes CEO Sign-off, Lead Partner Stamp & Bank Balances</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy Full HTML */}
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                copied
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'HTML Copied!' : 'Copy HTML Code'}</span>
            </button>

            {/* Open in Tab */}
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-xs text-slate-200 transition-all cursor-pointer"
              title="Open full page HTML in a new window"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Open in Tab</span>
            </button>

            {/* Print / Save PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            {/* Save to Google Drive */}
            <button
              type="button"
              onClick={handleSaveToDrive}
              disabled={isUploadingToDrive}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
              title="Save directly to your Google Drive account"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>{isUploadingToDrive ? 'Saving...' : driveStatus || 'Save to Drive'}</span>
            </button>

            {/* Download Final HTML File */}
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {downloadSuccess ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloadSuccess ? 'Downloaded!' : 'Download .HTML File'}</span>
            </button>
          </div>
        </div>

        {/* Live Document Preview Iframe */}
        <div className="flex-1 bg-slate-950 p-2 sm:p-4 overflow-hidden flex flex-col">
          <div className="text-[11px] text-slate-400 mb-2 flex items-center justify-between px-1">
            <span>Interactive Visual Preview (Formatted for A4 Print & Browser Viewing)</span>
            <span className="text-slate-500">Standalone Self-Contained HTML • No Internet Required</span>
          </div>
          
          <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800 bg-white shadow-inner">
            <iframe
              title="Final HTML Report Preview"
              srcDoc={htmlContent}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>

        {/* Bottom Bar Info */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div>
            💡 <strong className="text-slate-200">Sharing Guidance:</strong> You can download the <code className="text-emerald-400 font-mono">.html</code> file to send directly via WhatsApp, email, or Google Drive. Anyone can double-click it to view the complete interactive financial ledger offline.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
