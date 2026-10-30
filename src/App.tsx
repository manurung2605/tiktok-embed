import React, { useState, useEffect } from 'react';
import { ResolvedLink, AndroidTab, AndroidSettings } from './types';
import { AndroidStatusBar } from './components/AndroidStatusBar';
import { AndroidNavBar } from './components/AndroidNavBar';
import { AndroidIntentSheet } from './components/AndroidIntentSheet';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { ResolverTab } from './components/ResolverTab';
import { EmbedStudioTab } from './components/EmbedStudioTab';
import { DeepLinksTab } from './components/DeepLinksTab';
import { HistoryTab } from './components/HistoryTab';
import { AndroidStudioExportTab } from './components/AndroidStudioExportTab';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  Smartphone,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Sparkles,
  WifiOff,
  Settings,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function App() {
  const isOnline = useOnlineStatus();

  // Settings
  const [settings, setSettings] = useState<AndroidSettings>(() => {
    try {
      const saved = localStorage.getItem('tt_android_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      cleanTracking: true,
      showPhoneFrame: false, // Fullscreen by default, toggleable to realistic phone frame
      navigationMode: 'gesture',
      openInAppByDefault: true,
      hapticFeedback: true,
    };
  });

  // Current Active Tab
  const [currentTab, setCurrentTab] = useState<AndroidTab>('resolver');

  // Resolved results (current session)
  const [results, setResults] = useState<ResolvedLink[]>(() => {
    try {
      const saved = localStorage.getItem('tt_android_results');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Long-term history
  const [history, setHistory] = useState<ResolvedLink[]>(() => {
    try {
      const saved = localStorage.getItem('tt_android_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Intent Bottom Sheet state
  const [activeIntentLink, setActiveIntentLink] = useState<ResolvedLink | null>(null);

  // Settings / Help Modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Sync state to local storage
  useEffect(() => {
    try {
      localStorage.setItem('tt_android_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('tt_android_results', JSON.stringify(results));
    } catch {}

    // Also sync resolved results to history
    if (results.length > 0) {
      setHistory(prev => {
        const map = new Map<string, ResolvedLink>();
        prev.forEach(item => map.set(item.cleanUrl || item.originalUrl, item));
        results.forEach(item => {
          if (item.isSuccess) {
            map.set(item.cleanUrl || item.originalUrl, item);
          }
        });
        const updated = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
        try {
          localStorage.setItem('tt_android_history', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  }, [results]);

  // Handle incoming Android Share intent (?url=... or ?text=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('url') || params.get('text');
    if (shared) {
      showToast('Received link from Android Share!', 'info');
    }
  }, []);

  // System 3-button actions
  const handleAndroidBack = () => {
    if (activeIntentLink) {
      setActiveIntentLink(null);
    } else if (showSettingsModal) {
      setShowSettingsModal(false);
    } else if (showHelpModal) {
      setShowHelpModal(false);
    } else if (currentTab !== 'resolver') {
      setCurrentTab('resolver');
    } else {
      showToast('Press again to exit', 'info');
    }
  };

  const handleAndroidHome = () => {
    setCurrentTab('resolver');
    setActiveIntentLink(null);
    setShowSettingsModal(false);
    setShowHelpModal(false);
  };

  const handleAndroidOverview = () => {
    setCurrentTab('history');
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col items-center justify-start antialiased selection:bg-cyan-500 selection:text-black">
      {/* Offline Toast */}
      {!isOnline && (
        <div className="w-full bg-amber-600/90 text-white px-4 py-1.5 text-xs font-medium flex items-center justify-center gap-2 sticky top-0 z-50">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Offline Mode — Android cached data will be used</span>
        </div>
      )}

      {/* Top Controls Bar for AI Studio & Web Viewers */}
      <header className="w-full bg-[#0d121c]/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-purple-500 to-pink-500 p-0.5 flex items-center justify-center shadow-lg">
              <div className="w-full h-full bg-[#0d121c] rounded-[10px] flex items-center justify-center">
                <span className="text-cyan-400 font-bold text-xs tracking-tighter">TT</span>
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>TikTok Resolver</span>
                <span className="text-[10px] bg-gradient-to-r from-cyan-500/20 to-pink-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded font-mono">
                  Android App
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Phone Frame Simulator */}
            <button
              onClick={() => setSettings(s => ({ ...s, showPhoneFrame: !s.showPhoneFrame }))}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 ${
                settings.showPhoneFrame
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Toggle Android Device Frame"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {settings.showPhoneFrame ? 'Device Frame: ON' : 'Device Frame: OFF'}
              </span>
            </button>

            {/* Quick Settings */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Android App Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Help / Guide */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="How Android Resolution Works"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container: Rendered either as a realistic Android Phone Body or full-bleed mobile layout */}
      <main className="w-full flex-grow flex items-center justify-center p-0 sm:p-4 md:p-6">
        <div
          className={`w-full transition-all duration-300 flex flex-col ${
            settings.showPhoneFrame
              ? 'max-w-[420px] rounded-[48px] border-[10px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(0,242,254,0.15)] bg-[#0b0f17] overflow-hidden my-4 ring-1 ring-slate-700/50'
              : 'max-w-4xl bg-transparent'
          }`}
        >
          {/* Android Status Bar */}
          <AndroidStatusBar notificationCount={results.length} />

          {/* Android PWA Install Prompt Banner */}
          <PWAInstallPrompt />

          {/* Active Screen Tab View */}
          <div className="flex-grow p-4 sm:p-5 overflow-y-auto min-h-[640px]">
            {currentTab === 'resolver' && (
              <ResolverTab
                results={results}
                setResults={setResults}
                cleanTracking={settings.cleanTracking}
                setCleanTracking={cleanTracking => setSettings(s => ({ ...s, cleanTracking }))}
                onOpenIntentSheet={link => setActiveIntentLink(link)}
                onNavigateToEmbeds={() => setCurrentTab('embeds')}
                onShowToast={showToast}
              />
            )}

            {currentTab === 'embeds' && (
              <EmbedStudioTab
                links={results}
                onOpenIntentSheet={link => setActiveIntentLink(link)}
                onShowToast={showToast}
              />
            )}

            {currentTab === 'intents' && (
              <DeepLinksTab onShowToast={showToast} />
            )}

            {currentTab === 'history' && (
              <HistoryTab
                history={history}
                onClearHistory={() => {
                  setHistory([]);
                  localStorage.removeItem('tt_android_history');
                  showToast('History cleared', 'info');
                }}
                onOpenIntentSheet={link => setActiveIntentLink(link)}
                onRestoreToQueue={link => {
                  if (!results.some(r => r.id === link.id)) {
                    setResults(prev => [link, ...prev]);
                  }
                  setCurrentTab('resolver');
                  showToast('Sent link to active resolver queue', 'success');
                }}
                onShowToast={showToast}
              />
            )}

            {currentTab === 'android-project' && (
              <AndroidStudioExportTab onShowToast={showToast} />
            )}
          </div>

          {/* Material 3 Bottom Navigation & Android System Bar */}
          <AndroidNavBar
            currentTab={currentTab}
            onSelectTab={tab => setCurrentTab(tab)}
            resultCount={results.length}
            historyCount={history.length}
            navigationMode={settings.navigationMode}
            onBackPress={handleAndroidBack}
            onHomePress={handleAndroidHome}
            onOverviewPress={handleAndroidOverview}
          />
        </div>
      </main>

      {/* Android Intent Modal Sheet */}
      {activeIntentLink && (
        <AndroidIntentSheet
          link={activeIntentLink}
          onClose={() => setActiveIntentLink(null)}
          onShowToast={showToast}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-[#0e131d] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                <span>Android App Preferences</span>
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-slate-200 font-medium">Auto-Strip Tracking Parameters</div>
                  <div className="text-[11px] text-slate-500">Removes ?_r=1, ?_t, etc.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.cleanTracking}
                  onChange={e => setSettings(s => ({ ...s, cleanTracking: e.target.checked }))}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-slate-200 font-medium">Device Frame Simulator</div>
                  <div className="text-[11px] text-slate-500">Show Google Pixel / Galaxy chassis</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showPhoneFrame}
                  onChange={e => setSettings(s => ({ ...s, showPhoneFrame: e.target.checked }))}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
              </label>

              <div>
                <label className="text-slate-200 font-medium block mb-1">Android System Navigation</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSettings(s => ({ ...s, navigationMode: 'gesture' }))}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-medium transition ${
                      settings.navigationMode === 'gesture'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Gesture Bar
                  </button>
                  <button
                    onClick={() => setSettings(s => ({ ...s, navigationMode: 'buttons' }))}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-medium transition ${
                      settings.navigationMode === 'buttons'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    3-Buttons (◀ ● ◼)
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0e131d] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>How the Android App Works</span>
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="bg-[#080c14] p-3 rounded-xl border border-slate-800/80 space-y-1">
                <h4 className="font-semibold text-cyan-300">1. Instant Unshortening Engine</h4>
                <p className="text-[11px] text-slate-400">
                  Short TikTok URLs (<code className="text-slate-300">vt.tiktok.com/ZS...</code>) redirect via server-side redirect chains to uncover the full canonical URL containing the creator username and video ID.
                </p>
              </div>

              <div className="bg-[#080c14] p-3 rounded-xl border border-slate-800/80 space-y-1">
                <h4 className="font-semibold text-purple-300">2. Android Intent Integration</h4>
                <p className="text-[11px] text-slate-400">
                  Uses the Android <code className="text-slate-300">intent://</code> URI format with package <code className="text-slate-300">com.zhiliaoapp.musically</code> to launch the official TikTok Android app without any intermediate browser screens.
                </p>
              </div>

              <div className="bg-[#080c14] p-3 rounded-xl border border-slate-800/80 space-y-1">
                <h4 className="font-semibold text-emerald-300">3. Android Studio & APK Export</h4>
                <p className="text-[11px] text-slate-400">
                  Download the complete Android Studio Kotlin + Jetpack Compose project from the "APK / Source" tab to compile directly into an Android <code className="text-slate-300">.apk</code> file.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold rounded-xl text-xs transition"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      <div className="fixed bottom-16 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-xs font-medium border backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-800 text-rose-200'
                : 'bg-slate-900/95 border-slate-700 text-slate-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
