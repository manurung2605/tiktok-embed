import React, { useState } from 'react';
import { ResolvedLink } from '../types';
import {
  History,
  Search,
  FileSpreadsheet,
  FileText,
  FileCode,
  Trash2,
  Copy,
  Smartphone,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

interface HistoryTabProps {
  history: ResolvedLink[];
  onClearHistory: () => void;
  onOpenIntentSheet: (link: ResolvedLink) => void;
  onRestoreToQueue: (link: ResolvedLink) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  history,
  onClearHistory,
  onOpenIntentSheet,
  onRestoreToQueue,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = history.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.originalUrl.toLowerCase().includes(term) ||
      item.cleanUrl.toLowerCase().includes(term) ||
      (item.author && item.author.toLowerCase().includes(term)) ||
      (item.videoId && item.videoId.includes(term)) ||
      (item.title && item.title.toLowerCase().includes(term))
    );
  });

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onShowToast('Copied to clipboard!', 'success');
    } catch {
      onShowToast('Failed to copy', 'error');
    }
  };

  const exportJSON = () => {
    if (history.length === 0) return;
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tiktok_history_android_${Date.now()}.json`;
    link.click();
    onShowToast('Exported JSON history!', 'success');
  };

  const exportCSV = () => {
    if (history.length === 0) return;
    const rows = [['Timestamp', 'Short URL', 'Clean Canonical URL', 'Video ID', 'Author', 'Status']];
    history.forEach(item => {
      rows.push([
        new Date(item.timestamp).toISOString(),
        `"${item.originalUrl.replace(/"/g, '""')}"`,
        `"${item.cleanUrl.replace(/"/g, '""')}"`,
        `"${item.videoId || ''}"`,
        `"${item.author || ''}"`,
        item.status,
      ]);
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `tiktok_history_android_${Date.now()}.csv`;
    link.click();
    onShowToast('Exported CSV history!', 'success');
  };

  const exportTXT = () => {
    if (history.length === 0) return;
    const content = history.map(h => h.cleanUrl).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tiktok_history_android_${Date.now()}.txt`;
    link.click();
    onShowToast('Exported TXT history!', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Stats */}
      <div className="bg-[#0e131e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <span>Resolved Links History</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cached locally in Android storage &bull; {history.length} links recorded
            </p>
          </div>

          {history.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={exportCSV}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                <span>CSV</span>
              </button>
              <button
                onClick={exportTXT}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
              >
                <FileText className="w-3 h-3 text-amber-400" />
                <span>TXT</span>
              </button>
              <button
                onClick={exportJSON}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
              >
                <FileCode className="w-3 h-3 text-purple-400" />
                <span>JSON</span>
              </button>
              <button
                onClick={onClearHistory}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition flex items-center gap-1.5"
                title="Clear all saved history"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by URL, Creator handle, Video ID, or Title..."
            className="w-full bg-[#080c14] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/70 transition"
          />
        </div>
      </div>

      {/* History Items List */}
      {filtered.length === 0 ? (
        <div className="bg-[#0e131e]/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 space-y-2">
          <History className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs font-medium text-slate-400">
            {searchTerm ? 'No matching links found' : 'No history yet'}
          </p>
          <p className="text-[11px] text-slate-600">
            Resolved URLs will be automatically stored here for future lookup and export.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(item => (
            <div
              key={item.id}
              className="bg-[#0e131e] border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow transition"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {item.author && (
                    <span className="text-xs font-mono text-purple-400 font-medium">
                      @{item.author}
                    </span>
                  )}
                  {item.videoId && (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                      ID: {item.videoId}
                    </span>
                  )}
                </div>

                <div className="text-xs font-mono text-cyan-300 truncate select-all" title={item.cleanUrl}>
                  {item.cleanUrl}
                </div>

                <div className="text-[11px] text-slate-500 truncate" title={item.originalUrl}>
                  Source: {item.originalUrl}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => handleCopy(item.cleanUrl)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition"
                  title="Copy Clean URL"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onOpenIntentSheet(item)}
                  className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 transition"
                  title="Android Intent & QR"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onRestoreToQueue(item)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-purple-300 transition"
                  title="Send to Active Queue"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <a
                  href={item.cleanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition"
                  title="Open in Browser"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
