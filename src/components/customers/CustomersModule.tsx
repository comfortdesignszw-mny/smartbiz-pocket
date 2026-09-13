import React, { useState } from 'react';
import {
  Plus,
  Search,
  User,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  X,
  MessageSquare,
  ShoppingBag,
} from 'lucide-react';
import { SmartBizState, Customer } from '../../types';

interface CustomersModuleProps {
  state: SmartBizState;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'totalPurchases' | 'outstandingDebt'>) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  isQuickAddOpen: boolean;
  onCloseQuickAdd: () => void;
  onOpenQuickAdd: () => void;
}

export const CustomersModule: React.FC<CustomersModuleProps> = ({
  state,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  isQuickAddOpen,
  onCloseQuickAdd,
  onOpenQuickAdd,
}) => {
  const { customers, debtors, sales, settings } = state;
  const currency = settings.currencySymbol;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New Customer Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Filter customers
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddCustomer({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      notes: notes.trim() || undefined,
    });

    setName('');
    setPhone('');
    setAddress('');
    setNotes('');
    onCloseQuickAdd();
  };

  // Find sales & debt for selected customer
  const customerSales = selectedCustomer
    ? sales.filter(s => s.customerId === selectedCustomer.id || s.customerName === selectedCustomer.name)
    : [];
  const customerDebtors = selectedCustomer
    ? debtors.filter(d => d.customerId === selectedCustomer.id || d.customerName === selectedCustomer.name)
    : [];

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">Customers Directory</h2>
          <p className="text-xs text-slate-500">Contact details, purchase loyalty & credit history</p>
        </div>
        <button
          onClick={onOpenQuickAdd}
          className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers by name, phone or address..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Customers List */}
      <div className="space-y-2">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
            <User className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No customers found</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Keep customer contacts and track who your best buyers are.
            </p>
          </div>
        ) : (
          filteredCustomers.map(customer => {
            // Check active debt
            const activeDebt = debtors
              .filter(d => (d.customerId === customer.id || d.customerName === customer.name) && d.balanceOwed > 0)
              .reduce((sum, d) => sum + d.balanceOwed, 0);

            return (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{customer.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {customer.phone || 'No phone'}
                    </p>
                    {customer.address && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {customer.address}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {activeDebt > 0 ? (
                    <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Owes {currency}{activeDebt.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Zero Debt
                    </span>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">Tap for profile</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CUSTOMER PROFILE DRAWER / MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-base">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-500">{selectedCustomer.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {selectedCustomer.address && (
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {selectedCustomer.address}
                </p>
              )}
              {selectedCustomer.notes && (
                <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  "{selectedCustomer.notes}"
                </p>
              )}

              {/* Action buttons */}
              {selectedCustomer.phone && (
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${selectedCustomer.phone}`}
                    className="py-2 px-3 rounded-lg border border-slate-300 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-50"
                  >
                    <Phone className="w-4 h-4 text-emerald-700" />
                    <span>Call Customer</span>
                  </a>
                  <a
                    href={`https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              )}

              {/* Purchase History */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
                  Purchase History ({customerSales.length})
                </h4>
                {customerSales.length === 0 ? (
                  <p className="text-xs text-slate-400">No recorded sales under this customer name.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {customerSales.map(s => (
                      <div key={s.id} className="text-xs bg-slate-50 p-2 rounded border border-slate-200 flex justify-between">
                        <div>
                          <span className="font-semibold">{s.receiptNumber}</span>
                          <p className="text-[10px] text-slate-400">{new Date(s.date).toLocaleDateString()}</p>
                        </div>
                        <span className="font-bold text-slate-900">{currency}{s.totalSale.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Add New Customer</h3>
                <p className="text-[11px] text-slate-500">Record customer details</p>
              </div>
              <button
                onClick={onCloseQuickAdd}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mai Panashe, Baba Tinashe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+263 77 123 4567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address / Stall Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Highfield Ward 3, Stand 42"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Regular morning bread buyer"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
