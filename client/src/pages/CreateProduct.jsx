import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { ArrowLeft, Save, ShoppingBag } from 'lucide-react';
import { useToast } from '../components/ui/Toast.jsx';
import { api } from '../services/api.js';

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

export default function CreateProduct() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Dependencies
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    brand: '',
    categoryId: '',
    lotSize: '1',
    unitType: 'pcs',
    purchasePrice: '0',
    sellingPrice: '0',
    supplierId: '',
    mrp: '0',
    discountPercent: '',
    currentStock: '0',
    minStockAlert: '5',
    expiryDate: '',
    gstPercent: '0'
  });

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        setLoading(true);
        const [cats, sups] = await Promise.all([
          api.products.getCategories(),
          api.suppliers.getAll()
        ]);
        setCategories(cats);
        setSuppliers(sups);

        if (id) {
          const prod = await api.products.getById(id);
          setFormData({
            name: prod.name,
            sku: prod.sku,
            brand: prod.brand,
            categoryId: prod.categoryId,
            lotSize: String(prod.lotSize),
            unitType: prod.unitType,
            purchasePrice: String(prod.purchasePrice),
            sellingPrice: String(prod.sellingPrice),
            supplierId: prod.supplierId || '',
            mrp: String(prod.mrp || 0),
            discountPercent: prod.discountPercent || '',
            currentStock: String(prod.currentStock),
            minStockAlert: String(prod.minStockAlert),
            expiryDate: prod.expiryDate ? prod.expiryDate.split('T')[0] : '',
            gstPercent: String(prod.gstPercent || 0)
          });
        } else {
          // Initialize category and supplier defaults if available
          setFormData(prev => ({
            ...prev,
            categoryId: cats[0]?.id || '',
            supplierId: sups[0]?.id || ''
          }));
        }
      } catch (err) {
        toast.error('Failed to initialize product form dependencies');
      } finally {
        setLoading(false);
      }
    };
    loadDependencies();
  }, [id]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.sku || !formData.brand || !formData.categoryId || !formData.purchasePrice || !formData.sellingPrice || !formData.supplierId) {
      toast.error('Please fill in all mandatory fields');
      return;
    }

    try {
      setSubmitting(true);
      if (id) {
        await api.products.update(id, formData);
        toast.success('Product updated successfully');
      } else {
        await api.products.create(formData);
        toast.success('Product added successfully');
      }
      navigate('/products');
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center text-slate-500 font-bold min-h-[400px] animate-pulse">
        Loading product form dependencies...
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-4 animate-fade-in text-slate-200">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 select-none">
        <span className="hover:text-white cursor-pointer transition-colors font-semibold" onClick={() => navigate('/products')}>
          Inventory Products
        </span>
        <span>/</span>
        <span className="text-indigo-400 font-bold">
          {id ? 'Edit Product' : 'Register New Product'}
        </span>
      </div>

      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/products')}
            className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-850 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-base font-extrabold text-slate-200 tracking-tight">
            {id ? 'Edit Product Details' : 'Add New Inventory Product'}
          </h2>
        </div>
      </div>

      <form onSubmit={handleFormSubmit}>
        <Card className="border-slate-900 bg-slate-950/20 max-w-4xl">
          <CardContent className="p-6 flex flex-col gap-6">
            
            {/* Header section indicator */}
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider inline-flex items-center gap-1.5 border-b border-slate-900 pb-2">
              <ShoppingBag className="h-4 w-4" />
              Product Core & Financial Properties
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
              
              {/* Product Supplier (FIRST) */}
              <div className="md:col-span-3">
                <Select
                  label="Product Supplier *"
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                >
                  <option value="" className="bg-slate-900">-- Select Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>
                  ))}
                </Select>
              </div>

              {/* Product Name */}
              <div className="md:col-span-2">
                <Input
                  label="Product Name *"
                  placeholder="e.g. Coca Cola 250ml"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* SKU */}
              <div>
                <Input
                  label="SKU Code (Unique) *"
                  placeholder="e.g. BEV-CC-250"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>

              {/* Brand */}
              <div>
                <Input
                  label="Brand / Manufacturer *"
                  placeholder="e.g. Coca Cola Co."
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>

              {/* Category */}
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

              {/* Unit Type */}
              <div>
                <Input
                  label="Unit Type (e.g. case, box) *"
                  placeholder="case"
                  value={formData.unitType}
                  onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                />
              </div>

              {/* Lot size */}
              <div>
                <Input
                  label="Lot/Pack Size (Qty per Unit) *"
                  type="number"
                  value={formData.lotSize}
                  onChange={(e) => setFormData({ ...formData, lotSize: e.target.value })}
                />
              </div>

              {/* Min stock limit */}
              <div>
                <Input
                  label="Minimum Alert Limit *"
                  type="number"
                  value={formData.minStockAlert}
                  onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                />
              </div>

              {/* Current stock (Disabled on edit) */}
              <div>
                <Input
                  label="Initial Stock Quantity"
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                  disabled={!!id}
                />
              </div>

              {/* MRP */}
              <div>
                <Input
                  label="MRP (INR) *"
                  type="number"
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                />
              </div>

              {/* Discount Percent */}
              <div>
                <Input
                  label="Approved Discount Range (%)"
                  placeholder="e.g. 12% - 18% or 15%"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                />
              </div>

              {/* Purchase price */}
              <div>
                <Input
                  label="Purchase Price (INR) *"
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                />
              </div>

              {/* Selling price */}
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
                        Approved Price Range: ₹{minPrice.toFixed(2)} - ₹{maxPrice.toFixed(2)}
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Product expiry */}
              <div>
                <Input
                  label="Expiry Date"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>

              {/* GST rate */}
              <div>
                <Input
                  label="GST Rate (%)"
                  type="number"
                  placeholder="0"
                  value={formData.gstPercent}
                  onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })}
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 mt-4 border-t border-slate-900 pt-4">
              <Button onClick={() => navigate('/products')} type="button" variant="secondary">
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting} className="inline-flex items-center gap-1.5 font-bold">
                <Save className="h-4 w-4" />
                Save Product Record
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>

    </div>
  );
}
