import React, { useState } from 'react';
import { ResolvedLink } from '../types';
import { generateQRCodeSVG } from '../utils/qrCode';
import { X, ExternalLink, QrCode, Copy, Share2, Smartphone, Check } from 'lucide-react';

interface AndroidIntentSheetProps {
  link: ResolvedLink | null;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AndroidIntentSheet: React.FC<AndroidIntentSheetProps> = ({
  link,
  onClose,
  onShowToast,
}) => {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!link) return null;

  const targetUrl = link.cleanUrl || link.resolvedUrl;
  const tiktokPackage = 'com.zhiliaoapp.musically';
  const tiktokLitePackage = 'com.zhiliaoapp.musically.go';

  const mainIntent = `intent://${targetUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=${tiktokPackage};S.browser_fallback_url=${encodeURIComponent(targetUrl)};end`;
  const liteIntent = `intent://${targetUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=${tiktokLitePackage};S.browser_fallback_url=${encodeURIComponent(targetUrl)};end`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onShowToast(`${label} copied to clipboard!`, 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onShowToast('Could not copy to clipboard', 'error');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: link.title || 'TikTok Video',
          text: `Check out this TikTok: ${link.author ? `@${link.author}` : ''}`,
          url: targetUrl,
        });
        onShowToast('Shared via Android Share Sheet!', 'success');
      } catch {
        // Dismissed or unsupported
      }
    } else {
      copyToClipboard(targetUrl, 'Clean TikTok URL');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0e131d] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header with Android drag handle */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mb-3 sm:hidden"></div>
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-pink-500 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-[#0e131d] rounded-[10px] flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Android Intent & App Launcher</h3>
                <p className="text-[11px] text-slate-400">Launch directly in TikTok or transfer to device</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Link Details Card */}
        <div className="bg-[#141b27] border border-slate-800/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Resolved Canonical Target:</span>
            <span className="font-mono text-cyan-400 font-semibold">{link.videoId ? `ID: ${link.videoId}` : 'Canonical URL'}</span>
          </div>
          <div className="text-xs font-mono text-slate-200 break-all bg-black/40 p-2.5 rounded-lg border border-slate-800/60 select-all">
            {targetUrl}
          </div>
          {link.title && (
            <p className="text-xs text-slate-300 italic line-clamp-1">"{link.title}"</p>
          )}
        </div>

        {/* Main Android Actions */}
        <div className="grid grid-cols-1 gap-2.5">
          {/* Action 1: Official TikTok App */}
          <a
            href={mainIntent}
            className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/70 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-white transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center border border-slate-700">
                <span className="text-cyan-400 font-bold text-xs">TT</span>
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                  <span>Open in TikTok App</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-mono">
                    com.zhiliaoapp.musically
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">Launches Android Intent without browser redirect</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition" />
          </a>

          {/* Action 2: TikTok Lite */}
          <a
            href={liteIntent}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-white transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-950/50 flex items-center justify-center border border-pink-800/40">
                <span className="text-pink-400 font-bold text-xs">Lite</span>
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-200">Open in TikTok Lite</div>
                <div className="text-[11px] text-slate-400">Target package: com.zhiliaoapp.musically.go</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-pink-400 transition" />
          </a>

          {/* Action 3: Android Native Share */}
          <button
            onClick={handleNativeShare}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-white transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-950/50 flex items-center justify-center border border-purple-800/40">
                <Share2 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-200">Android System Share Sheet</div>
                <div className="text-[11px] text-slate-400">Share with WhatsApp, Telegram, Discord, etc.</div>
              </div>
            </div>
            <Share2 className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
          </button>
        </div>

        {/* Secondary Actions: QR Code & Copy Intent */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
          <button
            onClick={() => setShowQR(!showQR)}
            className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition ${
              showQR
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>{showQR ? 'Hide QR Code' : 'Scan on Android'}</span>
          </button>

          <button
            onClick={() => copyToClipboard(mainIntent, 'Android Intent URI')}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-purple-400" />}
            <span>{copied ? 'Copied URI!' : 'Copy Intent URI'}</span>
          </button>
        </div>

        {/* Live Android QR Code Display */}
        {showQR && (
          <div className="bg-[#111722] p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3 animate-in zoom-in-95 duration-200">
            <span className="text-[11px] font-medium text-slate-400">
              Point your Android camera at this QR code to open instantly on your phone:
            </span>
            <div className="p-3 bg-white rounded-xl shadow-lg">
              <img
                src={generateQRCodeSVG(targetUrl, 180)}
                alt="TikTok Link QR Code"
                className="w-44 h-44 rounded-md"
              />
            </div>
            <span className="text-[10px] font-mono text-cyan-400 break-all text-center max-w-xs">
              {targetUrl}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
