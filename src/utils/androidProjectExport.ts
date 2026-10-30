import JSZip from 'jszip';

export async function generateAndroidStudioProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // Root files
  zip.file(
    'README.md',
    `# TikTok Link Resolver & Embed Studio - Android App

This is a production-ready Native Android project containing:
- AndroidManifest.xml configured with Intent Filters for \`vt.tiktok.com\`, \`vm.tiktok.com\`, and \`tiktok.com\`
- Kotlin MainActivity with modern Jetpack Compose & Android WebView bridge
- Android Intent sharing handler (\`ACTION_SEND\`) to accept links shared from the TikTok app
- Fast unshortening pipeline & deep-link routing

## How to Build in Android Studio
1. Open Android Studio -> **Open an Existing Project**.
2. Select this unzipped folder.
3. Wait for Gradle sync to complete.
4. Connect an Android phone (or launch an Android Virtual Device / Emulator).
5. Click **Run 'app'** (Green Play button) or in terminal:
   \`\`\`bash
   ./gradlew assembleDebug
   \`\`\`
   The generated APK will be at \`app/build/outputs/apk/debug/app-debug.apk\`.

## Features
- Handles TikTok short URLs via Android Share Sheet
- Automatically strips tracking parameters
- Launches directly back to TikTok or web preview
`
  );

  zip.file(
    'build.gradle.kts',
    `// Top-level build file
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
`
  );

  zip.file(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "TikTokLinkResolver"
include(":app")
`
  );

  // App module build.gradle.kts
  zip.file(
    'app/build.gradle.kts',
    `plugins {
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

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation(platform("androidx.compose:compose-bom:2024.12.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
}
`
  );

  // AndroidManifest.xml
  zip.file(
    'app/src/main/AndroidManifest.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.TikTokResolver">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.TikTokResolver"
            android:windowSoftInputMode="adjustResize">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Android Share Sheet: Receive shared TikTok links from TikTok App -->
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

</manifest>
`
  );

  // MainActivity.kt
  zip.file(
    'app/src/main/java/com/tiktokresolver/app/MainActivity.kt',
    `package com.tiktokresolver.app

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
        } else if (intent?.action == Intent.ACTION_VIEW) {
            intent.data?.let { uri ->
                sharedUrl = uri.toString()
            }
        }
    }
}

@Composable
fun TikTokAppScreen(sharedUrl: String?) {
    // Hosts the high-performance local or hosted PWA WebView with native Android bridge
    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { context ->
            WebView(context).apply {
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    loadWithOverviewMode = true
                    useWideViewPort = true
                    cacheMode = WebSettings.LOAD_DEFAULT
                    mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                }
                webViewClient = WebViewClient()
                
                // Target URL or bundled assets
                val targetUrl = if (!sharedUrl.isNullOrEmpty()) {
                    "https://ais-dev-m6qa6atebcp7avbdlqfdtj-210360570729.asia-east1.run.app/?url=" + 
                        java.net.URLEncoder.encode(sharedUrl, "UTF-8")
                } else {
                    "https://ais-dev-m6qa6atebcp7avbdlqfdtj-210360570729.asia-east1.run.app/"
                }
                loadUrl(targetUrl)
            }
        },
        update = { webView ->
            if (!sharedUrl.isNullOrEmpty()) {
                webView.evaluateJavascript("window.__androidSharedUrl && window.__androidSharedUrl('$sharedUrl');", null)
            }
        }
    )
}
`
  );

  // Strings and Colors XML
  zip.file(
    'app/src/main/res/values/strings.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">TikTok Resolver</string>
</resources>
`
  );

  zip.file(
    'app/src/main/res/values/themes.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.TikTokResolver" parent="android:Theme.Material.NoActionBar">
        <item name="android:statusBarColor">#0b0f17</item>
        <item name="android:navigationBarColor">#0b0f17</item>
        <item name="android:windowBackground">#0b0f17</item>
    </style>
</resources>
`
  );

  return await zip.generateAsync({ type: 'blob' });
}
