import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../components/ui/Toast.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Dialog } from '../components/ui/Dialog.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Search, Plus, Edit2, Trash2, FolderPlus, Package, Check, AlertCircle } from 'lucide-react';

export const Products = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCatFormOpen, setIsCatFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form states
  const [newCatName, setNewCatName] = useState('');

  const parseDiscountRange = (discountStr) => {
    if (!discountStr) return { min: 0, max: 0 };
    const numbers = String(discountStr).match(/\d+(\.\d+)?/g);
    if (!numbers || numbers.length === 0) return { min: 0, max: 0 };
    const parsed = numbers.map(Number);
    if (parsed.length === 1) {
      return { min: 0, max: parsed[0] };
    }
    return { min: parsed[0], max: parsed[1] };
  };

  const loadData = async () => {
    try {
      const [prods, cats, comps] = await Promise.all([
        api.products.getAll(search, selectedCatId, lowStockOnly),
        api.products.getCategories(),
        api.suppliers.getAll()
      ]);
      setProducts(prods);
      setCategories(cats);
      setSuppliers(comps);
    } catch (err) {
      toast.error('Failed to load catalog inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCatId, lowStockOnly]);

  const handleCreateOpen = () => {
    navigate('/products/new');
  };

  const handleEditOpen = (prod) => {
    navigate(`/products/${prod.id}/edit`);
  };

  const handleDeleteOpen = (prod) => {
    setSelectedProduct(prod);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.products.delete(selectedProduct.id);
      toast.success('Product removed successfully');
      setIsDeleteOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Deletion failed');
    }
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }

    try {
      await api.products.createCategory(newCatName.trim());
      toast.success('Category created successfully');
      setNewCatName('');
      setIsCatFormOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to create category');
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-in">
      
      {/* 1. Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative max-w-xs w-full">
            <span className="absolute left-3 top-3 text-slate-500"><Search className="h-4 w-4" /></span>
            <Input
              placeholder="Search product, SKU, brand..."
              className="pl-9 py-1.5"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <select
            className="bg-slate-950/20 border border-slate-900 text-xs font-semibold text-slate-400 rounded-lg px-3 py-2.5 outline-none cursor-pointer hover:border-slate-800"
            value={selectedCatId}
            onChange={(e) => setSelectedCatId(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Low Stock Switch */}
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 select-none cursor-pointer bg-slate-950/20 border border-slate-900 px-3 py-2 rounded-lg hover:border-slate-800">
            <input
              type="checkbox"
              className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 h-4 w-4"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
            />
            <span>Show Low Stock Alerts Only</span>
          </label>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2.5">
          <Button onClick={() => setIsCatFormOpen(true)} variant="secondary" className="py-2 inline-flex items-center gap-1.5">
            <FolderPlus className="h-4 w-4" />
            Add Category
          </Button>
          <Button onClick={handleCreateOpen} variant="primary" className="py-2 inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* 2. Product Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-slate-500 font-semibold animate-pulse">Loading stock records...</div>
          ) : products.length === 0 ? (
            <div className="p-10 text-center text-slate-500 font-semibold">No products in inventory catalog</div>
          ) : (
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product details</TableHead>
                    <TableHead>SKU Code</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Lot Size</TableHead>
                    <TableHead>Base Rates</TableHead>
                    <TableHead>Total Profit</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Oldest Lot (FEFO)</TableHead>
                    <TableHead>Latest Lot</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((prod) => {
                    const isLow = prod.currentStock <= prod.minStockAlert;
                    return (
                      <TableRow key={prod.id} className={isLow ? 'bg-amber-500/5 hover:bg-amber-500/10' : ''}>
                        <TableCell className="font-bold text-slate-200">
                          <div className="flex flex-col">
                            <span>{prod.name}</span>
                            <span className="text-[10px] text-slate-500 font-semibold uppercase">{prod.unitType} packing</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-indigo-400">{prod.sku}</TableCell>
                        <TableCell className="font-semibold text-slate-300">
                          <div className="flex flex-col">
                             <span>{prod.brand}</span>
                             {prod.supplier && (
                               <span className="text-[10px] text-slate-500 font-semibold truncate max-w-[150px]" title={prod.supplier.name}>
                                 {prod.supplier.name}
                               </span>
                             )}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">{prod.category?.name || 'N/A'}</TableCell>
                        <TableCell className="text-slate-400">{prod.lotSize} pcs</TableCell>
                        <TableCell className="text-slate-350 text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-400">Buy: ₹{prod.purchasePrice.toFixed(2)}</span>
                            <span className="font-bold text-slate-200">Sell: ₹{prod.sellingPrice.toFixed(2)}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              {prod.gstPercent > 0 ? (
                                <Badge variant="info" className="text-[8px] px-1 py-0 tracking-wider font-bold">
                                  GST: {prod.gstPercent}%
                                </Badge>
                              ) : (
                                <span className="text-[8px] text-slate-500 font-semibold uppercase">No GST</span>
                              )}
                              {prod.mrp > 0 && (
                                <span className="text-[9px] text-slate-500 font-medium">
                                  MRP: ₹{prod.mrp.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-emerald-400">
                          ₹{(prod.profit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm font-black ${isLow ? 'text-amber-400' : 'text-slate-200'}`}>
                              {prod.currentStock}
                            </span>
                            {isLow && (
                              <Badge variant="warning" className="text-[9px] px-1 py-0 border-amber-500/20">
                                Low Stock
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">
                          {(() => {
                            const oldest = prod.lots && prod.lots.length > 0 ? prod.lots[0] : null;
                            if (!oldest) return <span className="text-slate-600 font-normal">N/A</span>;
                            return (
                              <div className="flex flex-col gap-0.5 leading-normal">
                                <span className="font-bold text-amber-400">
                                  Exp: {oldest.expiryDate ? new Date(oldest.expiryDate).toLocaleDateString('en-IN') : 'No Expiry'}
                                </span>
                                <span className="text-[10px] text-slate-300 font-semibold">
                                  Stock: {oldest.remainingStock} pcs
                                </span>
                                <span className="text-[9px] text-slate-500 font-medium">
                                  Cost: ₹{oldest.costPrice.toFixed(2)}
                                </span>
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">
                          {(() => {
                            const latest = prod.lots && prod.lots.length > 0 ? prod.lots[prod.lots.length - 1] : null;
                            if (!latest) return <span className="text-slate-600 font-normal">N/A</span>;
                            return (
                              <div className="flex flex-col gap-0.5 leading-normal">
                                <span className="font-bold text-emerald-400">
                                  Exp: {latest.expiryDate ? new Date(latest.expiryDate).toLocaleDateString('en-IN') : 'No Expiry'}
                                </span>
                                <span className="text-[10px] text-slate-300 font-semibold">
                                  Stock: {latest.remainingStock} pcs
                                </span>
                                <span className="text-[9px] text-slate-500 font-medium">
                                  Cost: ₹{latest.costPrice.toFixed(2)}
                                </span>
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              onClick={() => handleEditOpen(prod)}
                              variant="ghost"
                              size="sm"
                            >
                              <Edit2 className="h-4 w-4 text-indigo-400" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteOpen(prod)}
                              variant="ghost"
                              size="sm"
                            >
                              <Trash2 className="h-4 w-4 text-rose-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>



      {/* 4. Category Add Modal */}
      <Dialog
        isOpen={isCatFormOpen}
        onClose={() => setIsCatFormOpen(false)}
        title="Add New Category Group"
        maxWidth="sm"
      >
        <form onSubmit={handleCatSubmit} className="flex flex-col gap-4">
          <Input
            label="Category Name *"
            placeholder="e.g. Fresh Juices"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
          />
          <div className="flex justify-end gap-3 border-t border-slate-800/80 pt-4">
            <Button onClick={() => setIsCatFormOpen(false)} variant="secondary">Cancel</Button>
            <Button type="submit" variant="primary">Create Category</Button>
          </div>
        </form>
      </Dialog>

      {/* 5. Product Remove confirmation */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Product Removal"
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4 text-center py-2">
          <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="font-bold text-slate-200">Remove product catalog item?</h4>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete <span className="text-slate-200 font-bold">{selectedProduct?.name}</span>? 
              All incoming stock entry batches and delivery invoice lines linking to this item will be removed permanently.
            </p>
          </div>
          <div className="flex justify-center gap-3 mt-4 border-t border-slate-800/80 pt-4">
            <Button onClick={() => setIsDeleteOpen(false)} variant="secondary">Cancel</Button>
            <Button onClick={handleDeleteConfirm} variant="destructive">Remove Item</Button>
          </div>
        </div>
      </Dialog>

    </div>
  );
};

export default Products;
