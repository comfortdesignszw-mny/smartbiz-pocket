/**
 * SmartBiz Pocket – Production-Ready MVP
 * Simple, ultra-fast, offline-first business management for informal traders & SMEs.
 */
import React, { useState, useEffect } from 'react';
import {
  loadSmartBizState,
  saveSmartBizState,
} from './db/storage';
import {
  SmartBizState,
  Sale,
  Expense,
  Product,
  Debtor,
  Customer,
  Business,
  AppSettings,
  BackupMetadata,
  InventoryMovement,
} from './types';
import { Header } from './components/common/Header';
import { Navigation, TabType } from './components/common/Navigation';
import { PinLockModal } from './components/common/PinLockModal';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { DashboardModule } from './components/dashboard/DashboardModule';
import { SalesModule } from './components/sales/SalesModule';
import { ExpensesModule } from './components/expenses/ExpensesModule';
import { InventoryModule } from './components/inventory/InventoryModule';
import { DebtorsModule } from './components/debtors/DebtorsModule';
import { CustomersModule } from './components/customers/CustomersModule';
import { ReportsModule } from './components/reports/ReportsModule';
import { InsightsModule } from './components/insights/InsightsModule';
import { BackupModule } from './components/backup/BackupModule';
import { SettingsModule } from './components/settings/SettingsModule';
import { FlutterHubModule } from './components/flutter/FlutterHubModule';
import { Footer } from './components/common/Footer';
import { LegalModal, LegalDocType } from './components/legal/LegalModal';
import { RevenueCatPaywallModal } from './components/common/RevenueCatPaywallModal';

export default function App() {
  const [state, setState] = useState<SmartBizState>(() => loadSmartBizState());
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);
  const [legalDocModal, setLegalDocModal] = useState<LegalDocType | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  // Quick action modal open states for fast 1-tap from dashboard
  const [salesQuickOpen, setSalesQuickOpen] = useState(false);
  const [expenseQuickOpen, setExpenseQuickOpen] = useState(false);
  const [stockQuickOpen, setStockQuickOpen] = useState(false);
  const [customerQuickOpen, setCustomerQuickOpen] = useState(false);

  // Save to local storage on any state change
  useEffect(() => {
    saveSmartBizState(state);
  }, [state]);

  // Unlock from PIN screen
  const handleUnlock = () => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, isLocked: false },
    }));
  };

  const handleLock = () => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, isLocked: true },
    }));
  };

  // --- ACTIONS ---

  // 1. Add Sale (Auto stock deduction + Auto credit record)
  const handleAddSale = (newSaleData: Omit<Sale, 'id'>) => {
    const saleId = 'sale-' + Date.now();
    const fullSale: Sale = { ...newSaleData, id: saleId };

    setState(prev => {
      // Deduct stock and record movements
      const updatedProducts = [...prev.products];
      const newMovements: InventoryMovement[] = [...prev.movements];

      fullSale.items.forEach(item => {
        const prodIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (prodIndex >= 0) {
          const prod = updatedProducts[prodIndex];
          // For services, quantity is not countable, do not decrement inventory or generate physical stock movements
          if (prod.itemType === 'service' || item.itemType === 'service') {
            return;
          }
          const newQty = Math.max(0, prod.quantity - item.quantity);
          updatedProducts[prodIndex] = { ...prod, quantity: newQty };

          newMovements.unshift({
            id: 'mov-' + Date.now() + Math.random().toString(36).substr(2, 4),
            productId: prod.id,
            productName: prod.name,
            type: 'sale',
            quantityDelta: -item.quantity,
            newQuantity: newQty,
            reason: `Sale ${fullSale.receiptNumber}`,
            date: new Date().toISOString(),
          });
        }
      });

      // If sale is on credit, auto-create debtor record
      let updatedDebtors = [...prev.debtors];
      if (fullSale.isCreditSale) {
        const debtorName = fullSale.customerName || 'Credit Customer';
        updatedDebtors.unshift({
          id: 'deb-' + Date.now(),
          customerId: fullSale.customerId,
          customerName: debtorName,
          phoneNumber: fullSale.customerPhone || '',
          originalAmount: fullSale.totalSale,
          balanceOwed: fullSale.totalSale,
          date: fullSale.date,
          notes: `Credit purchase: ${fullSale.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}`,
          status: 'Unpaid',
          relatedSaleId: saleId,
        });
      }

      return {
        ...prev,
        sales: [fullSale, ...prev.sales],
        products: updatedProducts,
        movements: newMovements,
        debtors: updatedDebtors,
      };
    });
  };

  const handleDeleteSale = (saleId: string, restoreStock: boolean) => {
    setState(prev => {
      const saleToDelete = prev.sales.find(s => s.id === saleId);
      let updatedProducts = [...prev.products];

      if (saleToDelete && restoreStock) {
        saleToDelete.items.forEach(item => {
          const idx = updatedProducts.findIndex(p => p.id === item.productId);
          if (idx >= 0 && updatedProducts[idx].itemType !== 'service' && item.itemType !== 'service') {
            updatedProducts[idx] = {
              ...updatedProducts[idx],
              quantity: updatedProducts[idx].quantity + item.quantity,
            };
          }
        });
      }

      return {
        ...prev,
        sales: prev.sales.filter(s => s.id !== saleId),
        products: updatedProducts,
        debtors: prev.debtors.filter(d => d.relatedSaleId !== saleId),
      };
    });
  };

  // 2. Expenses
  const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: 'exp-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses],
    }));
  };

  const handleDeleteExpense = (id: string) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id),
    }));
  };

  // 3. Products & Stock
  const handleAddProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: 'prod-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      products: [newProduct, ...prev.products],
    }));
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => (p.id === updatedProduct.id ? updatedProduct : p)),
    }));
  };

  const handleDeleteProduct = (productId: string) => {
    setState(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== productId),
    }));
  };

  const handleRestockProduct = (productId: string, quantityToAdd: number, reason: string) => {
    setState(prev => {
      const updatedProducts = prev.products.map(p => {
        if (p.id === productId) {
          const newQty = p.quantity + quantityToAdd;
          return { ...p, quantity: newQty, updatedAt: new Date().toISOString() };
        }
        return p;
      });

      const prod = prev.products.find(p => p.id === productId);
      const newMovements = [...prev.movements];
      if (prod) {
        newMovements.unshift({
          id: 'mov-' + Date.now(),
          productId: prod.id,
          productName: prod.name,
          type: 'restock',
          quantityDelta: quantityToAdd,
          newQuantity: prod.quantity + quantityToAdd,
          reason,
          date: new Date().toISOString(),
        });
      }

      return {
        ...prev,
        products: updatedProducts,
        movements: newMovements,
      };
    });
  };

  // 4. Debtors
  const handleAddDebtor = (debtorData: Omit<Debtor, 'id' | 'status'>) => {
    const newDebtor: Debtor = {
      ...debtorData,
      id: 'deb-' + Date.now(),
      status: 'Unpaid',
    };
    setState(prev => ({
      ...prev,
      debtors: [newDebtor, ...prev.debtors],
    }));
  };

  const handleRecordPayment = (
    debtorId: string,
    amount: number,
    paymentMethod: string,
    notes?: string
  ) => {
    setState(prev => {
      const debtor = prev.debtors.find(d => d.id === debtorId);
      if (!debtor) return prev;

      const previousBalance = debtor.balanceOwed;
      const newBalance = Math.max(0, previousBalance - amount);
      const newStatus = newBalance <= 0 ? 'Cleared' : 'Partial';

      const updatedDebtors = prev.debtors.map(d =>
        d.id === debtorId ? { ...d, balanceOwed: newBalance, status: newStatus as any } : d
      );

      const newPayment = {
        id: 'pay-' + Date.now(),
        debtorId,
        customerName: debtor.customerName,
        amount,
        date: new Date().toISOString(),
        notes,
        paymentMethod,
        previousBalance,
        remainingBalance: newBalance,
      };

      return {
        ...prev,
        debtors: updatedDebtors,
        payments: [newPayment, ...prev.payments],
      };
    });
  };

  const handleDeleteDebtor = (debtorId: string) => {
    setState(prev => ({
      ...prev,
      debtors: prev.debtors.filter(d => d.id !== debtorId),
    }));
  };

  // 5. Customers
  const handleAddCustomer = (
    custData: Omit<Customer, 'id' | 'createdAt' | 'totalPurchases' | 'outstandingDebt'>
  ) => {
    const newCustomer: Customer = {
      ...custData,
      id: 'cust-' + Date.now(),
      totalPurchases: 0,
      outstandingDebt: 0,
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      customers: [newCustomer, ...prev.customers],
    }));
  };

  const handleUpdateCustomer = (cust: Customer) => {
    setState(prev => ({
      ...prev,
      customers: prev.customers.map(c => (c.id === cust.id ? cust : c)),
    }));
  };

  const handleDeleteCustomer = (id: string) => {
    setState(prev => ({
      ...prev,
      customers: prev.customers.filter(c => c.id !== id),
    }));
  };

  // 6. Settings & Business
  const handleUpdateBusiness = (biz: Business) => {
    setState(prev => ({ ...prev, business: biz }));
  };

  const handleUpdateSettings = (sett: AppSettings) => {
    setState(prev => ({ ...prev, settings: sett }));
  };

  const handleTogglePremium = () => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, isPremium: !prev.settings.isPremium },
    }));
  };

  // 7. Backup & Restore
  const handleRestoreState = (newState: SmartBizState) => {
    setState(newState);
  };

  const handleAddBackupLog = (newLog: BackupMetadata) => {
    setState(prev => ({
      ...prev,
      backups: [newLog, ...prev.backups],
    }));
  };

  // Count alerts for badge (only physical products have countable stock)
  const lowStockCount = state.products.filter(p => p.itemType !== 'service' && p.quantity <= p.minStock).length;
  const activeDebtorCount = state.debtors.filter(d => d.balanceOwed > 0).length;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-start antialiased font-sans text-slate-800">
      {/* PIN Lock Security Screen if active */}
      {state.settings.pinLockEnabled && state.settings.isLocked && (
        <PinLockModal
          correctPin={state.settings.pinCode}
          onUnlock={handleUnlock}
          businessName={state.business.name}
        />
      )}

      {/* Frame Container */}
      <div
        className={`w-full transition-all duration-200 flex flex-col ${
          isPhoneFrame
            ? 'max-w-[420px] my-0 sm:my-3 min-h-[96vh] rounded-none sm:rounded-[36px] shadow-2xl border-0 sm:border-[8px] sm:border-slate-800 overflow-hidden bg-slate-100'
            : 'max-w-5xl my-0 min-h-screen bg-slate-100 shadow-xl'
        }`}
      >
        {/* PWA Native Install Prompt Banner */}
        <PWAInstallBanner />

        {/* Global App Header */}
        <Header
          business={state.business}
          settings={state.settings}
          onToggleLock={handleLock}
          isPhoneFrame={isPhoneFrame}
          onTogglePhoneFrame={() => setIsPhoneFrame(!isPhoneFrame)}
          onOpenSettings={() => setActiveTab('settings')}
          onTogglePremium={() => setIsPaywallOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-100">
          {activeTab === 'dashboard' && (
            <DashboardModule
              state={state}
              onNavigate={tab => setActiveTab(tab)}
              onQuickAddSale={() => {
                setActiveTab('sales');
                setSalesQuickOpen(true);
              }}
              onQuickAddExpense={() => {
                setActiveTab('expenses');
                setExpenseQuickOpen(true);
              }}
              onQuickAddProduct={() => {
                setActiveTab('stock');
                setStockQuickOpen(true);
              }}
              onQuickAddCustomer={() => {
                setActiveTab('customers');
                setCustomerQuickOpen(true);
              }}
            />
          )}

          {activeTab === 'sales' && (
            <SalesModule
              state={state}
              onAddSale={handleAddSale}
              onDeleteSale={handleDeleteSale}
              isQuickAddOpen={salesQuickOpen}
              onCloseQuickAdd={() => setSalesQuickOpen(false)}
              onOpenQuickAdd={() => setSalesQuickOpen(true)}
              onOpenAddProduct={() => {
                setActiveTab('stock');
                setStockQuickOpen(true);
              }}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesModule
              state={state}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              isQuickAddOpen={expenseQuickOpen}
              onCloseQuickAdd={() => setExpenseQuickOpen(false)}
              onOpenQuickAdd={() => setExpenseQuickOpen(true)}
            />
          )}

          {activeTab === 'stock' && (
            <InventoryModule
              state={state}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onRestockProduct={handleRestockProduct}
              isQuickAddOpen={stockQuickOpen}
              onCloseQuickAdd={() => setStockQuickOpen(false)}
              onOpenQuickAdd={() => setStockQuickOpen(true)}
            />
          )}

          {activeTab === 'debtors' && (
            <DebtorsModule
              state={state}
              onAddDebtor={handleAddDebtor}
              onRecordPayment={handleRecordPayment}
              onDeleteDebtor={handleDeleteDebtor}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersModule
              state={state}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              isQuickAddOpen={customerQuickOpen}
              onCloseQuickAdd={() => setCustomerQuickOpen(false)}
              onOpenQuickAdd={() => setCustomerQuickOpen(true)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsModule state={state} onNavigate={setActiveTab} />
          )}

          {activeTab === 'insights' && (
            <InsightsModule state={state} onNavigate={tab => setActiveTab(tab)} />
          )}

          {activeTab === 'backup' && (
            <BackupModule
              state={state}
              onRestoreState={handleRestoreState}
              onAddBackupLog={handleAddBackupLog}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsModule
              state={state}
              onUpdateBusiness={handleUpdateBusiness}
              onUpdateSettings={handleUpdateSettings}
              onTogglePremium={() => setIsPaywallOpen(true)}
              onOpenFlutterHub={() => setActiveTab('flutter')}
              onOpenLegal={doc => setLegalDocModal(doc)}
            />
          )}

          {activeTab === 'flutter' && <FlutterHubModule />}

          {/* Persistent Application Footer */}
          <Footer onOpenLegal={doc => setLegalDocModal(doc)} />
        </main>

        {/* Global Bottom Navigation */}
        <Navigation
          activeTab={activeTab}
          onSelectTab={tab => setActiveTab(tab)}
          debtorCount={activeDebtorCount}
          lowStockCount={lowStockCount}
          isMoreOpen={isMoreOpen}
          onToggleMore={setIsMoreOpen}
          isPremium={state.settings.isPremium}
          onOpenLegal={doc => setLegalDocModal(doc)}
        />

        {/* RevenueCat Paywall Modal ($2/mo Pro Plan) */}
        <RevenueCatPaywallModal
          isOpen={isPaywallOpen}
          onClose={() => setIsPaywallOpen(false)}
          isPremium={state.settings.isPremium}
          onTogglePremium={handleTogglePremium}
          onOpenLegal={doc => setLegalDocModal(doc)}
        />

        {/* Terms of Use & Privacy Policy Modal */}
        <LegalModal
          isOpen={legalDocModal !== null}
          initialDoc={legalDocModal || 'terms'}
          onClose={() => setLegalDocModal(null)}
        />
      </div>
    </div>
  );
}
