import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal, Bell } from 'lucide-react';

interface AndroidStatusBarProps {
  notificationCount?: number;
}

export const AndroidStatusBar: React.FC<AndroidStatusBarProps> = ({ notificationCount = 0 }) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-[#0b0f17]/95 backdrop-blur-md px-5 py-2 flex items-center justify-between text-xs font-medium text-slate-300 border-b border-slate-800/40 select-none z-30">
      {/* Left: Time and Notification icons */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-200 tracking-tight text-[13px]">{timeStr || '12:00'}</span>
        {notificationCount > 0 && (
          <div className="flex items-center gap-1 bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full text-[10px]">
            <Bell className="w-2.5 h-2.5" />
            <span>{notificationCount}</span>
          </div>
        )}
      </div>

      {/* Center: Subtle Android Pill Notch (if in phone frame) */}
      <div className="hidden sm:flex items-center gap-1.5 opacity-60">
        <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/80"></div>
        </div>
      </div>

      {/* Right: Android Status Icons (5G, WiFi, Battery) */}
      <div className="flex items-center gap-2.5 text-slate-400">
        <div className="flex items-center gap-0.5 text-[10px] font-bold text-cyan-400">
          <span>5G</span>
          <Signal className="w-3.5 h-3.5 text-slate-200" />
        </div>
        <Wifi className="w-3.5 h-3.5 text-slate-200" />
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-slate-300">98%</span>
          <BatteryMedium className="w-4 h-4 text-emerald-400" />
        </div>
      </div>
    </div>
  );
};
