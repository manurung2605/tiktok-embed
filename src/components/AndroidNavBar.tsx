import React from 'react';
import { AndroidTab } from '../types';
import { Link2, Code2, Smartphone, History, Download } from 'lucide-react';

interface AndroidNavBarProps {
  currentTab: AndroidTab;
  onSelectTab: (tab: AndroidTab) => void;
  resultCount: number;
  historyCount: number;
  navigationMode: 'gesture' | 'buttons';
  onBackPress?: () => void;
  onHomePress?: () => void;
  onOverviewPress?: () => void;
}

export const AndroidNavBar: React.FC<AndroidNavBarProps> = ({
  currentTab,
  onSelectTab,
  resultCount,
  historyCount,
  navigationMode,
  onBackPress,
  onHomePress,
  onOverviewPress,
}) => {
  const tabs = [
    { id: 'resolver' as AndroidTab, label: 'Resolver', icon: Link2, badge: resultCount },
    { id: 'embeds' as AndroidTab, label: 'Embeds', icon: Code2 },
    { id: 'intents' as AndroidTab, label: 'Intents', icon: Smartphone },
    { id: 'history' as AndroidTab, label: 'History', icon: History, badge: historyCount },
    { id: 'android-project' as AndroidTab, label: 'APK / Source', icon: Download },
  ];

  return (
    <div className="sticky bottom-0 left-0 right-0 z-40 bg-[#0d1117]/95 backdrop-blur-xl border-t border-slate-800/80 shadow-2xl">
      {/* Material 3 App Navigation Items */}
      <nav className="max-w-md mx-auto grid grid-cols-5 px-1 py-1.5" aria-label="Android Bottom Navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all relative group ${
                isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Material You Active Pill Indicator */}
              <div
                className={`flex items-center justify-center w-12 h-7 rounded-full transition-all duration-300 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(0,242,254,0.3)]'
                    : 'group-hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-md">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium mt-1 truncate max-w-full ${isActive ? 'font-semibold text-white' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Android System Navigation Bar (Gesture Pill or 3-Button) */}
      <div className="w-full flex items-center justify-center py-1.5 bg-[#080c12]/90 border-t border-slate-900 select-none">
        {navigationMode === 'gesture' ? (
          <button
            onClick={onHomePress}
            title="Android Home Gesture"
            className="w-32 h-1 bg-slate-500/60 hover:bg-cyan-400 active:bg-cyan-300 rounded-full transition-all cursor-pointer"
          />
        ) : (
          <div className="w-full max-w-xs flex items-center justify-around text-slate-500 py-0.5">
            <button
              onClick={onBackPress}
              title="Back"
              className="p-1 hover:text-cyan-400 active:scale-90 transition rounded"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>
            <button
              onClick={onHomePress}
              title="Home"
              className="p-1 hover:text-cyan-400 active:scale-90 transition rounded"
            >
              <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
            </button>
            <button
              onClick={onOverviewPress}
              title="Recents"
              className="p-1 hover:text-cyan-400 active:scale-90 transition rounded"
            >
              <div className="w-3.5 h-3.5 border-2 border-current rounded-sm" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
