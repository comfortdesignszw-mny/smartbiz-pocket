import React, { useState } from 'react';
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  Edit2,
  Trash2,
  History,
  X,
  Zap,
  Clock,
  Briefcase,
  CheckCircle,
  Tag,
} from 'lucide-react';
import { SmartBizState, Product, InventoryMovement, InventoryItemType } from '../../types';

interface InventoryModuleProps {
  state: SmartBizState;
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onRestockProduct: (productId: string, quantityToAdd: number, reason: string) => void;
  isQuickAddOpen: boolean;
  onCloseQuickAdd: () => void;
  onOpenQuickAdd: () => void;
}

const SERVICE_PERIOD_PRESETS = [
  'per session',
  'per hour',
  'per day',
  'per week',
  'per month',
  'per year',
  'per stage',
  'per project',
  'flat fee',
];

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  state,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onRestockProduct,
  isQuickAddOpen,
  onCloseQuickAdd,
  onOpenQuickAdd,
}) => {
  const { products, movements, settings } = state;
  const currency = settings.currencySymbol;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'All' | 'Product' | 'Service'>('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [showMovements, setShowMovements] = useState(false);

  // Edit Product / Service Modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Quick Restock Modal state (physical products only)
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(5);
  const [restockReason, setRestockReason] = useState<string>('Restock from supplier');

  // New Item Form State (Product vs Service)
  const [itemType, setItemType] = useState<InventoryItemType>('product');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [supplier, setSupplier] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [unit, setUnit] = useState('item');
  const [servicePeriod, setServicePeriod] = useState('per project');
  const [customServicePeriod, setCustomServicePeriod] = useState('');

  // Physical inventory valuation (only physical products)
  const physicalProducts = products.filter(p => p.itemType !== 'service');
  const serviceOfferings = products.filter(p => p.itemType === 'service');

  const totalCostValuation = physicalProducts.reduce((sum, p) => sum + p.costPrice * p.quantity, 0);
  const totalRetailValuation = physicalProducts.reduce((sum, p) => sum + p.sellingPrice * p.quantity, 0);
  const potentialProfit = totalRetailValuation - totalCostValuation;

  // Categories present
  const existingCategories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  // Filtered list
  const filteredProducts = products.filter(p => {
    const isService = p.itemType === 'service';

    // Type filter
    if (selectedTypeFilter === 'Product' && isService) return false;
    if (selectedTypeFilter === 'Service' && !isService) return false;

    // Search filter
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.supplier && p.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.servicePeriod && p.servicePeriod.toLowerCase().includes(searchTerm.toLowerCase()));

    // Category filter
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;

    // Low stock filter (only applies to physical products)
    const matchesLowStock = !onlyLowStock || (!isService && p.quantity <= p.minStock);

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const lowStockCount = physicalProducts.filter(p => p.quantity <= p.minStock).length;

  // Reset new item form
  const resetForm = () => {
    setItemType('product');
    setName('');
    setCategory('Groceries');
    setCostPrice('');
    setSellingPrice('');
    setQuantity('');
    setSupplier('');
    setMinStock('5');
    setUnit('item');
    setServicePeriod('per project');
    setCustomServicePeriod('');
  };

  // Submit new product or service
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(costPrice) || 0;
    const sell = parseFloat(sellingPrice) || 0;

    if (!name.trim()) {
      alert('Name is required');
      return;
    }
    if (sell <= 0) {
      alert('Selling price / fee must be greater than zero');
      return;
    }

    if (itemType === 'service') {
      const finalPeriod =
        servicePeriod === 'custom'
          ? customServicePeriod.trim() || 'per stage'
          : servicePeriod;

      onAddProduct({
        name: name.trim(),
        itemType: 'service',
        category: category.trim() || 'Services',
        costPrice: cost,
        sellingPrice: sell,
        quantity: 0, // Quantity is not applicable for service offerings
        supplier: supplier.trim() || 'In-House Service',
        minStock: 0,
        unit: finalPeriod,
        servicePeriod: finalPeriod,
      });
    } else {
      const qty = parseFloat(quantity) || 0;
      const min = parseFloat(minStock) || 5;

      onAddProduct({
        name: name.trim(),
        itemType: 'product',
        category: category.trim() || 'General',
        costPrice: cost,
        sellingPrice: sell,
        quantity: qty,
        supplier: supplier.trim() || 'Local Supplier',
        minStock: min,
        unit: unit.trim() || 'item',
      });
    }

    resetForm();
    onCloseQuickAdd();
  };

  // Submit edit product/service
  const handleUpdateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    onUpdateProduct(editingProduct);
    setEditingProduct(null);
  };

  // Submit restock (physical products only)
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct || restockAmount <= 0) return;
    onRestockProduct(restockProduct.id, restockAmount, restockReason);
    setRestockProduct(null);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">Inventory & Catalog</h2>
          <p className="text-xs text-slate-500">Track physical goods and professional services</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowMovements(!showMovements)}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
              showMovements
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Stock Logs</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              onOpenQuickAdd();
            }}
            className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Item / Service</span>
          </button>
        </div>
      </div>

      {/* Catalog & Inventory Valuation Card */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Catalog Overview & Stock Valuation
          </span>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
            {physicalProducts.length} Products • {serviceOfferings.length} Services
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-2 pt-1 border-t border-slate-100">
          <div>
            <span className="text-[10px] text-slate-400">Stock Cost Value</span>
            <p className="text-xs sm:text-sm font-bold text-slate-800">
              {currency}{totalCostValuation.toFixed(2)}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Expected Stock Retail</span>
            <p className="text-xs sm:text-sm font-bold text-emerald-700">
              {currency}{totalRetailValuation.toFixed(2)}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Potential Stock Margin</span>
            <p className="text-xs sm:text-sm font-bold text-teal-700">
              +{currency}{potentialProfit.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search products, services, timeframe, category..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Tabs: All vs Products vs Services */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <div className="flex items-center gap-1.5">
            {(['All', 'Product', 'Service'] as const).map(t => (
              <button
                key={t}
                onClick={() => setSelectedTypeFilter(t)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition-colors ${
                  selectedTypeFilter === t
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t === 'All' ? 'All Catalog' : t === 'Product' ? '📦 Products Only' : '⚡ Services Only'}
              </button>
            ))}

            {/* Existing Categories */}
            {existingCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-800 text-white font-bold'
                    : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Low Stock Alert Filter for Products */}
          {lowStockCount > 0 && (
            <button
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-bold flex items-center gap-1 shrink-0 ${
                onlyLowStock
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock ({lowStockCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Stock Movements History Drawer */}
      {showMovements && (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-700" />
              Stock Movement Audit Trail
            </h3>
            <button
              onClick={() => setShowMovements(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {movements.length === 0 ? (
              <p className="text-xs text-slate-400">No stock movements recorded yet.</p>
            ) : (
              movements.slice(0, 10).map(m => (
                <div
                  key={m.id}
                  className="bg-white p-2 rounded-lg border border-slate-200 text-xs flex justify-between items-center"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{m.productName}</span>
                    <p className="text-[10px] text-slate-500">{m.reason || m.type}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-bold ${
                        m.quantityDelta > 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                    </span>
                    <p className="text-[9px] text-slate-400">Now: {m.newQuantity}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Catalog Items List (Products & Services) */}
      <div className="space-y-2">
        {filteredProducts.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
            <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              {searchTerm || selectedCategory !== 'All' ? 'No items match your search' : 'Your catalog is empty'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xs mx-auto">
              {searchTerm || selectedCategory !== 'All'
                ? 'Try adjusting your search terms or category filter.'
                : 'Add physical merchandise with stock tracking, or service offerings with flexible billing intervals.'}
            </p>
            {searchTerm || selectedCategory !== 'All' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
                className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Clear Search
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenQuickAdd}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Item or Service</span>
              </button>
            )}
          </div>
        ) : (
          filteredProducts.map(product => {
            const isService = product.itemType === 'service';
            const isLow = !isService && product.quantity <= product.minStock;
            const profitPerUnit = product.sellingPrice - product.costPrice;

            return (
              <div
                key={product.id}
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{product.name}</span>

                    {/* Badge: Product vs Service */}
                    {isService ? (
                      <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-indigo-500" />
                        Service • {product.servicePeriod || 'per session'}
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                        {product.category}
                      </span>
                    )}

                    {isLow && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold rounded flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                    <span>
                      Fee / Sell:{' '}
                      <strong className="text-slate-900">
                        {currency}{product.sellingPrice.toFixed(2)}
                      </strong>{' '}
                      {isService && (
                        <span className="text-[11px] text-slate-500 font-normal">
                          ({product.servicePeriod || 'per session'})
                        </span>
                      )}
                    </span>
                    <span>
                      Direct Cost: {currency}{product.costPrice.toFixed(2)}
                    </span>
                    <span className="text-emerald-700 font-medium">
                      +{currency}{profitPerUnit.toFixed(2)} margin
                    </span>
                  </div>

                  {product.supplier && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {isService ? 'Provider / Handler:' : 'Supplier:'} {product.supplier}
                    </p>
                  )}
                </div>

                {/* Stock Quantity (Product) OR Service Condition (Service) */}
                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    {isService ? (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          <CheckCircle className="w-3 h-3" />
                          Available
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Quantity N/A</p>
                      </div>
                    ) : (
                      <>
                        <div
                          className={`text-base font-black ${
                            isLow ? 'text-amber-600' : 'text-slate-900'
                          }`}
                        >
                          {product.quantity}{' '}
                          <span className="text-xs font-normal text-slate-500">{product.unit}s</span>
                        </div>
                        <button
                          onClick={() => {
                            setRestockProduct(product);
                            setRestockAmount(5);
                          }}
                          className="mt-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200"
                        >
                          + Restock
                        </button>
                      </>
                    )}
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setEditingProduct({ ...product })}
                      title={isService ? 'Edit Service' : 'Edit Product'}
                      className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${product.name}" from catalog?`)) {
                          onDeleteProduct(product.id);
                        }
                      }}
                      title="Delete Item"
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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

      {/* ADD NEW PRODUCT / SERVICE MODAL */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  {itemType === 'service' ? 'Add New Service' : 'Add New Product'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {itemType === 'service'
                    ? 'Add a service offering (website, repair, consulting...)'
                    : 'Add countable stock to inventory'}
                </p>
              </div>
              <button
                onClick={onCloseQuickAdd}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ITEM TYPE TOGGLE: Product vs Service (User Request 2) */}
            <div className="grid grid-cols-2 gap-2 mb-3 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setItemType('product');
                  if (category === 'Services') setCategory('Groceries');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  itemType === 'product'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                <span>Physical Product</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setItemType('service');
                  if (category === 'Groceries') setCategory('Services');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  itemType === 'service'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Service / Labor</span>
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {itemType === 'service' ? 'Service Title *' : 'Product Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    itemType === 'service'
                      ? 'e.g. Website Development, Phone Screen Repair...'
                      : 'e.g. Mazoe Orange Crush 2L, Sugar 2kg...'
                  }
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {/* SERVICE CONDITION / TIMEFRAME SELECTOR (User Request 2) */}
              {itemType === 'service' ? (
                <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-indigo-950 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      Condition / Billing Time Frame *
                    </label>
                    <span className="text-[10px] text-indigo-600 font-medium">
                      Quantity is not applicable
                    </span>
                  </div>

                  <select
                    value={servicePeriod}
                    onChange={e => setServicePeriod(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-indigo-200 rounded-lg focus:outline-none font-semibold text-slate-800"
                  >
                    {SERVICE_PERIOD_PRESETS.map(preset => (
                      <option key={preset} value={preset}>
                        {preset.charAt(0).toUpperCase() + preset.slice(1)} (e.g. $100 {preset})
                      </option>
                    ))}
                    <option value="custom">Custom Condition / Time Frame...</option>
                  </select>

                  {servicePeriod === 'custom' && (
                    <input
                      type="text"
                      placeholder="e.g. per milestone, per 3 months, per hectare..."
                      value={customServicePeriod}
                      onChange={e => setCustomServicePeriod(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-indigo-300 rounded-lg focus:outline-none font-medium"
                    />
                  )}

                  <p className="text-[11px] text-indigo-800 leading-tight">
                    💡 Services do not track physical count. Each sale records units based on this condition (e.g. 2 sessions or 1 project).
                  </p>
                </div>
              ) : (
                /* Physical Product Unit and Category */
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      placeholder="Groceries, Drinks..."
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Unit Type
                    </label>
                    <input
                      type="text"
                      placeholder="bottle, pack, box..."
                      value={unit}
                      onChange={e => setUnit(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Price fields */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {itemType === 'service' ? `Direct Cost (${currency})` : `Cost Price (${currency})`}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={itemType === 'service' ? '0.00 (optional)' : 'What you paid'}
                    value={costPrice}
                    onChange={e => setCostPrice(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {itemType === 'service'
                      ? `Fee (${currency}) *`
                      : `Selling Price (${currency}) *`}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Rate charged"
                    value={sellingPrice}
                    onChange={e => setSellingPrice(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              {/* Physical Product Quantity & Alert (Hidden for services) */}
              {itemType === 'product' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Initial Stock Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Low Stock Alert At
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="5"
                      value={minStock}
                      onChange={e => setMinStock(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Provider / Supplier */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {itemType === 'service' ? 'Service Handler / Department' : 'Supplier / Market Source'}
                </label>
                <input
                  type="text"
                  placeholder={
                    itemType === 'service'
                      ? 'e.g. In-House, Tariro Developer, Workshop...'
                      : 'e.g. Mbare Musika, National Foods...'
                  }
                  value={supplier}
                  onChange={e => setSupplier(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-xl text-white text-xs font-bold shadow-md active:scale-95 transition-all ${
                    itemType === 'service'
                      ? 'bg-indigo-700 hover:bg-indigo-800'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  {itemType === 'service' ? 'Save Service Offering' : 'Save Stock Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK RESTOCK MODAL (Physical Products Only) */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Quick Restock</h3>
                <p className="text-xs text-slate-500 truncate">{restockProduct.name}</p>
              </div>
              <button
                onClick={() => setRestockProduct(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Add Quantity ({restockProduct.unit}s)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockAmount}
                  onChange={e => setRestockAmount(parseInt(e.target.value) || 0)}
                  className="w-full text-lg font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center"
                />
                <div className="flex items-center gap-1.5 mt-2 justify-center">
                  {[5, 10, 25, 50].map(amt => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setRestockAmount(amt)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Restock Source / Reason
                </label>
                <input
                  type="text"
                  value={restockReason}
                  onChange={e => setRestockReason(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="bg-emerald-50 p-2.5 rounded-lg text-xs text-emerald-800">
                New stock level will be: <strong>{restockProduct.quantity + restockAmount}</strong> {restockProduct.unit}s
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md"
              >
                Confirm Restock
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT / SERVICE MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                Edit {editingProduct.itemType === 'service' ? 'Service' : 'Product'}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProductSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              {/* Service condition timeframe if service */}
              {editingProduct.itemType === 'service' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Condition / Time Frame
                  </label>
                  <input
                    type="text"
                    value={editingProduct.servicePeriod || ''}
                    placeholder="e.g. per session, per month, per stage"
                    onChange={e =>
                      setEditingProduct({ ...editingProduct, servicePeriod: e.target.value })
                    }
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.costPrice}
                    onChange={e => setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sell ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.sellingPrice}
                    onChange={e => setEditingProduct({ ...editingProduct, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              {editingProduct.itemType !== 'service' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={editingProduct.quantity}
                      onChange={e => setEditingProduct({ ...editingProduct, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Min Alert Stock</label>
                    <input
                      type="number"
                      value={editingProduct.minStock}
                      onChange={e => setEditingProduct({ ...editingProduct, minStock: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md"
              >
                Update Item
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
