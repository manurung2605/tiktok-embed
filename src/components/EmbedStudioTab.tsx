import React, { useState, useEffect } from 'react';
import { ResolvedLink, EmbedFormat } from '../types';
import { generateEmbedCode } from '../utils/resolver';
import {
  Code2,
  Copy,
  Download,
  Eye,
  Check,
  Smartphone,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

interface EmbedStudioTabProps {
  links: ResolvedLink[];
  onOpenIntentSheet: (link: ResolvedLink) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const EmbedStudioTab: React.FC<EmbedStudioTabProps> = ({
  links,
  onOpenIntentSheet,
  onShowToast,
}) => {
  const [format, setFormat] = useState<EmbedFormat>('option1');
  const [copied, setCopied] = useState(false);

  // Generate code snippet whenever format or links change
  const embedCode = generateEmbedCode(links, format);

  // Load official TikTok embed script if blockquote format is active
  useEffect(() => {
    if (links.length > 0 && (format === 'option1' || format === 'option3')) {
      const existingScript = document.getElementById('tiktokEmbedScript');
      if (existingScript) existingScript.remove();

      const script = document.createElement('script');
      script.id = 'tiktokEmbedScript';
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [links, format]);

  const handleCopyCode = async () => {
    if (!embedCode.trim()) {
      onShowToast('No embed code to copy!', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      onShowToast('Embed HTML snippet copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onShowToast('Failed to copy', 'error');
    }
  };

  const handleDownloadPage = () => {
    if (!embedCode.trim()) {
      onShowToast('No embed code to export!', 'error');
      return;
    }
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TikTok Embed Gallery</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0b0f17; color: #f1f5f9; padding: 2rem; margin: 0; }
    .gallery { max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 1.5rem; justify-content: center; }
  </style>
</head>
<body>
  <div class="gallery">
    ${embedCode}
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tiktok_embeds_android_${Date.now()}.html`;
    link.click();
    onShowToast('Downloaded standalone HTML page!', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Controls Box */}
      <div className="bg-[#0e131e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>HTML Embed Studio & Mobile Preview</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Generates lightweight responsive embed widgets for websites, WebView apps, and Android portals
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={format}
              onChange={e => setFormat(e.target.value as EmbedFormat)}
              className="bg-[#080c12] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-cyan-300 font-medium focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="option1">Option 1: Official Blockquote Embed</option>
              <option value="option2">Option 2: Responsive Player iFrame</option>
              <option value="option3">Option 3: Adaptive Fallback Wrapper</option>
            </select>
          </div>
        </div>

        {/* Code Output Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Generated Code ({links.length} Video{links.length === 1 ? '' : 's'})</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Format: {format.toUpperCase()}
            </span>
          </div>

          <div className="relative">
            <textarea
              readOnly
              value={embedCode}
              rows={6}
              placeholder="Resolved TikTok links will automatically generate embed code here..."
              className="w-full bg-[#080c14] border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-cyan-300 select-all focus:outline-none resize-y shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCopyCode}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-medium transition flex items-center justify-center gap-2 active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copied ? 'Copied HTML!' : 'Copy Embed Code'}</span>
            </button>
            <button
              onClick={handleDownloadPage}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-medium transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download HTML</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Embed Preview Container */}
      <div className="bg-[#0e131e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Live Interactive Player Preview</h3>
          </div>
          <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
            {links.length} Embed{links.length === 1 ? '' : 's'}
          </span>
        </div>

        {links.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-medium text-slate-400">No links in embed queue</p>
            <p className="text-[11px] text-slate-600">Resolve short TikTok links in the Resolver tab first to view live previews.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
            {links.map((link, idx) => {
              const videoId = link.videoId || (link.cleanUrl.match(/\/t\/([a-zA-Z0-9_-]+)/i)?.[1]) || '7400000000000000000';
              const targetUrl = link.cleanUrl || link.resolvedUrl;

              return (
                <div
                  key={link.id || idx}
                  className="w-full max-w-[340px] bg-[#090d15] border border-slate-800 rounded-2xl p-3.5 shadow-lg space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-cyan-400 font-medium truncate max-w-[200px]">
                      {link.author ? `@${link.author}` : `Video #${idx + 1}`}
                    </span>
                    <button
                      onClick={() => onOpenIntentSheet(link)}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-cyan-300 transition"
                      title="Open Android Intent Launcher"
                    >
                      <Smartphone className="w-3 h-3 text-cyan-400" />
                      <span>Android App</span>
                    </button>
                  </div>

                  {/* Render based on selected format */}
                  {format === 'option2' ? (
                    <div className="relative w-full pb-[177.78%] rounded-xl overflow-hidden bg-black border border-slate-800">
                      <iframe
                        src={`https://www.tiktok.com/player/v1/${videoId}?music_info=1&description=1`}
                        title="TikTok Player"
                        className="absolute inset-0 w-full h-full border-0 rounded-xl"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="w-full min-h-[320px] flex items-center justify-center bg-black/40 rounded-xl p-2 border border-slate-800/80 overflow-hidden">
                      <blockquote
                        className="tiktok-embed"
                        cite={targetUrl}
                        data-video-id={videoId}
                        style={{ maxWidth: '100%', minWidth: '260px' }}
                      >
                        <section>
                          <a target="_blank" rel="noopener noreferrer" href={targetUrl} className="text-xs text-cyan-400 underline">
                            {link.title || targetUrl}
                          </a>
                        </section>
                      </blockquote>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-slate-500">ID: {videoId}</span>
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                    >
                      <span>Direct Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
