import React, { useState, useRef } from 'react';
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  AlertCircle,
  Edit2,
  Trash2,
  History,
  X,
  Zap,
  Clock,
  Briefcase,
  CheckCircle,
  Tag,
  Camera,
  UploadCloud,
  Image as ImageIcon,
  Eye,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { SmartBizState, Product, InventoryMovement, InventoryItemType, FREE_PLAN_INVENTORY_LIMIT } from '../../types';
import { compressImageFile, formatBytes } from '../../utils/imageCompression';

interface InventoryModuleProps {
  state: SmartBizState;
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onRestockProduct: (productId: string, quantityToAdd: number, reason: string) => void;
  isQuickAddOpen: boolean;
  onCloseQuickAdd: () => void;
  onOpenQuickAdd: () => void;
  onOpenPaywall?: (reason?: 'sales_limit' | 'inventory_limit' | 'expiry' | 'general') => void;
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
  onOpenPaywall,
}) => {
  const products = state.products || [];
  const movements = state.movements || [];
  const settings = state.settings || { currencySymbol: '$' };
  const currency = settings.currencySymbol || '$';

  const isFreePlan = !settings.isPremium;
  const isInventoryLimitReached = isFreePlan && products.length >= FREE_PLAN_INVENTORY_LIMIT;
  const freeItemsRemaining = Math.max(0, FREE_PLAN_INVENTORY_LIMIT - products.length);

  const handleAddClick = () => {
    if (isInventoryLimitReached) {
      if (onOpenPaywall) onOpenPaywall('inventory_limit');
      return;
    }
    resetForm();
    onOpenQuickAdd();
  };

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

  // Image Upload, Compression & Instant Preview States for Add Item
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageCompressing, setImageCompressing] = useState<boolean>(false);
  const [imageStats, setImageStats] = useState<{ original: string; compressed: string } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image Upload & Compression States for Edit Item
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [editImageCompressing, setEditImageCompressing] = useState<boolean>(false);
  const [editImageStats, setEditImageStats] = useState<{ original: string; compressed: string } | null>(null);

  // Fullsize image modal preview state
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

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

  // Image File Compression Handler
  const handleImageFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError('Please choose a valid image (JPG, PNG, WebP)');
      return;
    }
    setImageError(null);
    setImageCompressing(true);
    try {
      const result = await compressImageFile(file, 600, 0.75);
      setImageUrl(result.dataUrl);
      setImageStats({
        original: formatBytes(result.originalSize),
        compressed: formatBytes(result.compressedSize),
      });
    } catch (err: any) {
      setImageError(err.message || 'Failed to compress image');
    } finally {
      setImageCompressing(false);
    }
  };

  // Edit Modal Image Compression Handler
  const handleEditImageFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setEditImageCompressing(true);
    try {
      const result = await compressImageFile(file, 600, 0.75);
      if (editingProduct) {
        setEditingProduct({ ...editingProduct, imageUrl: result.dataUrl });
        setEditImageStats({
          original: formatBytes(result.originalSize),
          compressed: formatBytes(result.compressedSize),
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditImageCompressing(false);
    }
  };

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
    setImageUrl('');
    setImageStats(null);
    setImageError(null);
    setImageCompressing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit new product or service
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (isInventoryLimitReached) {
      if (onOpenPaywall) onOpenPaywall('inventory_limit');
      return;
    }

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
        imageUrl: imageUrl || undefined,
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
        imageUrl: imageUrl || undefined,
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
          <p className="text-xs text-slate-500">Track physical goods, services, photos & stock</p>
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
            onClick={handleAddClick}
            className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Item / Service</span>
          </button>
        </div>
      </div>

      {/* Free Plan Inventory Limit Notice / Quota Pill */}
      {isFreePlan && (
        <div
          className={`p-3 rounded-xl border transition-all ${
            isInventoryLimitReached
              ? 'bg-amber-500/10 border-amber-300 text-amber-950 shadow-xs'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 min-w-0">
              {isInventoryLimitReached ? (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
              ) : (
                <Package className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <div className="text-xs">
                <span className="font-bold mr-1">
                  {isInventoryLimitReached
                    ? 'Free Plan 25 Products Limit Reached!'
                    : `Free Plan: ${products.length} / ${FREE_PLAN_INVENTORY_LIMIT} Product Types Used`}
                </span>
                <span className="text-[11px] opacity-85 block sm:inline">
                  {isInventoryLimitReached
                    ? 'You have reached the 25 product types limit on the Free Plan. Upgrade to Pro for $2 to add unlimited stock items and services.'
                    : `(${freeItemsRemaining} product type${freeItemsRemaining === 1 ? '' : 's'} remaining before Pro upgrade)`}
                </span>
              </div>
            </div>
            {onOpenPaywall && (
              <button
                onClick={() => onOpenPaywall('inventory_limit')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg shadow-2xs shrink-0 cursor-pointer transition-transform active:scale-95 ${
                  isInventoryLimitReached
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-white border border-slate-300 hover:bg-slate-100 text-slate-800'
                }`}
              >
                {isInventoryLimitReached ? 'Upgrade Pro ($2)' : 'Upgrade to Pro'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Valuation & Inventory Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium block">Catalog Total</span>
          <span className="text-base sm:text-lg font-black text-slate-900 mt-0.5 block">
            {products.length}{' '}
            <span className="text-xs font-normal text-slate-500">
              ({physicalProducts.length} goods, {serviceOfferings.length} services)
            </span>
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium block">Stock Cost Value</span>
          <span className="text-base sm:text-lg font-black text-slate-900 mt-0.5 block">
            {currency}{totalCostValuation.toFixed(2)}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium block">Retail Valuation</span>
          <span className="text-base sm:text-lg font-black text-emerald-700 mt-0.5 block">
            {currency}{totalRetailValuation.toFixed(2)}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium block">Potential Profit</span>
          <span className="text-base sm:text-lg font-black text-indigo-700 mt-0.5 block">
            +{currency}{potentialProfit.toFixed(2)}
          </span>
        </div>
      </div>

      {/* FILTER TABS: All vs Physical Goods vs Services */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(['All', 'Product', 'Service'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTypeFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedTypeFilter === tab
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'All'
                ? `All Items (${products.length})`
                : tab === 'Product'
                ? `Physical Stock (${physicalProducts.length})`
                : `Services (${serviceOfferings.length})`}
            </button>
          ))}
        </div>

        {/* Low stock alert badge button */}
        {lowStockCount > 0 && (
          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              onlyLowStock
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{lowStockCount} Low Stock</span>
          </button>
        )}
      </div>

      {/* SEARCH AND CATEGORY FILTERS */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items, services, categories, suppliers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          {existingCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCT LIST */}
      <div className="space-y-2">
        {filteredProducts.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
            <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">No items found</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {searchTerm
                ? 'Try clearing your search term or filters.'
                : 'Click "+ Add Item / Service" to build your inventory & services catalog.'}
            </p>
            {searchTerm ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setOnlyLowStock(false);
                }}
                className="mt-3 text-xs text-emerald-700 font-bold hover:underline"
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
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
              >
                {/* Instant Product / Service Photo Thumbnail or Clean Fallback */}
                {product.imageUrl ? (
                  <div
                    onClick={() =>
                      setPreviewImage({
                        url: product.imageUrl!,
                        title: product.name,
                        subtitle: `${currency}${product.sellingPrice.toFixed(2)} • ${
                          isService
                            ? product.servicePeriod || 'Service'
                            : `${product.quantity} ${product.unit}s in stock`
                        }`,
                      })
                    }
                    className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0 cursor-pointer group shadow-2xs"
                    title="Tap to view full photo"
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-slate-950/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  </div>
                ) : (
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isService
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}
                  >
                    {isService ? <Zap className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                  </div>
                )}

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
                          className="mt-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 cursor-pointer"
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
                      className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
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
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
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

      {/* ADD NEW PRODUCT / SERVICE MODAL WITH IMAGE UPLOAD & PREVIEW */}
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
                    ? 'Add a service offering with photos, pricing and billing terms'
                    : 'Add countable stock with photo, pricing and stock alerts'}
                </p>
              </div>
              <button
                onClick={onCloseQuickAdd}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ITEM TYPE TOGGLE: Product vs Service */}
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
                <Package className="w-4 h-4 text-emerald-600" />
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
                    ? 'bg-white text-indigo-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-4 h-4 text-indigo-600" />
                <span>Service Offering</span>
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              {/* Product / Service Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {itemType === 'service' ? 'Service Name *' : 'Product Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    itemType === 'service'
                      ? 'e.g. Website Design, Haircut, Phone Repair...'
                      : 'e.g. Mazoe 2L, Bread, Sugar 2kg...'
                  }
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              {/* PRODUCT / SERVICE IMAGE UPLOAD WITH COMPRESSION & INSTANT PREVIEW */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    {itemType === 'service' ? 'Service Image / Banner' : 'Product Photo'}
                    <span className="text-[10px] text-slate-400 font-normal ml-1">(compressed offline)</span>
                  </label>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setImageStats(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-[10px] text-rose-600 hover:text-rose-700 font-medium flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Remove Photo
                    </button>
                  )}
                </div>

                {/* Hidden Native File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFileChange(file);
                  }}
                  className="hidden"
                />

                {imageUrl ? (
                  /* INSTANT COMPRESSED IMAGE PREVIEW CARD */
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-2.5 space-y-2">
                    <div className="flex items-center gap-3">
                      {/* Compressed Thumbnail */}
                      <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs">
                        <img
                          src={imageUrl}
                          alt="Product Preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImage({
                              url: imageUrl,
                              title: name || 'Product Preview',
                              subtitle: sellingPrice ? `${currency}${parseFloat(sellingPrice).toFixed(2)}` : undefined,
                            })
                          }
                          className="absolute inset-0 bg-black/20 hover:bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                          title="View Full Size"
                        >
                          <Eye className="w-5 h-5 text-white drop-shadow" />
                        </button>
                      </div>

                      {/* Compression Stats & Action Buttons */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Compressed & Ready</span>
                        </div>

                        {imageStats && (
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Reduced from <span className="line-through text-slate-400">{imageStats.original}</span> to{' '}
                            <strong className="text-emerald-700 font-bold">{imageStats.compressed}</strong>
                          </p>
                        )}

                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-50 shadow-2xs flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3 h-3 text-slate-500" />
                            <span>Change</span>
                          </button>
                          <span className="text-[10px] text-slate-400">
                            Instant catalog preview
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Live Catalog Badge Mockup Preview */}
                    <div className="bg-white p-2 rounded-lg border border-emerald-200/80 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Live Preview on Item Card:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                          {name || 'Item Name'}
                        </span>
                        {sellingPrice && (
                          <span className="text-xs font-black text-emerald-700">
                            {currency}{parseFloat(sellingPrice || '0').toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* UPLOAD DROPZONE / SELECTOR */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleImageFileChange(file);
                    }}
                    className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors ${
                      isDragOver
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50/60'
                    }`}
                  >
                    {imageCompressing ? (
                      <div className="py-2 flex flex-col items-center justify-center gap-1 text-emerald-700 text-xs font-semibold">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Compressing image offline...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2.5 py-1">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold text-slate-700">
                            Upload or capture {itemType === 'service' ? 'service' : 'product'} photo
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Auto-compressed to &lt;50KB • Instant previews in catalog
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {imageError && (
                  <p className="text-[11px] text-rose-600 font-medium">{imageError}</p>
                )}
              </div>

              {/* Service timeframe condition IF service */}
              {itemType === 'service' ? (
                <div className="space-y-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                  <label className="block text-xs font-bold text-indigo-900">
                    Billing Term / Condition Timeframe *
                  </label>

                  {/* Preset Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    {SERVICE_PERIOD_PRESETS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setServicePeriod(preset)}
                        className={`py-1.5 px-2 rounded-lg border text-center font-medium transition-all ${
                          servicePeriod === preset
                            ? 'bg-indigo-700 border-indigo-700 text-white font-bold shadow-xs'
                            : 'bg-white border-indigo-200 text-indigo-900 hover:bg-indigo-50'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setServicePeriod('custom')}
                      className={`py-1.5 px-2 rounded-lg border text-center font-medium transition-all ${
                        servicePeriod === 'custom'
                          ? 'bg-indigo-700 border-indigo-700 text-white font-bold shadow-xs'
                          : 'bg-white border-indigo-200 text-indigo-900 hover:bg-indigo-50'
                      }`}
                    >
                      Other / Custom
                    </button>
                  </div>

                  {servicePeriod === 'custom' && (
                    <input
                      type="text"
                      placeholder="e.g. per consultation, per stage, 3-month cycle..."
                      value={customServicePeriod}
                      onChange={e => setCustomServicePeriod(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-500 font-medium mt-1"
                    />
                  )}

                  <p className="text-[10px] text-indigo-700 leading-tight mt-1">
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
                  className={`w-full py-2.5 rounded-xl text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer ${
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
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity to Add ({restockProduct.unit}s)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockAmount}
                  onChange={e => setRestockAmount(parseInt(e.target.value) || 0)}
                  className="w-full text-base font-black p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 text-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Reason</label>
                <input
                  type="text"
                  value={restockReason}
                  onChange={e => setRestockReason(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="bg-emerald-50 p-2.5 rounded-lg text-xs text-emerald-900 space-y-1">
                <div className="flex justify-between">
                  <span>Current stock:</span>
                  <span className="font-bold">{restockProduct.quantity} {restockProduct.unit}s</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>New stock after restock:</span>
                  <span>{restockProduct.quantity + restockAmount} {restockProduct.unit}s</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Confirm Restock
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STOCK MOVEMENT HISTORY MODAL */}
      {showMovements && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-slate-800 text-sm">Stock Logs & Audit Trail</h3>
              </div>
              <button
                onClick={() => setShowMovements(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 text-xs">
              {movements.length === 0 ? (
                <p className="text-center py-8 text-slate-400">No stock movements recorded yet.</p>
              ) : (
                movements.map(m => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-800">{m.productName}</div>
                      <div className="text-[11px] text-slate-500">
                        {m.reason} • {new Date(m.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-black ${
                          m.quantityDelta > 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Balance: {m.newQuantity}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT / SERVICE MODAL WITH IMAGE MANAGEMENT */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                Edit {editingProduct.itemType === 'service' ? 'Service' : 'Product'}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
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

              {/* Photo Management in Edit Modal */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    {editingProduct.itemType === 'service' ? 'Service Photo' : 'Product Photo'}
                  </label>
                  {editingProduct.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, imageUrl: undefined })}
                      className="text-[10px] text-rose-600 hover:text-rose-700 font-medium flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Remove Photo
                    </button>
                  )}
                </div>

                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleEditImageFileChange(file);
                  }}
                  className="hidden"
                />

                {editingProduct.imageUrl ? (
                  <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0 shadow-2xs">
                      <img
                        src={editingProduct.imageUrl}
                        alt={editingProduct.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-slate-600" />
                        <span>Change Photo</span>
                      </button>
                      {editImageCompressing && (
                        <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                          Compressing...
                        </p>
                      )}
                      {editImageStats && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Compressed to {editImageStats.compressed}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => editFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-2.5 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    {editImageCompressing ? (
                      <p className="text-xs text-emerald-700 font-medium">Compressing photo...</p>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                        <Camera className="w-4 h-4 text-slate-400" />
                        <span>Tap to upload or take a photo</span>
                      </div>
                    )}
                  </div>
                )}
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
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Update Item
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN ZOOM IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-200"
          >
            <div className="relative aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-white flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">{previewImage.title}</h4>
                {previewImage.subtitle && (
                  <p className="text-[11px] text-emerald-700 font-bold">{previewImage.subtitle}</p>
                )}
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
