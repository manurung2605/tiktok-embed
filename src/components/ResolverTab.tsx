import React, { useState } from 'react';
import { ResolvedLink } from '../types';
import { parseUrls, resolveSingleUrl } from '../utils/resolver';
import {
  Link2,
  ClipboardPaste,
  Sparkles,
  Trash2,
  Zap,
  Square,
  Copy,
  ExternalLink,
  Smartphone,
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  Code2
} from 'lucide-react';

interface ResolverTabProps {
  results: ResolvedLink[];
  setResults: React.Dispatch<React.SetStateAction<ResolvedLink[]>>;
  cleanTracking: boolean;
  setCleanTracking: (val: boolean) => void;
  onOpenIntentSheet: (link: ResolvedLink) => void;
  onNavigateToEmbeds: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const DEMO_LINKS = [
  'https://vt.tiktok.com/ZS47tfdKd/',
  'https://vt.tiktok.com/ZS49A9MGX/',
  'https://vt.tiktok.com/ZS49bfXoK/',
  'https://vt.tiktok.com/ZS49StEXp/',
  'https://vt.tiktok.com/ZS4CKd9mS/',
];

export const ResolverTab: React.FC<ResolverTabProps> = ({
  results,
  setResults,
  cleanTracking,
  setCleanTracking,
  onOpenIntentSheet,
  onNavigateToEmbeds,
  onShowToast,
}) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percent: 0 });
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const detectedUrls = parseUrls(inputText);

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setInputText(prev => (prev ? `${prev}\n${text}` : text));
        onShowToast('Pasted from Android clipboard!', 'success');
      } else {
        onShowToast('Clipboard is empty', 'info');
      }
    } catch {
      onShowToast('Clipboard access was denied. Please paste manually.', 'info');
    }
  };

  const handleLoadDemos = () => {
    setInputText(DEMO_LINKS.join('\n'));
    onShowToast('Loaded 5 sample short links', 'info');
  };

  const handleClear = () => {
    setInputText('');
  };

  const handleStartResolution = async () => {
    const urls = parseUrls(inputText);
    if (urls.length === 0) {
      onShowToast('Please paste at least one TikTok link', 'error');
      return;
    }

    setIsProcessing(true);
    setStopRequested(false);
    setProgress({ current: 0, total: urls.length, percent: 0 });

    const updatedResults = [...results];
    let completed = 0;
    const total = urls.length;
    const concurrency = 2;
    const queue = [...urls];

    const workers = Array(concurrency).fill(0).map(async () => {
      while (queue.length > 0 && !stopRequested) {
        const url = queue.shift();
        if (!url) break;

        const resolved = await resolveSingleUrl(url, cleanTracking);

        // Replace if already present or add
        const existingIdx = updatedResults.findIndex(r => r.originalUrl === url);
        if (existingIdx >= 0) {
          updatedResults[existingIdx] = resolved;
        } else {
          updatedResults.unshift(resolved);
        }

        completed++;
        setProgress({
          current: completed,
          total,
          percent: Math.round((completed / total) * 100),
        });

        setResults([...updatedResults]);
      }
    });

    await Promise.all(workers);

    setIsProcessing(false);
    if (stopRequested) {
      onShowToast('Resolution stopped by user', 'info');
    } else {
      onShowToast(`Resolved ${completed} links successfully!`, 'success');
    }
  };

  const handleCopySingle = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      onShowToast('Copied link to clipboard!', 'success');
    } catch {
      onShowToast('Failed to copy', 'error');
    }
  };

  const handleCopyAll = async () => {
    if (results.length === 0) return;
    const text = results.map(r => r.cleanUrl || r.resolvedUrl).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      onShowToast(`Copied ${results.length} links!`, 'success');
    } catch {
      onShowToast('Failed to copy', 'error');
    }
  };

  const exportCSV = () => {
    if (results.length === 0) return;
    const rows = [['#', 'Short Link', 'Full Canonical URL', 'Video ID', 'Author', 'Status']];
    results.forEach((r, idx) => {
      rows.push([
        (idx + 1).toString(),
        `"${r.originalUrl.replace(/"/g, '""')}"`,
        `"${(r.cleanUrl || r.resolvedUrl).replace(/"/g, '""')}"`,
        `"${(r.videoId || '').replace(/"/g, '""')}"`,
        `"${(r.author || '').replace(/"/g, '""')}"`,
        `"${r.status}"`,
      ]);
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `tiktok_android_resolved_${Date.now()}.csv`;
    link.click();
    onShowToast('Exported CSV file!', 'success');
  };

  const exportTXT = () => {
    if (results.length === 0) return;
    const content = results.map(r => r.cleanUrl || r.resolvedUrl).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tiktok_android_resolved_${Date.now()}.txt`;
    link.click();
    onShowToast('Exported TXT file!', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Android Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#121926] via-[#0d121c] to-[#150e24] border border-slate-800 p-5 sm:p-6 shadow-xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                Android Native Engine
              </span>
              <span className="text-slate-400 text-xs">&bull; v1.2</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              TikTok Link Resolver
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Unshorten <code className="text-cyan-300 font-mono">vt.tiktok.com</code> links, strip tracking tokens, and launch directly via Android Intent.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handlePasteClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-medium transition active:scale-95"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste Clipboard</span>
            </button>
            <button
              onClick={handleLoadDemos}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-purple-300 border border-slate-700 text-xs font-medium transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Demos</span>
            </button>
            {inputText && (
              <button
                onClick={handleClear}
                className="p-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-rose-400 border border-slate-700 text-xs transition"
                title="Clear input"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="mt-4 relative">
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            rows={4}
            placeholder={`https://vt.tiktok.com/ZS47tfdKd/\nhttps://vt.tiktok.com/ZS49A9MGX/\nhttps://vt.tiktok.com/ZS49bfXoK/`}
            className="w-full bg-[#080c14]/90 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-cyan-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/70 resize-y transition shadow-inner"
          />
          <div className="absolute bottom-3 right-3 text-[11px] bg-slate-900/90 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">
            {detectedUrls.length} URL{detectedUrls.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Control Row: Tracking switch and Action button */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={cleanTracking}
              onChange={e => setCleanTracking(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-500 relative"></div>
            <span className="text-xs text-slate-300 font-medium">
              Strip Android tracking parameters (<code className="text-cyan-400 font-mono">?_r=1&_t=...</code>)
            </span>
          </label>

          <div className="flex items-center gap-2">
            {isProcessing ? (
              <button
                onClick={() => setStopRequested(true)}
                className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold hover:bg-rose-500/30 transition flex items-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : null}

            <button
              onClick={handleStartResolution}
              disabled={isProcessing}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Resolving Queue...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-cyan-200 fill-cyan-200" />
                  <span>Resolve Full URLs</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar (Visible while resolving) */}
      {isProcessing && (
        <div className="bg-[#0e131e] border border-cyan-500/30 rounded-2xl p-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-2 font-medium">
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              Processing Android redirect pipeline...
            </span>
            <span className="text-cyan-400 font-mono font-bold">{progress.percent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300 rounded-full"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 text-right font-mono">
            {progress.current} of {progress.total} completed
          </div>
        </div>
      )}

      {/* Results Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Link2 className="w-4 h-4 text-cyan-400" />
            <span>Resolved Links</span>
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-cyan-300 border border-slate-700">
            {results.length} Item{results.length === 1 ? '' : 's'}
          </span>
        </div>

        {results.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={handleCopyAll}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
            >
              <Copy className="w-3 h-3 text-cyan-400" />
              <span>Copy All</span>
            </button>
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
              onClick={onNavigateToEmbeds}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 text-xs font-medium transition flex items-center gap-1.5"
            >
              <Code2 className="w-3 h-3" />
              <span>View in Embeds</span>
            </button>
          </div>
        )}
      </div>

      {/* Results List (Mobile Cards View) */}
      {results.length === 0 ? (
        <div className="bg-[#0d121c]/60 border border-slate-800/80 rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
            <Link2 className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300">No links processed yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Paste TikTok short URLs above or tap "Demos" to test instant canonical resolution and Android Intent generation.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((item, index) => {
            const displayUrl = item.cleanUrl || item.resolvedUrl;
            return (
              <div
                key={item.id || index}
                className="bg-[#0e131e] border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-md transition space-y-3"
              >
                {/* Header row of card */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-xs font-mono text-slate-400 truncate max-w-[200px]" title={item.originalUrl}>
                      {item.originalUrl}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium shrink-0 border ${
                      item.isSuccess
                        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60'
                        : 'bg-amber-950/70 text-amber-300 border-amber-800/60'
                    }`}
                  >
                    {item.isSuccess ? 'Resolved' : 'Fallback'}
                  </span>
                </div>

                {/* Resolved Canonical URL Box */}
                <div className="bg-[#080c12] p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-cyan-300 break-all select-all flex-grow">
                    {displayUrl}
                  </span>
                  <button
                    onClick={() => handleCopySingle(displayUrl)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
                    title="Copy full clean link"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Video Info Pill (if parsed) */}
                {(item.videoId || item.author || item.title) && (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    {item.author && (
                      <span className="bg-purple-950/40 text-purple-300 px-2 py-0.5 rounded-md border border-purple-800/40 font-mono">
                        @{item.author}
                      </span>
                    )}
                    {item.videoId && (
                      <span className="bg-slate-800/60 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                        Video ID: {item.videoId}
                      </span>
                    )}
                    {item.title && (
                      <span className="truncate max-w-[240px] text-slate-400 italic">
                        "{item.title}"
                      </span>
                    )}
                  </div>
                )}

                {/* Bottom Actions Row */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <button
                    onClick={() => onOpenIntentSheet(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs font-medium transition active:scale-95"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Android Intent & QR</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={displayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition"
                      title="Open in new browser tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
