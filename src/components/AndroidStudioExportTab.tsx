import React, { useState } from 'react';
import { generateAndroidStudioProjectZip } from '../utils/androidProjectExport';
import {
  Download,
  Code2,
  FileCode2,
  CheckCircle2,
  Copy,
  Terminal,
  FolderArchive,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface AndroidStudioExportTabProps {
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AndroidStudioExportTab: React.FC<AndroidStudioExportTabProps> = ({ onShowToast }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [activeCodeFile, setActiveCodeFile] = useState<'manifest' | 'activity' | 'gradle'>('manifest');

  const handleDownloadProject = async () => {
    setIsExporting(true);
    try {
      const blob = await generateAndroidStudioProjectZip();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `TikTokLinkResolver-AndroidStudio-Project-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast('Android Studio Project (.ZIP) downloaded!', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Failed to generate project archive', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const manifestSnippet = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="TikTok Resolver"
        android:theme="@style/Theme.TikTokResolver">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Android Share Sheet: Receive URLs shared directly from TikTok -->
            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="text/plain" />
            </intent-filter>

            <!-- Deep Link Handler: Intercept vt.tiktok.com and vm.tiktok.com -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="vt.tiktok.com" />
                <data android:scheme="https" android:host="vm.tiktok.com" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  const activitySnippet = `package com.tiktokresolver.app

import android.content.Intent
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

class MainActivity : ComponentActivity() {

    private var sharedUrl by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleIntent(intent)

        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    TikTokAppScreen(sharedUrl = sharedUrl)
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        if (intent?.action == Intent.ACTION_SEND && intent.type == "text/plain") {
            val text = intent.getStringExtra(Intent.EXTRA_TEXT)
            if (!text.isNullOrEmpty()) {
                sharedUrl = text
            }
        }
    }
}`;

  const gradleSnippet = `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.tiktokresolver.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.tiktokresolver.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation(platform("androidx.compose:compose-bom:2024.12.01"))
    implementation("androidx.compose.material3:material3")
    implementation("androidx.webkit:webkit:1.12.1")
}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="bg-gradient-to-br from-[#121926] via-[#0d121c] to-[#150e24] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Android Studio Ready
            </span>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderArchive className="w-5 h-5 text-cyan-400" />
              <span>Native Android Project & APK Generation</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Export the complete native Android codebase (Kotlin + Jetpack Compose + AndroidManifest.xml) ready to open in Android Studio and build your <code className="text-cyan-300 font-mono">.apk</code> file.
            </p>
          </div>

          <button
            onClick={handleDownloadProject}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:opacity-95 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition disabled:opacity-50 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating ZIP...' : 'Download Android Studio (.ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* 3 Step Guide to Build APK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0e131e] border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center font-mono">
            1
          </div>
          <h4 className="text-xs font-semibold text-white">Open in Android Studio</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Extract the downloaded ZIP. Launch Android Studio, click <strong>Open Project</strong>, and select the unzipped directory.
          </p>
        </div>

        <div className="bg-[#0e131e] border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 font-bold text-xs flex items-center justify-center font-mono">
            2
          </div>
          <h4 className="text-xs font-semibold text-white">Share Sheet & Intent Filters</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Preconfigured with <code className="text-cyan-300 font-mono">ACTION_SEND</code> to intercept shared URLs directly when clicking "Share" inside the TikTok Android app!
          </p>
        </div>

        <div className="bg-[#0e131e] border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center font-mono">
            3
          </div>
          <h4 className="text-xs font-semibold text-white">Build APK / AAB</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Run <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-300 font-mono">./gradlew assembleDebug</code> in terminal to generate the installable <code className="text-emerald-400 font-mono">app-debug.apk</code>.
          </p>
        </div>
      </div>

      {/* Code Inspector */}
      <div className="bg-[#0e131e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Source File Inspector</h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveCodeFile('manifest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition ${
                activeCodeFile === 'manifest'
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              AndroidManifest.xml
            </button>
            <button
              onClick={() => setActiveCodeFile('activity')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition ${
                activeCodeFile === 'activity'
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              MainActivity.kt
            </button>
            <button
              onClick={() => setActiveCodeFile('gradle')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition ${
                activeCodeFile === 'gradle'
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              build.gradle.kts
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="w-full bg-[#080c14] border border-slate-800 rounded-xl p-4 text-xs font-mono text-cyan-300 overflow-x-auto max-h-[380px] shadow-inner select-all leading-relaxed">
            {activeCodeFile === 'manifest'
              ? manifestSnippet
              : activeCodeFile === 'activity'
              ? activitySnippet
              : gradleSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
};
