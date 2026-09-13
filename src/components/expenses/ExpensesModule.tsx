import React, { useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Camera,
  Image as ImageIcon,
  X,
  PieChart,
  Tag,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { SmartBizState, Expense, ExpenseCategory } from '../../types';

interface ExpensesModuleProps {
  state: SmartBizState;
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onDeleteExpense: (id: string) => void;
  isQuickAddOpen: boolean;
  onCloseQuickAdd: () => void;
  onOpenQuickAdd: () => void;
}

const CATEGORIES: { name: ExpenseCategory; desc: string }[] = [
  { name: 'Transport', desc: 'Kombi & Market Fare' },
  { name: 'ZESA', desc: 'Electricity Tokens' },
  { name: 'Rent', desc: 'Shop / Stall Rent' },
  { name: 'Water', desc: 'Council Water Bill' },
  { name: 'Salary', desc: 'Staff Wages' },
  { name: 'Fuel', desc: 'Petrol / Diesel' },
  { name: 'Packaging', desc: 'Plastic Bags & Boxes' },
  { name: 'Internet', desc: 'Bundles & WiFi' },
  { name: 'Maintenance', desc: 'Repairs & Tools' },
  { name: 'Other', desc: 'Miscellaneous' },
];

export const ExpensesModule: React.FC<ExpensesModuleProps> = ({
  state,
  onAddExpense,
  onDeleteExpense,
  isQuickAddOpen,
  onCloseQuickAdd,
  onOpenQuickAdd,
}) => {
  const { expenses, settings } = state;
  const currency = settings.currencySymbol;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState<ExpenseCategory>('Transport');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash USD');
  const [receiptPhoto, setReceiptPhoto] = useState<string>('');

  // Quick amount buttons
  const quickAmounts = [1, 2, 5, 10, 20, 50];

  // Filtered expenses
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch =
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat =
      selectedCategoryFilter === 'All' || e.category === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  // Category breakdown for summary
  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalSpentAllTime = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Handle Receipt photo input
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      alert('Please enter a valid expense amount');
      return;
    }

    onAddExpense({
      date: new Date().toISOString(),
      category,
      amount: parsedAmount,
      description: description.trim() || `${category} expense`,
      paymentMethod,
      receiptPhoto: receiptPhoto || undefined,
    });

    // Reset
    setAmount('');
    setDescription('');
    setReceiptPhoto('');
    onCloseQuickAdd();
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">Expense Management</h2>
          <p className="text-xs text-slate-500">Track where your money goes without accounting jargon</p>
        </div>
        <button
          onClick={onOpenQuickAdd}
          className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Expense</span>
        </button>
      </div>

      {/* Category Spend Breakdown Mini Card */}
      {totalSpentAllTime > 0 && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">Top Spend Categories</span>
            <span className="text-xs font-bold text-rose-600">
              Total: {currency}{totalSpentAllTime.toFixed(2)}
            </span>
          </div>

          <div className="space-y-2">
            {(Object.entries(categoryTotals) as [string, number][])
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([cat, val]) => {
                const pct = Math.round((val / totalSpentAllTime) * 100);
                return (
                  <div key={cat} className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{cat}</span>
                      <span className="font-bold text-slate-900">
                        {currency}{val.toFixed(2)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-rose-500 h-1.5 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Search & Category Filter Pills */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search expenses by category or description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {['All', ...CATEGORIES.map(c => c.name)].map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategoryFilter(c)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition-colors ${
                selectedCategoryFilter === c
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-2">
        {filteredExpenses.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
            <Tag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No expenses recorded yet</p>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xs mx-auto">
              {searchTerm || selectedCategoryFilter !== 'All'
                ? 'No expenses match your active filters.'
                : 'Track Kombi fares, ZESA tokens, rent, wages, or council bills to calculate true net profit.'}
            </p>
            {searchTerm || selectedCategoryFilter !== 'All' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategoryFilter('All');
                }}
                className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenQuickAdd}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Record First Expense</span>
              </button>
            )}
          </div>
        ) : (
          filteredExpenses.map(exp => (
            <div
              key={exp.id}
              className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                  {exp.category.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">{exp.category}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                      {exp.paymentMethod}
                    </span>
                    {exp.receiptPhoto && (
                      <button
                        onClick={() => setPreviewPhoto(exp.receiptPhoto!)}
                        className="text-[10px] text-emerald-700 flex items-center gap-0.5 hover:underline"
                      >
                        <ImageIcon className="w-3 h-3" /> Photo
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-0.5">{exp.description}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(exp.date).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 flex items-center gap-2">
                <div>
                  <div className="text-sm font-extrabold text-rose-600">
                    -{currency}{exp.amount.toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Delete this expense?')) {
                      onDeleteExpense(exp.id);
                    }
                  }}
                  title="Delete"
                  className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* QUICK ADD EXPENSE MODAL */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Record Expense</h3>
                <p className="text-[11px] text-slate-500">Record costs in under 10 seconds</p>
              </div>
              <button
                onClick={onCloseQuickAdd}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              {/* Category selector chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category *
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIES.map(c => (
                    <button
                      type="button"
                      key={c.name}
                      onClick={() => setCategory(c.name)}
                      className={`p-2 rounded-lg border text-left text-xs transition-all ${
                        category === c.name
                          ? 'bg-rose-50 border-rose-500 text-rose-800 font-bold shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-[10px] text-slate-500">{c.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount & Quick Preset Chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full text-base font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500"
                />
                {/* Fast presets */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400">Quick:</span>
                  {quickAmounts.map(val => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setAmount(val.toString())}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      {currency}{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kombi to Mbare, 100kWh ZESA token..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paid With
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {['Cash USD', 'EcoCash', 'ZiG Cash'].map(pm => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      className={`p-1.5 rounded-lg border text-center font-medium ${
                        paymentMethod === pm
                          ? 'bg-rose-600 text-white font-bold border-rose-600'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              {/* Receipt Photo Attachment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Receipt Photo (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer">
                    <Camera className="w-4 h-4 text-slate-600" />
                    <span>Upload or Snap Receipt</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {receiptPhoto && (
                    <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                      <img
                        src={receiptPhoto}
                        alt="Receipt Preview"
                        className="w-7 h-7 object-cover rounded border border-emerald-300"
                      />
                      <span>Attached</span>
                      <button
                        type="button"
                        onClick={() => setReceiptPhoto('')}
                        className="text-rose-500 ml-1 hover:underline text-[10px]"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
                >
                  Save Expense (-{currency}{parseFloat(amount) ? parseFloat(amount).toFixed(2) : '0.00'})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Size Photo Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="max-w-md bg-white p-2 rounded-2xl overflow-hidden shadow-2xl">
            <img src={previewPhoto} alt="Receipt" className="max-h-[70vh] rounded-lg w-full object-contain" />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="mt-2 w-full py-2 bg-slate-800 text-white rounded-lg text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
