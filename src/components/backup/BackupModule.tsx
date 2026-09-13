import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileJson,
  HardDrive,
  Clock,
  Sparkles,
} from 'lucide-react';
import { SmartBizState, BackupMetadata } from '../../types';
import { INITIAL_STATE } from '../../db/storage';

interface BackupModuleProps {
  state: SmartBizState;
  onRestoreState: (newState: SmartBizState) => void;
  onAddBackupLog: (backup: BackupMetadata) => void;
}

export const BackupModule: React.FC<BackupModuleProps> = ({
  state,
  onRestoreState,
  onAddBackupLog,
}) => {
  const { backups, settings } = state;
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // 1. Export JSON Backup
  const handleCreateBackup = () => {
    try {
      const nowStr = new Date().toISOString().slice(0, 10);
      const filename = `smartbiz_backup_${nowStr}_${Date.now().toString().slice(-4)}.json`;
      const jsonString = JSON.stringify(state, null, 2);
      const sizeBytes = new Blob([jsonString]).size;

      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Record backup log
      const newLog: BackupMetadata = {
        id: 'bak-' + Date.now(),
        timestamp: new Date().toISOString(),
        filename,
        sizeBytes,
        itemCounts: {
          products: state.products.length,
          sales: state.sales.length,
          expenses: state.expenses.length,
          debtors: state.debtors.length,
          customers: state.customers.length,
        },
      };

      onAddBackupLog(newLog);
      setStatusMessage({
        text: `Backup saved! File "${filename}" downloaded to phone storage.`,
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setStatusMessage({
        text: 'Failed to generate backup file. Check storage permissions.',
        type: 'error',
      });
    }
  };

  // 2. Restore JSON Backup File
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const raw = event.target?.result as string;
        const parsed = JSON.parse(raw);

        if (!parsed.products || !parsed.sales) {
          throw new Error('Invalid SmartBiz Pocket backup format');
        }

        onRestoreState(parsed);
        setStatusMessage({
          text: `Success! Restored ${parsed.products.length} products and ${parsed.sales.length} sales.`,
          type: 'success',
        });
        setTimeout(() => setStatusMessage(null), 4000);
      } catch (err) {
        setStatusMessage({
          text: 'Restore failed: The selected file is not a valid SmartBiz backup.',
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
  };

  // 3. Reset to Sample Tuckshop Data
  const handleLoadSampleData = () => {
    if (confirm('Load sample Tuckshop data? This will reset records to demo items.')) {
      onRestoreState(INITIAL_STATE);
      setStatusMessage({
        text: 'Sample Tuckshop data loaded successfully.',
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-800">Local Backup & Restore</h2>
        <p className="text-xs text-slate-500">
          User owns all data • Save to phone storage or SD card • 100% offline
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Backup Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Create Backup */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Create Backup Now</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Saves a snapshot of all {state.products.length} products, {state.sales.length} sales, and debtors to a file on your device.
            </p>
          </div>

          <button
            onClick={handleCreateBackup}
            className="mt-4 w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-transform"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup (.JSON)</span>
          </button>
        </div>

        {/* Restore Backup */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center mb-2">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Restore from File</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Restore your records after phone reset or when transferring to a new Android device.
            </p>
          </div>

          <label className="mt-4 w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Select Backup File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileRestore}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Demo Data Reset Helper */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-800">Reset Demo Tuckshop Data</h4>
            <p className="text-[11px] text-slate-500">
              Preload realistic Zimbabwean market items (Mazoe, Sugar, Bread, Kombi expenses).
            </p>
          </div>
        </div>
        <button
          onClick={handleLoadSampleData}
          className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 shrink-0"
        >
          Reset Demo
        </button>
      </div>

      {/* Backup History */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-500" />
          Backup History Log
        </h4>

        {backups.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">No backups created yet.</p>
        ) : (
          <div className="space-y-1.5">
            {backups.map(b => (
              <div
                key={b.id}
                className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-center"
              >
                <div className="flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-emerald-700" />
                  <div>
                    <span className="font-semibold text-slate-800">{b.filename}</span>
                    <p className="text-[10px] text-slate-400">
                      {new Date(b.timestamp).toLocaleString()} • {Math.round(b.sizeBytes / 1024)} KB
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                  {b.itemCounts.products} items, {b.itemCounts.sales} sales
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
