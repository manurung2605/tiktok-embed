import React, { useState } from 'react';
import { generateQRCodeSVG } from '../utils/qrCode';
import {
  Smartphone,
  ExternalLink,
  Copy,
  QrCode,
  Check,
  ShieldCheck,
  Compass,
  Zap,
  Info
} from 'lucide-react';

interface DeepLinksTabProps {
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const DeepLinksTab: React.FC<DeepLinksTabProps> = ({ onShowToast }) => {
  const [testVideoId, setTestVideoId] = useState('7418291048291048291');
  const [selectedPackage, setSelectedPackage] = useState<'main' | 'lite'>('main');
  const [copied, setCopied] = useState<string | null>(null);

  const pkgName = selectedPackage === 'main' ? 'com.zhiliaoapp.musically' : 'com.zhiliaoapp.musically.go';
  const targetWebUrl = `https://www.tiktok.com/@tiktok/video/${testVideoId}`;
  const androidIntentUri = `intent://www.tiktok.com/@tiktok/video/${testVideoId}#Intent;scheme=https;package=${pkgName};S.browser_fallback_url=${encodeURIComponent(targetWebUrl)};end`;
  const customSchemeUri = `snssdk1128://aweme/detail/${testVideoId}`;

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      onShowToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      onShowToast('Failed to copy', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Info */}
      <div className="bg-[#0e131e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Android Intents & Deep Links Engine</h2>
            <p className="text-xs text-slate-400">
              Direct routing into official TikTok Android client without browser hops
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed bg-[#080c14] p-3 rounded-xl border border-slate-800/80">
          Android Intents allow links to bypass web intermediary redirects and open immediately inside the installed TikTok Android application. If TikTok isn't installed, Android automatically falls back to your browser fallback URL.
        </p>
      </div>

      {/* Interactive Intent Tester */}
      <div className="bg-[#0e131e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Interactive Intent Builder</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1 font-medium">TikTok Video ID</label>
            <input
              type="text"
              value={testVideoId}
              onChange={e => setTestVideoId(e.target.value)}
              placeholder="e.g. 7418291048291048291"
              className="w-full bg-[#080c14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1 font-medium">Target Android Package</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedPackage('main')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition ${
                  selectedPackage === 'main'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-[#080c14] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                TikTok Main
              </button>
              <button
                type="button"
                onClick={() => setSelectedPackage('lite')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition ${
                  selectedPackage === 'lite'
                    ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                    : 'bg-[#080c14] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                TikTok Lite
              </button>
            </div>
          </div>
        </div>

        {/* Generated Intent URI display */}
        <div className="space-y-3 pt-2">
          <div className="bg-[#080c14] p-3.5 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-slate-200">Android Standard Intent URI</span>
              <span className="font-mono text-cyan-400">{pkgName}</span>
            </div>
            <div className="text-xs font-mono text-cyan-300 break-all bg-black/40 p-2.5 rounded-lg border border-slate-900 select-all">
              {androidIntentUri}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <a
                href={androidIntentUri}
                className="flex-1 py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test Launch on Android</span>
              </a>
              <button
                onClick={() => handleCopy(androidIntentUri, 'intent')}
                className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                {copied === 'intent' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                <span>Copy</span>
              </button>
            </div>
          </div>

          <div className="bg-[#080c14] p-3.5 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-slate-200">Native App Scheme URI (snssdk1128)</span>
              <span className="font-mono text-pink-400">Direct Protocol</span>
            </div>
            <div className="text-xs font-mono text-pink-300 break-all bg-black/40 p-2.5 rounded-lg border border-slate-900 select-all">
              {customSchemeUri}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <a
                href={customSchemeUri}
                className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-pink-300 font-medium text-xs flex items-center justify-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test Scheme Protocol</span>
              </a>
              <button
                onClick={() => handleCopy(customSchemeUri, 'scheme')}
                className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                {copied === 'scheme' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-pink-400" />}
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Scan on Real Device */}
      <div className="bg-[#0e131e] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center gap-6">
        <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0">
          <img
            src={generateQRCodeSVG(targetWebUrl, 160)}
            alt="TikTok QR"
            className="w-36 h-36 rounded-lg"
          />
        </div>
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <QrCode className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-semibold text-white">Scan with Android Camera</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Open the default Camera app on any Google Pixel, Samsung Galaxy, or Android device. The built-in Google Lens scanner will prompt to open directly in the TikTok app or browser.
          </p>
          <div className="text-[11px] font-mono text-cyan-400 break-all pt-1">
            {targetWebUrl}
          </div>
        </div>
      </div>
    </div>
  );
};
