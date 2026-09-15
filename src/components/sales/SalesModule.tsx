import React, { useState } from 'react';
import {
  Plus,
  Search,
  Receipt,
  Trash2,
  Printer,
  Download,
  CheckCircle,
  X,
  AlertCircle,
  User,
  ShoppingBag,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  Tag,
  Phone,
  Package,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SmartBizState, Product, Sale, SaleItem, PaymentMethod, FREE_PLAN_SALES_LIMIT } from '../../types';

interface SalesModuleProps {
  state: SmartBizState;
  onAddSale: (sale: Omit<Sale, 'id'>) => void;
  onDeleteSale: (saleId: string, restoreStock: boolean) => void;
  isQuickAddOpen: boolean;
  onCloseQuickAdd: () => void;
  onOpenQuickAdd: () => void;
  onOpenAddProduct?: () => void;
  onOpenPaywall?: (reason?: 'sales_limit' | 'inventory_limit' | 'expiry' | 'general') => void;
}

export const SalesModule: React.FC<SalesModuleProps> = ({
  state,
  onAddSale,
  onDeleteSale,
  isQuickAddOpen,
  onCloseQuickAdd,
  onOpenQuickAdd,
  onOpenAddProduct,
  onOpenPaywall,
}) => {
  const products = state.products || [];
  const sales = state.sales || [];
  const customers = state.customers || [];
  const settings = state.settings || { currencySymbol: '$' };
  const business = state.business || { name: 'SmartBiz Merchant' };
  const currency = settings.currencySymbol || '$';

  const isFreePlan = !settings.isPremium;
  const isSalesLimitReached = isFreePlan && sales.length >= FREE_PLAN_SALES_LIMIT;
  const freeSalesRemaining = Math.max(0, FREE_PLAN_SALES_LIMIT - sales.length);

  const handleRecordClick = () => {
    if (isSalesLimitReached) {
      if (onOpenPaywall) onOpenPaywall('sales_limit');
      return;
    }
    onOpenQuickAdd();
  };

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string>('All');

  // Selected sale for receipt view
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // New Multi-Item Sale Form State
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [customItemPrice, setCustomItemPrice] = useState<string>('');
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);

  // Customer and Sale Meta
  const [customerId, setCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash USD');
  const [notes, setNotes] = useState<string>('');

  // Helper for currently selected product in dropdown
  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Calculate price and totals for item currently in picker
  const effectivePickerPrice =
    customItemPrice !== ''
      ? parseFloat(customItemPrice) || 0
      : selectedProduct?.sellingPrice || 0;
  const effectivePickerCost = selectedProduct?.costPrice || 0;
  const pickerItemTotal = effectivePickerPrice * itemQuantity;
  const pickerItemProfit = (effectivePickerPrice - effectivePickerCost) * itemQuantity;

  // Multi-item cart totals
  const cartTotalAmount = cartItems.reduce((sum, item) => sum + item.totalSale, 0);
  const cartTotalProfit = cartItems.reduce((sum, item) => sum + item.profit, 0);
  const cartTotalUnits = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Filtered sales list
  const filteredSales = sales.filter(s => {
    const matchesSearch =
      s.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.customerPhone && s.customerPhone.includes(searchTerm)) ||
      s.items.some(i => i.productName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPayment =
      selectedPaymentFilter === 'All' || s.paymentMethod === selectedPaymentFilter;

    return matchesSearch && matchesPayment;
  });

  // Direct WhatsApp Share Handler (User Request 3)
  const openWhatsAppReceipt = (sale: Sale) => {
    const appUrl = window.location.origin;
    const formattedDate = new Date(sale.date).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const formattedTime = new Date(sale.date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const totalUnitsCount = sale.items.reduce((sum, it) => sum + it.quantity, 0);

    const lines = [
      `🧾 *${business.name.toUpperCase()} - SALES RECEIPT*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `*Receipt #:* ${sale.receiptNumber}`,
      `*Date:* ${formattedDate} at ${formattedTime}`,
      `*Customer:* ${sale.customerName || 'Cash Walk-in'}`,
      `*Payment Method:* ${sale.paymentMethod}`,
      ``,
      `*ITEMS PURCHASED (${totalUnitsCount} ${totalUnitsCount === 1 ? 'item' : 'items'}):*`,
      ...sale.items.map(
        (it, idx) =>
          `${idx + 1}. *${it.productName}*${it.servicePeriod ? ` (${it.servicePeriod})` : ''}\n   ${it.quantity} x ${currency}${it.unitSellingPrice.toFixed(2)} = ${currency}${it.totalSale.toFixed(2)}`
      ),
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `*TOTAL AMOUNT:* ${currency}${sale.totalSale.toFixed(2)}`,
      ``,
      `Maita basa • Siyabonga • Thank you!`,
      ``,
      `_This sale was initiated in the SmartBiz Pocket App_`,
      `${appUrl}`,
    ];

    const fullMessage = lines.join('\n');
    const cleanPhone = (sale.customerPhone || '').replace(/[^0-9]/g, '');

    const whatsappUrl =
      cleanPhone.length >= 8
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullMessage)}`
        : `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;

    window.open(whatsappUrl, '_blank');
  };

  // Add item to multi-item cart
  const handleAddToCart = () => {
    if (!selectedProduct) {
      alert('Please choose a product to add to the sale.');
      return;
    }
    if (itemQuantity <= 0) {
      alert('Quantity must be greater than 0.');
      return;
    }

    // Check if product is already in cart
    const existingIndex = cartItems.findIndex(i => i.productId === selectedProduct.id);

    if (existingIndex >= 0) {
      // Update quantity on existing item
      const updated = [...cartItems];
      const existing = updated[existingIndex];
      const newQty = existing.quantity + itemQuantity;
      const newTotal = newQty * existing.unitSellingPrice;
      const newProfit = (existing.unitSellingPrice - existing.unitCostPrice) * newQty;

      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        totalSale: newTotal,
        profit: newProfit,
      };
      setCartItems(updated);
    } else {
      // Add new item to cart
      const newItem: SaleItem = {
        id: 'item-' + Date.now() + Math.random().toString(36).substr(2, 4),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        itemType: selectedProduct.itemType || 'product',
        servicePeriod: selectedProduct.servicePeriod,
        quantity: itemQuantity,
        unitCostPrice: effectivePickerCost,
        unitSellingPrice: effectivePickerPrice,
        totalSale: pickerItemTotal,
        profit: pickerItemProfit,
        imageUrl: selectedProduct.imageUrl,
      };
      setCartItems(prev => [...prev, newItem]);
    }

    // Reset item selector
    setItemQuantity(1);
    setCustomItemPrice('');
  };

  // Adjust item quantity inside cart
  const handleUpdateCartItemQty = (index: number, delta: number) => {
    setCartItems(prev => {
      const updated = [...prev];
      const current = updated[index];
      const newQty = current.quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index] = {
        ...current,
        quantity: newQty,
        totalSale: newQty * current.unitSellingPrice,
        profit: (current.unitSellingPrice - current.unitCostPrice) * newQty,
      };
      return updated;
    });
  };

  // Remove single item from cart
  const handleRemoveCartItem = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  // Finalize Multi-Item Sale
  const handleCompleteSale = () => {
    if (isSalesLimitReached) {
      if (onOpenPaywall) onOpenPaywall('sales_limit');
      return;
    }

    let finalItems = [...cartItems];

    // If user has not explicitly pressed "+ Add Item" but has an item in picker, include it
    if (finalItems.length === 0) {
      if (!selectedProduct) {
        alert('Please select at least one product for this sale.');
        return;
      }
      finalItems.push({
        id: 'item-' + Date.now(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        itemType: selectedProduct.itemType || 'product',
        servicePeriod: selectedProduct.servicePeriod,
        quantity: itemQuantity,
        unitCostPrice: effectivePickerCost,
        unitSellingPrice: effectivePickerPrice,
        totalSale: pickerItemTotal,
        profit: pickerItemProfit,
        imageUrl: selectedProduct.imageUrl,
      });
    }

    const totalSale = finalItems.reduce((sum, item) => sum + item.totalSale, 0);
    const totalCost = finalItems.reduce((sum, item) => sum + item.unitCostPrice * item.quantity, 0);
    const profit = totalSale - totalCost;

    const receiptNumber = 'RCP-' + Math.floor(1000 + Math.random() * 9000);

    const newSale: Omit<Sale, 'id'> = {
      date: new Date().toISOString(),
      items: finalItems,
      totalSale,
      totalCost,
      profit,
      customerId: customerId || undefined,
      customerName:
        customerName.trim() ||
        (customerId ? customers.find(c => c.id === customerId)?.name : undefined),
      customerPhone: customerPhone.trim() || undefined,
      paymentMethod,
      notes: notes.trim() || undefined,
      receiptNumber,
      isCreditSale: paymentMethod === 'On Credit',
    };

    onAddSale(newSale);

    // Confetti celebration
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#059669', '#10B981', '#34D399'],
    });

    // Reset Form
    setCartItems([]);
    setItemQuantity(1);
    setCustomItemPrice('');
    setNotes('');
    setCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setPaymentMethod('Cash USD');
    onCloseQuickAdd();
  };

  // Customer selection auto-fill
  const handleCustomerSelect = (cId: string) => {
    setCustomerId(cId);
    if (cId) {
      const cust = customers.find(c => c.id === cId);
      if (cust) {
        setCustomerName(cust.name);
        if (cust.phoneNumber) {
          setCustomerPhone(cust.phoneNumber);
        }
      }
    } else {
      setCustomerName('');
      setCustomerPhone('');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Receipt',
      'Date',
      'Items Count',
      'Itemized Products',
      'Total Sale',
      'Profit',
      'Customer',
      'Customer Phone',
      'Payment Method',
    ];
    const rows = sales.map(s => [
      s.receiptNumber,
      new Date(s.date).toLocaleDateString(),
      s.items.reduce((sum, i) => sum + i.quantity, 0),
      s.items.map(i => `${i.productName} (x${i.quantity} @ ${currency}${i.unitSellingPrice.toFixed(2)})`).join('; '),
      s.totalSale.toFixed(2),
      s.profit.toFixed(2),
      s.customerName || 'Walk-in',
      s.customerPhone || '',
      s.paymentMethod,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.map(cell => `"${cell}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartbiz_sales_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header & Record Sale Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">Sales Records</h2>
          <p className="text-xs text-slate-500">Itemized multi-product sales with instant WhatsApp receipts</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportCSV}
            title="Download CSV report"
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={handleRecordClick}
            className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Sale</span>
          </button>
        </div>
      </div>

      {/* Free Plan Sales Limit Notice / Quota Pill */}
      {isFreePlan && (
        <div
          className={`p-3 rounded-xl border transition-all ${
            isSalesLimitReached
              ? 'bg-amber-500/10 border-amber-300 text-amber-950 shadow-xs'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 min-w-0">
              {isSalesLimitReached ? (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
              ) : (
                <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <div className="text-xs">
                <span className="font-bold mr-1">
                  {isSalesLimitReached
                    ? 'Free Plan 50 Sales Limit Reached!'
                    : `Free Plan: ${sales.length} / ${FREE_PLAN_SALES_LIMIT} Sales Used`}
                </span>
                <span className="text-[11px] opacity-85 block sm:inline">
                  {isSalesLimitReached
                    ? 'You have reached 50 free transactions. Upgrade to Pro for $2 to continue selling without interruptions.'
                    : `(${freeSalesRemaining} free transaction${freeSalesRemaining === 1 ? '' : 's'} remaining before Pro upgrade)`}
                </span>
              </div>
            </div>
            {onOpenPaywall && (
              <button
                onClick={() => onOpenPaywall('sales_limit')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg shadow-2xs shrink-0 cursor-pointer transition-transform active:scale-95 ${
                  isSalesLimitReached
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-white border border-slate-300 hover:bg-slate-100 text-slate-800'
                }`}
              >
                {isSalesLimitReached ? 'Upgrade Pro ($2)' : 'Upgrade to Pro'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search & Payment Filter Bar */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search sales by product, customer, phone or receipt #..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Payment Method Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {['All', 'Cash USD', 'EcoCash', 'ZiG Cash', 'On Credit'].map(m => (
            <button
              key={m}
              onClick={() => setSelectedPaymentFilter(m)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition-colors ${
                selectedPaymentFilter === m
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Records List */}
      <div className="space-y-2">
        {filteredSales.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No sales recorded yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {searchTerm || selectedPaymentFilter !== 'All'
                ? 'No sales match your active filters.'
                : 'Record multi-item cash, EcoCash, or credit sales in seconds.'}
            </p>
            {searchTerm || selectedPaymentFilter !== 'All' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedPaymentFilter('All');
                }}
                className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenQuickAdd}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Record First Sale</span>
              </button>
            )}
          </div>
        ) : (
          filteredSales.map(sale => {
            const totalUnits = sale.items.reduce((sum, i) => sum + i.quantity, 0);

            return (
              <div
                key={sale.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2.5 hover:border-slate-300 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{sale.receiptNumber}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        sale.paymentMethod === 'Cash USD'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : sale.paymentMethod === 'EcoCash'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : sale.paymentMethod === 'On Credit'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {sale.paymentMethod}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                      {totalUnits} {totalUnits === 1 ? 'item' : 'items'}
                    </span>
                    {sale.customerName && (
                      <span className="text-[11px] text-slate-600 font-medium truncate flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {sale.customerName}
                      </span>
                    )}
                  </div>

                  {/* Itemized preview */}
                  <p className="text-xs text-slate-600 mt-1 truncate">
                    {sale.items
                      .map(i => `${i.productName} (x${i.quantity})`)
                      .join(', ')}
                  </p>

                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(sale.date).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    •{' '}
                    {new Date(sale.date).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-extrabold text-slate-900">
                    {currency}{sale.totalSale.toFixed(2)}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-700">
                    +{currency}{sale.profit.toFixed(2)} profit
                  </div>

                  {/* Actions: Direct WhatsApp, Receipt View, Delete */}
                  <div className="flex items-center gap-1 justify-end mt-1.5">
                    {/* DIRECT WHATSAPP BUTTON (User Request 3) */}
                    <button
                      onClick={() => openWhatsAppReceipt(sale)}
                      title="Share to WhatsApp directly"
                      className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 transition-colors flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[10px] font-bold hidden sm:inline">WhatsApp</span>
                    </button>

                    {/* VIEW DETAILED RECEIPT */}
                    <button
                      onClick={() => setReceiptSale(sale)}
                      title="View Detailed Sales Receipt"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                    </button>

                    {/* DELETE */}
                    <button
                      onClick={() => {
                        if (confirm('Delete this sale? Stock will be returned to inventory.')) {
                          onDeleteSale(sale.id, true);
                        }
                      }}
                      title="Delete Sale"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MULTI-ITEM SALE MODAL (User Request 1) */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Record Sale</h3>
                <p className="text-[11px] text-slate-500">
                  Itemized multi-product sale with instant receipt
                </p>
              </div>
              <button
                onClick={onCloseQuickAdd}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Customer Details */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Customer & Payment
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                      Customer
                    </label>
                    <select
                      value={customerId}
                      onChange={e => handleCustomerSelect(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-medium"
                    >
                      <option value="">Walk-in Customer</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phoneNumber ? `(${c.phoneNumber})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                      Or Customer Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Baba Tinashe"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      Phone (for WhatsApp receipt)
                    </label>
                    <input
                      type="tel"
                      placeholder="+263 77..."
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                      Reference / Note
                    </label>
                    <input
                      type="text"
                      placeholder="Optional ref #..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                {/* Payment Method Buttons */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Payment Method *
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 text-xs">
                    {(['Cash USD', 'EcoCash', 'ZiG Cash', 'On Credit'] as PaymentMethod[]).map(pm => (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => setPaymentMethod(pm)}
                        className={`py-1.5 px-2 rounded-lg border text-center font-medium transition-all text-xs ${
                          paymentMethod === pm
                            ? 'bg-emerald-700 border-emerald-700 text-white font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {pm}
                      </button>
                    ))}
                  </div>
                  {paymentMethod === 'On Credit' && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Will automatically record in "People Who Owe Me"
                    </p>
                  )}
                </div>
              </div>

              {/* CURRENT BASKET ITEMS TABLE (User Request 1) */}
              {cartItems.length > 0 && (
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
                      Items in Sale Basket ({cartItems.length})
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800">
                      {cartTotalUnits} units total
                    </span>
                  </div>

                  <div className="divide-y divide-emerald-100 bg-white rounded-lg border border-emerald-200/60 overflow-hidden">
                    {cartItems.map((item, idx) => (
                      <div key={item.id || idx} className="p-2.5 flex items-center justify-between gap-2.5 text-xs">
                        {/* Item Photo Thumbnail or Fallback Icon */}
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                            item.itemType === 'service'
                              ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            {item.itemType === 'service' ? (
                              <Zap className="w-4 h-4" />
                            ) : (
                              <Package className="w-4 h-4" />
                            )}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 truncate">
                            {item.productName}{' '}
                            {item.servicePeriod && (
                              <span className="text-[10px] text-indigo-600 font-medium">
                                ({item.servicePeriod})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {currency}{item.unitSellingPrice.toFixed(2)} each
                          </div>
                        </div>

                        {/* Quantity Stepper for Basket Item */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateCartItemQty(idx, -1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCartItemQty(idx, 1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {/* Line Total & Remove */}
                        <div className="text-right shrink-0">
                          <div className="font-bold text-slate-900">
                            {currency}{item.totalSale.toFixed(2)}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCartItem(idx)}
                            className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Running Basket Total */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="font-bold text-emerald-900">Basket Subtotal:</span>
                    <div className="text-right">
                      <span className="text-base font-black text-slate-900">
                        {currency}{cartTotalAmount.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-emerald-700 font-semibold block">
                        +{currency}{cartTotalProfit.toFixed(2)} profit
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ADD PRODUCT TO BASKET SECTION */}
              {/* Empty catalog notice or Add Product section */}
              {products.length === 0 ? (
                <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 text-center space-y-2">
                  <Package className="w-8 h-8 text-amber-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">Your product catalog is empty</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    You need to add products or services to your catalog before you can record sales.
                  </p>
                  {onOpenAddProduct && (
                    <button
                      type="button"
                      onClick={() => {
                        onCloseQuickAdd();
                        onOpenAddProduct();
                      }}
                      className="mt-1 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add First Product / Service</span>
                    </button>
                  )}
                </div>
              ) : (
                /* ADD PRODUCT TO BASKET SECTION */
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {cartItems.length === 0 ? 'Select Item or Service' : '+ Add Another Item to Sale'}
                  </span>

                  {/* Product Dropdown */}
                  <div className="space-y-2">
                    <select
                      value={selectedProductId}
                      onChange={e => {
                        setSelectedProductId(e.target.value);
                        setCustomItemPrice('');
                      }}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.itemType === 'service'
                            ? `⚡ [Service] ${p.name} — ${currency}${p.sellingPrice.toFixed(2)} (${p.servicePeriod || 'service'})`
                            : `📦 ${p.name} — ${currency}${p.sellingPrice.toFixed(2)} (In stock: ${p.quantity} ${p.unit}s)`}
                        </option>
                      ))}
                    </select>

                    {/* Selected Product Visual Preview Card */}
                    {selectedProduct && (
                      <div className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
                        {selectedProduct.imageUrl ? (
                          <img
                            src={selectedProduct.imageUrl}
                            alt={selectedProduct.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                              selectedProduct.itemType === 'service'
                                ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}
                          >
                            {selectedProduct.itemType === 'service' ? (
                              <Zap className="w-5 h-5" />
                            ) : (
                              <Package className="w-5 h-5" />
                            )}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {selectedProduct.name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-semibold text-emerald-700">
                              {currency}{selectedProduct.sellingPrice.toFixed(2)}
                            </span>
                            <span>•</span>
                            <span>
                              {selectedProduct.itemType === 'service'
                                ? selectedProduct.servicePeriod || 'per session'
                                : `${selectedProduct.quantity} ${selectedProduct.unit}s in stock`}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quantity & Unit Price */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        {selectedProduct?.itemType === 'service'
                          ? `Units / ${selectedProduct.servicePeriod || 'Periods'}`
                          : 'Quantity'}
                      </label>
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                        <button
                          type="button"
                          onClick={() => setItemQuantity(prev => Math.max(1, prev - 1))}
                          className="w-9 h-8 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 rounded-l-lg"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={itemQuantity}
                          onChange={e => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full text-center text-xs font-bold bg-transparent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setItemQuantity(prev => prev + 1)}
                          className="w-9 h-8 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 rounded-r-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        Unit Price ({currency})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder={`${selectedProduct?.sellingPrice.toFixed(2) || '0.00'}`}
                        value={customItemPrice}
                        onChange={e => setCustomItemPrice(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium h-8"
                      />
                    </div>
                  </div>

                  {/* Add to Sale Basket Button */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      Add to Sale Basket ({currency}{pickerItemTotal.toFixed(2)})
                    </span>
                  </button>
                </div>
              )}

              {/* Action Buttons: Final Complete */}
              {products.length > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCompleteSale}
                    className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      Complete Sale — {currency}
                      {(
                        cartTotalAmount +
                        (cartItems.length === 0 ? pickerItemTotal : 0)
                      ).toFixed(2)}{' '}
                      ({cartItems.length > 0 ? `${cartTotalUnits} items` : `${itemQuantity} item`})
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAILED SALES LOG / RECEIPT MODAL (User Request 3) */}
      {receiptSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Receipt Business Header */}
            <div className="flex justify-between items-start pb-3 border-b border-dashed border-slate-300">
              <div>
                <h3 className="font-black text-slate-900 text-base">{business.name}</h3>
                <p className="text-xs text-slate-500">{business.location}</p>
                {business.phone && <p className="text-xs text-slate-500">{business.phone}</p>}
              </div>
              <button
                onClick={() => setReceiptSale(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt No:</span>
                <span className="font-bold text-slate-800 font-mono">{receiptSale.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span className="text-slate-700">
                  {new Date(receiptSale.date).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  {new Date(receiptSale.date).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-slate-800">{receiptSale.paymentMethod}</span>
              </div>
              {receiptSale.customerName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold text-slate-800">{receiptSale.customerName}</span>
                </div>
              )}
              {receiptSale.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Phone:</span>
                  <span className="font-medium text-slate-700">{receiptSale.customerPhone}</span>
                </div>
              )}
            </div>

            {/* Itemized Products Breakdown */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                Purchased Items ({receiptSale.items.reduce((s, i) => s + i.quantity, 0)} units)
              </span>
              {receiptSale.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="pr-2">
                    <span className="text-slate-800 font-medium">
                      {it.quantity}x {it.productName}{it.servicePeriod ? ` (${it.servicePeriod})` : ''}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      @{currency}{it.unitSellingPrice.toFixed(2)} each
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">
                    {currency}{it.totalSale.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="py-3 border-b border-dashed border-slate-300 flex justify-between items-center">
              <span className="font-bold text-slate-800 text-sm">TOTAL AMOUNT</span>
              <span className="font-black text-slate-900 text-lg">
                {currency}{receiptSale.totalSale.toFixed(2)}
              </span>
            </div>

            {/* Owner Profit Indicator */}
            <div className="py-1.5 text-center bg-emerald-50 rounded-lg my-2">
              <span className="text-[11px] text-emerald-800 font-semibold">
                Your Profit: +{currency}{receiptSale.profit.toFixed(2)}
              </span>
            </div>

            {/* FOOTER WITH REQUIRED STATEMENT (User Request 3) */}
            <div className="text-center py-2 space-y-1">
              <p className="text-xs text-slate-600 font-medium">Maita basa • Siyabonga • Thank you!</p>
              <p className="text-[11px] italic text-slate-500">
                This sale was initiated in the SmartBiz Pocket App
              </p>
              <a
                href={window.location.origin}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-emerald-700 hover:text-emerald-800 underline font-mono block"
              >
                {window.location.origin}
              </a>
            </div>

            {/* Print, Copy & Direct WhatsApp Actions (User Request 3) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {/* Primary: Direct WhatsApp Share */}
              <button
                onClick={() => openWhatsAppReceipt(receiptSale)}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Share Directly to WhatsApp</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => window.print()}
                  className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print Receipt</span>
                </button>

                <button
                  onClick={() => {
                    const appUrl = window.location.origin;
                    const lines = [
                      `*${business.name.toUpperCase()} - SALES RECEIPT*`,
                      `Receipt: ${receiptSale.receiptNumber}`,
                      `Date: ${new Date(receiptSale.date).toLocaleDateString()}`,
                      `Items: ${receiptSale.items.map(i => `${i.quantity}x ${i.productName}${i.servicePeriod ? ` (${i.servicePeriod})` : ''}`).join(', ')}`,
                      `Total: ${currency}${receiptSale.totalSale.toFixed(2)}`,
                      `This sale was initiated in the SmartBiz Pocket App (${appUrl})`,
                    ];
                    navigator.clipboard.writeText(lines.join('\n'));
                    setCopiedReceipt(true);
                    setTimeout(() => setCopiedReceipt(false), 2000);
                  }}
                  className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedReceipt ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  <span>{copiedReceipt ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
