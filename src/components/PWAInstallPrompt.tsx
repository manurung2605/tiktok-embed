import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Check } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  // If installable on Android / Chrome:
  if (isInstallable) {
    return (
      <div className="w-full bg-gradient-to-r from-cyan-950/90 via-slate-900/90 to-purple-950/90 border-b border-cyan-500/30 px-4 py-2.5 flex items-center justify-between text-xs transition-all">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white block sm:inline">Install Android App</span>
            <span className="text-slate-400 text-[11px] sm:ml-2">Add to Android home screen as WebAPK</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={install}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs shadow-md active:scale-95 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-md text-slate-400 hover:text-white transition"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <div className="w-full bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs">
          <span className="text-slate-300">Run as full-screen app on iOS</span>
          <button
            onClick={() => setShowIOSGuide(true)}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs border border-slate-700 transition"
          >
            Add to Home Screen
          </button>
        </div>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-[#0f172a] border border-slate-800 p-6 shadow-2xl text-slate-200 space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                Install on iPhone / iPad
              </h3>
              <ol className="text-xs space-y-2 text-slate-300 list-decimal list-inside bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <li>Tap the <strong className="text-cyan-300">Share</strong> icon in the Safari toolbar.</li>
                <li>Scroll down and tap <strong className="text-cyan-300">Add to Home Screen</strong>.</li>
                <li>Confirm by tapping <strong className="text-cyan-300">Add</strong>.</li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-white transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
