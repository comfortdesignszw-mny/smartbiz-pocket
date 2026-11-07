import React, { useState } from 'react';
import {
  Plus,
  Search,
  Phone,
  MessageSquare,
  DollarSign,
  CheckCircle2,
  Calendar,
  AlertCircle,
  X,
  History,
  Clock,
  ArrowDownCircle,
  Copy,
  Check,
  ExternalLink,
  Send,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SmartBizState, Debtor, PaymentRecord } from '../../types';
import {
  cleanPhoneNumberForWhatsApp,
  getDebtorPaybackStatus,
  generateDebtorReminderText,
  getDebtorWhatsAppUrl,
  isMorningReminderWindow,
} from '../../utils/debtorReminder';

interface DebtorsModuleProps {
  state: SmartBizState;
  onAddDebtor: (debtor: Omit<Debtor, 'id' | 'status'>) => void;
  onRecordPayment: (debtorId: string, amount: number, paymentMethod: string, notes?: string) => void;
  onDeleteDebtor: (debtorId: string) => void;
  onMarkReminderSent?: (debtorId: string) => void;
}

export const DebtorsModule: React.FC<DebtorsModuleProps> = ({
  state,
  onAddDebtor,
  onRecordPayment,
  onDeleteDebtor,
  onMarkReminderSent,
}) => {
  const debtors = state.debtors || [];
  const payments = state.payments || [];
  const customers = state.customers || [];
  const settings = state.settings || { currencySymbol: '$' };
  const business = state.business || { name: 'SmartBiz Merchant' };
  const currency = settings.currencySymbol || '$';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Cleared'>('Active');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Payment Recording Modal State
  const [activePayingDebtor, setActivePayingDebtor] = useState<Debtor | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<string>('Cash USD');
  const [paymentNote, setPaymentNote] = useState<string>('');

  // WhatsApp Reminder Modal State
  const [whatsappDebtor, setWhatsappDebtor] = useState<Debtor | null>(null);
  const [language, setLanguage] = useState<'en' | 'sn'>('en');
  const [copied, setCopied] = useState(false);
  const [quickCopiedId, setQuickCopiedId] = useState<string | null>(null);

  // New Debtor Form State
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amountOwed, setAmountOwed] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Total uncollected money
  const activeDebtors = debtors.filter(d => d.balanceOwed > 0);
  const totalUncollectedDebt = activeDebtors.reduce((sum, d) => sum + d.balanceOwed, 0);

  // Auto-reminder 24h & morning check: debtors due tomorrow, due today, or overdue
  const debtorsNeedingReminder = activeDebtors.filter(d => {
    if (!d.dueDate) return false;
    const status = getDebtorPaybackStatus(d);
    return status.isDueTomorrow || status.isDueToday || (status.isOverdue && Math.abs(status.daysRemaining) <= 14);
  });

  // Filtered debtors
  const filteredDebtors = debtors.filter(d => {
    const matchesSearch =
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.phoneNumber && d.phoneNumber.includes(searchTerm)) ||
      (d.notes && d.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      filterStatus === 'All'
        ? true
        : filterStatus === 'Active'
        ? d.balanceOwed > 0
        : d.balanceOwed === 0;

    return matchesSearch && matchesStatus;
  });

  // Handle Add Debtor with mandatory name, phone, amount, and payback date
  const handleSaveDebtor = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountOwed);
    if (!customerName.trim()) {
      alert('Customer Name is mandatory for credit sales to allow follow-up.');
      return;
    }
    if (!phoneNumber.trim()) {
      alert('Phone Number is mandatory for credit sales to send WhatsApp payback reminders.');
      return;
    }
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount owed.');
      return;
    }
    if (!dueDate) {
      alert('Date of Payback is mandatory for credit sales so the system can schedule payment reminders.');
      return;
    }

    onAddDebtor({
      customerName: customerName.trim(),
      phoneNumber: phoneNumber.trim(),
      originalAmount: amount,
      balanceOwed: amount,
      date: new Date().toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      notes: notes.trim() || undefined,
    });

    setCustomerName('');
    setPhoneNumber('');
    setAmountOwed('');
    setNotes('');
    setDueDate('');
    setIsAddOpen(false);
  };

  // Handle Record Payment
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePayingDebtor) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    onRecordPayment(activePayingDebtor.id, amount, payMethod, paymentNote.trim() || undefined);

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#059669', '#10B981'],
    });

    setActivePayingDebtor(null);
    setPaymentAmount('');
    setPaymentNote('');
  };

  // Generate WhatsApp text with courteous date context
  const getWhatsAppMessage = (debtor: Debtor) => {
    return generateDebtorReminderText(debtor, business.name, currency, language);
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">People Who Owe Me</h2>
          <p className="text-xs text-slate-500">Track credit, partial payments & send WhatsApp reminders</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Credit</span>
        </button>
      </div>

      {/* 24-Hour Payback WhatsApp Auto-Reminders Hub (User Request 1) */}
      {debtorsNeedingReminder.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-3.5 rounded-2xl shadow-lg border border-emerald-500/40 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                <MessageSquare className="w-4 h-4 fill-emerald-300/30" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>24-Hour Payback WhatsApp Reminders</span>
                  <span className="bg-emerald-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                    {debtorsNeedingReminder.length} Due
                  </span>
                </h3>
                <p className="text-[10px] text-emerald-200">
                  Morning reminders (08:00 AM) — 1-tap fire directly to customer WhatsApp
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {debtorsNeedingReminder.map(debtor => {
              const status = getDebtorPaybackStatus(debtor);
              const waUrl = getDebtorWhatsAppUrl(debtor, business.name, currency);
              const messageText = generateDebtorReminderText(debtor, business.name, currency);
              const isCopied = quickCopiedId === debtor.id;

              return (
                <div
                  key={debtor.id}
                  className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-white truncate">{debtor.customerName}</span>
                      <span className="text-[10px] text-emerald-300 font-mono">({debtor.phoneNumber})</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                          status.isDueToday
                            ? 'bg-rose-500 text-white animate-pulse'
                            : status.isDueTomorrow
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-emerald-500 text-slate-950 font-bold'
                        }`}
                      >
                        {status.isDueTomorrow
                          ? '⏰ Due Tomorrow (24h)'
                          : status.isDueToday
                          ? '🚨 Due Today'
                          : status.statusBadgeText}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-200 mt-0.5">
                      Owes: <strong className="text-amber-300">{currency}{debtor.balanceOwed.toFixed(2)}</strong> • Payback: {status.formattedDueDate}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {debtor.phoneNumber && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          if (onMarkReminderSent) onMarkReminderSent(debtor.id);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
                        title="Send 1-tap reminder directly to customer WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Auto-Fire WhatsApp</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(messageText);
                        setQuickCopiedId(debtor.id);
                        setTimeout(() => setQuickCopiedId(null), 2000);
                      }}
                      className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copy reminder text to clipboard"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Outstanding Total Banner ("Money on the street") */}
      <div className="bg-gradient-to-r from-rose-600 to-red-700 text-white p-4 rounded-xl shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-rose-100 uppercase tracking-wider">
              Total Money on the Street
            </span>
            <div className="text-2xl font-black tracking-tight mt-0.5">
              {currency}{totalUncollectedDebt.toFixed(2)}
            </div>
            <p className="text-[11px] text-rose-200 mt-0.5">
              {activeDebtors.length} person(s) currently owe you money
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-rose-500/40 flex items-center justify-center text-white shrink-0 border border-rose-400/40">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filter Tabs */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search debtors by name, phone or notes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['Active', 'All', 'Cleared'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterStatus === tab
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'Active' ? `Owing (${activeDebtors.length})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Debtors List */}
      <div className="space-y-2">
        {filteredDebtors.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              {debtors.length === 0 ? 'No credit records yet' : 'No debtors in this list'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xs mx-auto">
              {searchTerm || filterStatus !== 'All'
                ? 'No debtor records match your active filters.'
                : 'All accounts are clear! Record customers taking goods on credit or "chikwereti" to track balances and WhatsApp payment reminders.'}
            </p>
            {searchTerm || filterStatus !== 'All' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('All');
                }}
                className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Record First Credit / Debtor</span>
              </button>
            )}
          </div>
        ) : (
          filteredDebtors.map(debtor => {
            const isCleared = debtor.balanceOwed <= 0;
            const daysAgo = Math.floor(
              (Date.now() - new Date(debtor.date).getTime()) / (1000 * 3600 * 24)
            );
            const paybackStatus = getDebtorPaybackStatus(debtor);
            const waUrl = getDebtorWhatsAppUrl(debtor, business.name, currency);
            const reminderText = generateDebtorReminderText(debtor, business.name, currency);
            const isQuickCopied = quickCopiedId === debtor.id;

            return (
              <div
                key={debtor.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900">{debtor.customerName}</h4>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          isCleared
                            ? 'bg-emerald-100 text-emerald-800'
                            : debtor.status === 'Partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isCleared ? 'Cleared' : debtor.status === 'Partial' ? 'Part-Paid' : 'Unpaid'}
                      </span>
                    </div>

                    {debtor.phoneNumber && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {debtor.phoneNumber}
                      </p>
                    )}

                    {debtor.notes && (
                      <p className="text-xs text-slate-600 mt-1 italic">"{debtor.notes}"</p>
                    )}

                    <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
                      <p>Given: {new Date(debtor.date).toLocaleDateString()} ({daysAgo} days ago)</p>
                      {paybackStatus.hasDueDate && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold flex items-center gap-1 text-[10px] ${
                              paybackStatus.isDueToday
                                ? 'bg-rose-600 text-white animate-pulse'
                                : paybackStatus.isDueTomorrow
                                ? 'bg-amber-400 text-slate-950 font-extrabold'
                                : paybackStatus.isOverdue
                                ? 'bg-red-100 text-red-800 font-semibold'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {paybackStatus.statusBadgeText} ({paybackStatus.formattedDueDate})
                          </span>
                          {debtor.lastReminderSentAt && (
                            <span className="text-slate-400">
                              • Last WhatsApp: {new Date(debtor.lastReminderSentAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-500">Balance Owed</span>
                    <div
                      className={`text-base font-black ${
                        isCleared ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {currency}{debtor.balanceOwed.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Original: {currency}{debtor.originalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                {!isCleared && (
                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100 flex-wrap">
                    {/* Record Payment Button */}
                    <button
                      onClick={() => {
                        setActivePayingDebtor(debtor);
                        setPaymentAmount(debtor.balanceOwed.toString());
                      }}
                      className="py-1.5 px-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <ArrowDownCircle className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>

                    {/* WhatsApp Reminder Button */}
                    <button
                      onClick={() => setWhatsappDebtor(debtor)}
                      className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Reminder Modal</span>
                    </button>

                    {/* 1-Tap WhatsApp Button */}
                    {debtor.phoneNumber && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          if (onMarkReminderSent) onMarkReminderSent(debtor.id);
                        }}
                        className="py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer ml-auto"
                        title="Send 1-tap WhatsApp message via wa.me"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>1-Tap WhatsApp</span>
                      </a>
                    )}

                    {/* Quick Copy Message Button */}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(reminderText);
                        setQuickCopiedId(debtor.id);
                        setTimeout(() => setQuickCopiedId(null), 2000);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copy reminder text"
                    >
                      {isQuickCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* RECORD PAYMENT MODAL */}
      {activePayingDebtor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Record Debt Payment</h3>
                <p className="text-xs text-slate-500">{activePayingDebtor.customerName}</p>
              </div>
              <button
                onClick={() => setActivePayingDebtor(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3">
              <div className="bg-slate-50 p-2.5 rounded-lg text-xs flex justify-between">
                <span className="text-slate-500">Current Balance Owed:</span>
                <span className="font-bold text-rose-600">
                  {currency}{activePayingDebtor.balanceOwed.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full text-lg font-black p-2 bg-slate-50 border border-slate-200 rounded-lg text-center"
                />
                <div className="flex items-center gap-1.5 mt-2 justify-center">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(activePayingDebtor.balanceOwed.toString())}
                    className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold"
                  >
                    Full Payment ({currency}{activePayingDebtor.balanceOwed.toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentAmount(Math.max(1, Math.round(activePayingDebtor.balanceOwed / 2)).toString())
                    }
                    className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold"
                  >
                    Half (50%)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                  {['Cash USD', 'EcoCash', 'ZiG Cash', 'ZAR (SA Rands)'].map(pm => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPayMethod(pm)}
                      className={`p-1.5 rounded-lg border text-center font-medium ${
                        payMethod === pm
                          ? 'bg-emerald-700 text-white font-bold border-emerald-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid in cash at market"
                  value={paymentNote}
                  onChange={e => setPaymentNote(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="bg-emerald-50 p-2 rounded-lg text-xs text-emerald-900">
                New remaining balance:{' '}
                <strong>
                  {currency}
                  {Math.max(
                    0,
                    activePayingDebtor.balanceOwed - (parseFloat(paymentAmount) || 0)
                  ).toFixed(2)}
                </strong>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md"
              >
                Confirm Payment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* WHATSAPP REMINDER POPUP */}
      {whatsappDebtor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">WhatsApp Reminder</h3>
              </div>
              <button
                onClick={() => setWhatsappDebtor(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-slate-600">Language:</span>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  language === 'en' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('sn')}
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  language === 'sn' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                ChiShona
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-mono leading-relaxed mb-3">
              {getWhatsAppMessage(whatsappDebtor)}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleCopyMessage(getWhatsAppMessage(whatsappDebtor))}
                className="w-full py-2 rounded-xl bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
              </button>

              {whatsappDebtor.phoneNumber && (
                <a
                  href={getDebtorWhatsAppUrl(whatsappDebtor, business.name, currency, language)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    if (onMarkReminderSent) onMarkReminderSent(whatsappDebtor.id);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Open Directly in WhatsApp (wa.me)</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD DEBTOR / CREDIT MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Add Person Who Owes</h3>
                <p className="text-[11px] text-slate-500">Record credit taken by a customer with mandatory follow-up details</p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDebtor} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Baba Tinashe, Mai Panashe"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+263 77 123 4567"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount Owed ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amountOwed}
                    onChange={e => setAmountOwed(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-bold text-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Date of Payback (Due Date) *</span>
                  <span className="text-[10px] text-rose-600 font-bold uppercase">Required</span>
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-semibold text-rose-950"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  The system will automatically schedule a 24-hr reminder at 08:00 AM before this payback date.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  What Did They Take? (Notes)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2x Sugar + 1x Mazoe"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
                >
                  Save Debtor Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
