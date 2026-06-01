import React, { useState, useEffect } from 'react';
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
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCatFormOpen, setIsCatFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form states
  const [newCatName, setNewCatName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    brand: '',
    categoryId: '',
    lotSize: '1',
    unitType: 'pcs',
    purchasePrice: '0',
    sellingPrice: '0',
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyGst: '',
    mrp: '0',
    discountPercent: '',
    currentStock: '0',
    minStockAlert: '5',
    expiryDate: ''
  });

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
      const [prods, cats] = await Promise.all([
        api.products.getAll(search, selectedCatId, lowStockOnly),
        api.products.getCategories()
      ]);
      setProducts(prods);
      setCategories(cats);
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
    setSelectedProduct(null);
    setFormData({
      name: '',
      sku: '',
      brand: '',
      categoryId: categories[0]?.id || '',
      lotSize: '1',
      unitType: 'pcs',
      purchasePrice: '0',
      sellingPrice: '0',
      companyName: '',
      companyAddress: '',
      companyPhone: '',
      companyGst: '',
      mrp: '0',
      discountPercent: '',
      currentStock: '0',
      minStockAlert: '5',
      expiryDate: ''
    });
    setIsFormOpen(true);
  };

  const handleEditOpen = (prod) => {
    setSelectedProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      brand: prod.brand,
      categoryId: prod.categoryId,
      lotSize: String(prod.lotSize),
      unitType: prod.unitType,
      purchasePrice: String(prod.purchasePrice),
      sellingPrice: String(prod.sellingPrice),
      companyName: prod.companyName || '',
      companyAddress: prod.companyAddress || '',
      companyPhone: prod.companyPhone || '',
      companyGst: prod.companyGst || '',
      mrp: String(prod.mrp || 0),
      discountPercent: prod.discountPercent || '',
      currentStock: String(prod.currentStock),
      minStockAlert: String(prod.minStockAlert),
      expiryDate: prod.expiryDate ? prod.expiryDate.split('T')[0] : ''
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.brand || !formData.categoryId || !formData.purchasePrice || !formData.sellingPrice) {
      toast.error('Please fill in all mandatory fields');
      return;
    }

    try {
      if (selectedProduct) {
        await api.products.update(selectedProduct.id, formData);
        toast.success('Product updated successfully');
      } else {
        await api.products.create(formData);
        toast.success('Product added successfully');
      }
      setIsFormOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product details</TableHead>
                  <TableHead>SKU Code</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Lot Size</TableHead>
                  <TableHead>Buying Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Total Profit</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Expiry Date</TableHead>
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
                          {prod.companyName && (
                            <span className="text-[10px] text-slate-500 font-semibold truncate max-w-[120px]" title={prod.companyName}>
                              {prod.companyName}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{prod.category?.name || 'N/A'}</TableCell>
                      <TableCell className="text-slate-400">{prod.lotSize} pcs</TableCell>
                      <TableCell className="font-semibold text-slate-400">₹{prod.purchasePrice.toFixed(2)}</TableCell>
                      <TableCell className="font-bold text-slate-200">
                        <div className="flex flex-col">
                          <span>₹{prod.sellingPrice.toFixed(2)}</span>
                          {prod.mrp > 0 && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              MRP: ₹{prod.mrp.toFixed(2)} {prod.discountPercent && `(${prod.discountPercent})`}
                            </span>
                          )}
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
                      <TableCell className="text-xs text-slate-500 font-semibold">
                        {prod.expiryDate ? new Date(prod.expiryDate).toLocaleDateString('en-IN') : 'N/A'}
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
          )}
        </CardContent>
      </Card>

      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedProduct ? 'Edit Catalog Product' : 'Add New Inventory Product'}
        maxWidth="lg"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2.5">
            <div className="md:col-span-2">
              <Input
                label="Product Name *"
                placeholder="e.g. Coca Cola 250ml"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="SKU Code (Must be unique) *"
                placeholder="e.g. BEV-CC-250"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Brand / Manufacturer *"
                placeholder="e.g. Coca Cola Co."
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Company Name"
                placeholder="e.g. Coca-Cola India Pvt Ltd"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Company Address"
                placeholder="e.g. Gurugram, Haryana"
                value={formData.companyAddress}
                onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Company Phone"
                placeholder="e.g. 18001882653"
                value={formData.companyPhone}
                onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Company GST PIN"
                placeholder="e.g. 06AACCC1100F1Z4"
                value={formData.companyGst}
                onChange={(e) => setFormData({ ...formData, companyGst: e.target.value })}
              />
            </div>
            <div>
              <Select
                label="Product Category *"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Input
                label="Unit Type (e.g. case, box) *"
                placeholder="case"
                value={formData.unitType}
                onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Lot/Pack Size (Qty per Unit) *"
                type="number"
                value={formData.lotSize}
                onChange={(e) => setFormData({ ...formData, lotSize: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Minimum Alert Limit *"
                type="number"
                value={formData.minStockAlert}
                onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Initial Stock Quantity"
                type="number"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                disabled={!!selectedProduct}
              />
            </div>
            <div>
              <Input
                label="MRP (INR) *"
                type="number"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Approved Discount Range (%)"
                placeholder="e.g. 12% - 18% or 15%"
                value={formData.discountPercent}
                onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Purchase Price (INR) *"
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
              />
            </div>
            <div>
              <div className="flex flex-col gap-1">
                <Input
                  label="Selling Price (INR) *"
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                />
                {(() => {
                  const { min, max } = parseDiscountRange(formData.discountPercent);
                  const mrpVal = parseFloat(formData.mrp) || 0;
                  if (mrpVal > 0 && formData.discountPercent) {
                    const minPrice = mrpVal * (1 - max / 100);
                    const maxPrice = mrpVal * (1 - min / 100);
                    return (
                      <span className="text-[10px] text-emerald-400 font-semibold px-1">
                        Approved Range: ₹{minPrice.toFixed(2)} - ₹{maxPrice.toFixed(2)}
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
            <div>
              <Input
                label="Product Expiry Date"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 border-t border-slate-800/80 pt-4">
            <Button onClick={() => setIsFormOpen(false)} variant="secondary">Cancel</Button>
            <Button type="submit" variant="primary">Save Product</Button>
          </div>
        </form>
      </Dialog>

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
