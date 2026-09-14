import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  FolderTree,
  Database,
  Layers,
  Crown,
  Smartphone,
  Cpu,
  FileCode,
  Download,
} from 'lucide-react';
import {
  FLUTTER_DRIFT_SCHEMA_CODE,
  FLUTTER_RIVERPOD_ARCH_CODE,
  FLUTTER_BACKUP_ENGINE_CODE,
  FLUTTER_REVENUECAT_CODE,
} from '../../db/driftSchemaCode';

const PUBSPEC_CODE = `name: smartbiz_pocket
description: Lightweight, ultra-fast, offline-first business management app for informal traders.
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # State Management
  flutter_riverpod: ^2.5.1

  # Local SQLite Database & ORM
  drift: ^2.16.0
  sqlite3_flutter_libs: ^0.5.20
  path_provider: ^2.1.2
  path: ^1.9.0

  # Fast Key-Value Cache
  hive: ^2.2.3
  hive_flutter: ^1.1.0

  # Local Device Auth & PIN
  local_auth: ^2.1.8

  # PDF & Reporting
  pdf: ^3.10.8
  printing: ^5.12.0
  fl_chart: ^0.66.2

  # Offline Notifications
  flutter_local_notifications: ^17.0.0

  # Subscriptions (RevenueCat Architecture)
  purchases_flutter: ^7.0.0

  # Device & File Sharing
  share_plus: ^7.2.2
  intl: ^0.19.0
  uuid: ^4.3.3

dev_dependencies:
  flutter_test:
    sdk: flutter
  drift_dev: ^2.16.0
  build_runner: ^2.4.8
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/icons/
    - assets/images/`;

const FOLDER_TREE = `smartbiz_pocket/
├── android/
│   ├── app/
│   │   ├── build.gradle (minSdkVersion 26, Proguard enabled, R8 shrinker)
│   │   └── src/main/AndroidManifest.xml
├── assets/
│   └── icons/
├── lib/
│   ├── core/
│   │   ├── backup/
│   │   │   └── backup_engine.dart         # JSON & SQLite export/restore engine
│   │   ├── subscriptions/
│   │   │   └── revenuecat_service.dart    # RevenueCat entitlement & paywall guard
│   │   ├── security/
│   │   │   └── pin_auth_service.dart      # Local PIN & biometric authentication
│   │   └── theme/
│   │       └── app_theme.dart             # Material 3 typography & high-contrast theme
│   ├── database/
│   │   ├── app_database.dart              # Drift SQLite database definition (15 tables)
│   │   ├── daos/
│   │   │   ├── sales_dao.dart
│   │   │   ├── products_dao.dart
│   │   │   ├── expenses_dao.dart
│   │   │   └── debtors_dao.dart
│   │   └── migrations.dart
│   ├── features/
│   │   ├── dashboard/
│   │   │   └── presentation/screens/dashboard_screen.dart
│   │   ├── sales/
│   │   │   ├── data/sales_repository.dart
│   │   │   └── presentation/screens/sales_screen.dart
│   │   ├── expenses/
│   │   │   └── presentation/screens/expenses_screen.dart
│   │   ├── inventory/
│   │   │   └── presentation/screens/inventory_screen.dart
│   │   ├── debtors/
│   │   │   └── presentation/screens/debtors_screen.dart
│   │   ├── customers/
│   │   │   └── presentation/screens/customers_screen.dart
│   │   ├── reports/
│   │   │   └── presentation/screens/reports_screen.dart
│   │   ├── insights/
│   │   │   └── presentation/screens/insights_screen.dart
│   │   └── settings/
│   │       └── presentation/screens/settings_screen.dart
│   └── main.dart
├── pubspec.yaml
└── README.md`;

const ANDROID_OPTIMIZATION_GUIDE = `// android/app/build.gradle
// CRITICAL OPTIMIZATIONS FOR 2GB RAM ANDROID 8+ (API 26+) DEVICES

android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.smartbiz.pocket"
        minSdkVersion 26       // Android 8.0 Oreo
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
        
        // SQLite Vectorized Math Optimization
        ndk {
            abiFilters 'armeabi-v7a', 'arm64-v8a'
        }
    }

    buildTypes {
        release {
            minifyEnabled true       // Enable R8 code shrinking
            shrinkResources true     // Strip unused assets
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.debug
        }
    }
}

// Low-Memory SQLite Pragmas applied at runtime:
// PRAGMA cache_size = -2000; (Limits RAM cache to 2MB)
// PRAGMA temp_store = MEMORY;
// PRAGMA journal_mode = WAL; (Write-Ahead Logging prevents database locks)
// PRAGMA synchronous = NORMAL; (Ultra-fast commits under 100ms on slow flash storage)`;

export const FlutterHubModule: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<
    'drift' | 'riverpod' | 'backup' | 'revenuecat' | 'pubspec' | 'folder' | 'android'
  >('drift');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getCodeContent = () => {
    switch (activeSubTab) {
      case 'drift':
        return FLUTTER_DRIFT_SCHEMA_CODE;
      case 'riverpod':
        return FLUTTER_RIVERPOD_ARCH_CODE;
      case 'backup':
        return FLUTTER_BACKUP_ENGINE_CODE;
      case 'revenuecat':
        return FLUTTER_REVENUECAT_CODE;
      case 'pubspec':
        return PUBSPEC_CODE;
      case 'folder':
        return FOLDER_TREE;
      case 'android':
        return ANDROID_OPTIMIZATION_GUIDE;
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Flutter & Drift Architecture Hub
            </h2>
            <p className="text-xs text-slate-500">
              Complete production blueprints, SQLite schema, Riverpod & backup engines
            </p>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {[
          { id: 'drift', label: 'Drift SQLite (15 Tables)', icon: Database },
          { id: 'riverpod', label: 'Riverpod 2.x State', icon: Layers },
          { id: 'backup', label: 'Offline Backup Engine', icon: Download },
          { id: 'revenuecat', label: 'RevenueCat Architecture', icon: Crown },
          { id: 'pubspec', label: 'pubspec.yaml', icon: FileCode },
          { id: 'folder', label: 'Folder Architecture', icon: FolderTree },
          { id: 'android', label: 'Android 8+ Low RAM Guide', icon: Cpu },
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeSubTab === item.id
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* RevenueCat Credentials Banner if selected */}
      {activeSubTab === 'revenuecat' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-slate-800">RevenueCat Flutter v8+ Architecture</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Production & Test
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-mono">
                API Key (iOS & Android): <strong className="text-emerald-700">test_RVdhYytnLyhMFndYhQvPFRKjhYI</strong>
              </p>
              <p className="text-[11px] text-slate-600">
                Entitlement: <strong className="font-mono text-amber-800">smartbiz_pocket_pro</strong> • Pro Plan: <strong>$2.00 / month</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy('flutter pub add purchases_flutter purchases_ui_flutter', 'pub_cmd')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                {copiedKey === 'pub_cmd' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Pub Cmd Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy pub add</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleCopy('test_RVdhYytnLyhMFndYhQvPFRKjhYI', 'rc_key')}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                {copiedKey === 'rc_key' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Key Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy API Key</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 bg-white/70 p-2 rounded-lg border border-amber-500/20 flex items-center justify-between">
            <span>Includes RevenueCat Paywalls (<code>RevenueCatUI.presentPaywall</code>) and Customer Center (<code>RevenueCatUI.presentCustomerCenter</code>).</span>
          </div>
        </div>
      )}

      {/* Code Viewer Container */}
      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800">
        <div className="bg-slate-950 px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-mono text-slate-400 ml-2">
              {activeSubTab === 'drift'
                ? 'lib/database/app_database.dart'
                : activeSubTab === 'riverpod'
                ? 'lib/features/sales/presentation/riverpod_providers.dart'
                : activeSubTab === 'backup'
                ? 'lib/core/backup/backup_engine.dart'
                : activeSubTab === 'revenuecat'
                ? 'lib/core/subscriptions/revenuecat_service.dart'
                : activeSubTab === 'pubspec'
                ? 'pubspec.yaml'
                : activeSubTab === 'folder'
                ? 'PROJECT_STRUCTURE.md'
                : 'android/app/build.gradle'}
            </span>
          </div>

          <button
            onClick={() => handleCopy(getCodeContent(), activeSubTab)}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            {copiedKey === activeSubTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[500px] leading-relaxed select-all">
          {getCodeContent()}
        </pre>
      </div>
    </div>
  );
};
