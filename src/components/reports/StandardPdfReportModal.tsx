import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  Download,
  ExternalLink,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { SmartBizState } from '../../types';
import {
  printStandardReport,
  openStandardReportTab,
  StandardReportOptions,
} from '../../utils/pdfExport';
import { StandardReportDocument } from './StandardReportDocument';

interface StandardPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: SmartBizState;
  initialPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';
}

export const StandardPdfReportModal: React.FC<StandardPdfReportModalProps> = ({
  isOpen,
  onClose,
  state,
  initialPeriod = 'monthly',
}) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'>(
    initialPeriod
  );
  const [paperSize, setPaperSize] = useState<'a4' | 'letter'>('a4');
  const [customNotes, setCustomNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  const reportOptions: StandardReportOptions = {
    state,
    period,
    paperSize,
    customNotes: customNotes.trim() || undefined,
  };

  const handlePrint = () => {
    setIsPrinting(true);
    try {
      printStandardReport(reportOptions);
    } catch (err) {
      console.error('Print error:', err);
    } finally {
      setTimeout(() => setIsPrinting(false), 800);
    }
  };

  const handleOpenNewTab = () => {
    openStandardReportTab(reportOptions);
  };

  // CSV download fallback
  const handleDownloadCsv = () => {
    const currency = state.settings?.currencySymbol || '$';
    const business = state.business || { name: 'SmartBiz Merchant' };
    const lines = [
      `"SmartBiz Pocket - Official Standard Business Report"`,
      `"Business Name","${business.name}"`,
      `"Period","${period.toUpperCase()}"`,
      `"Paper Standard","${paperSize.toUpperCase()}"`,
      `"Generated At","${new Date().toLocaleString()}"`,
      '',
      `"Category","Item","Amount (${currency})"`,
      `"Income","Total Revenue","${state.sales.reduce((sum, s) => sum + s.totalSale, 0).toFixed(2)}"`,
      `"Expense","Total Expenses","${state.expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}"`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${business.name.replace(/\s+/g, '_')}_Report_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl h-[94vh] flex flex-col overflow-hidden text-slate-800">
        {/* Modal Top Bar */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Standard Business Report (PDF / Print)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wide">
                  Standard Full-Size
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official document format (A4 / US Letter) • Renders without phone borders or mobile constraints
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filter Controls */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0 text-xs">
          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(
              [
                { id: 'daily', label: 'Today' },
                { id: 'weekly', label: 'This Week (7d)' },
                { id: 'monthly', label: 'This Month (30d)' },
                { id: 'yearly', label: 'This Year' },
                { id: 'all', label: 'All-Time' },
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  period === tab.id
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Paper Size & Notes Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setPaperSize('a4')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  paperSize === 'a4'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                A4 (Standard)
              </button>
              <button
                onClick={() => setPaperSize('letter')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  paperSize === 'letter'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                US Letter
              </button>
            </div>

            <button
              onClick={() => setShowNotesInput(!showNotesInput)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              {showNotesInput ? 'Hide Notes' : '+ Add Note / Remarks'}
            </button>
          </div>

          {/* Primary Print / Save Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleOpenNewTab}
              title="Open full page document in standalone window"
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
              <span>Open in Tab</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              title="Download raw spreadsheet data"
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Preparing Document...' : 'Print / Save as Standard PDF'}</span>
            </button>
          </div>
        </div>

        {/* Optional Custom Notes Input Bar */}
        {showNotesInput && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2 shrink-0 animate-in slide-in-from-top-2 duration-150">
            <span className="text-xs font-bold text-amber-900 shrink-0">Custom Note:</span>
            <input
              type="text"
              value={customNotes}
              onChange={e => setCustomNotes(e.target.value)}
              placeholder="e.g. For Q3 tax filing, bank loan verification, or monthly audit with accountant..."
              className="flex-1 px-3 py-1 bg-white border border-amber-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {customNotes && (
              <button
                onClick={() => setCustomNotes('')}
                className="text-xs text-amber-700 hover:text-amber-900 font-semibold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Document Preview Canvas (Standard Paper Canvas) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200 flex justify-center items-start">
          <div className="w-full flex flex-col items-center">
            {/* Standard Page Dimensions Notice */}
            <div className="mb-3 text-[11px] text-slate-600 flex items-center gap-1.5 font-medium bg-white/70 backdrop-blur-xs px-3 py-1 rounded-full border border-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Standard {paperSize.toUpperCase()} Document (210 × 297 mm) • Ready to Print or Save as PDF
              </span>
            </div>

            {/* Realistic Standard Document Sheet Preview */}
            <StandardReportDocument options={reportOptions} />
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span>Tip: Select <strong>"Save as PDF"</strong> in the destination menu of your browser print dialog.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
