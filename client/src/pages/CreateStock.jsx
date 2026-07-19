import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { useToast } from '../components/ui/Toast.jsx';
import { api } from '../services/api.js';

export default function CreateStock() {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Mappings
  const [suppliers, setSuppliers] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Form states
  const [formData, setFormData] = useState({
    supplierId: '',
    invoiceNumber: '',
    productId: '',
    quantity: '',
    costPrice: '0',
    date: new Date().toISOString().split('T')[0],
    expiryDate: '',
    notes: ''
  });

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoading(true);
        const data = await api.suppliers.getAll();
        setSuppliers(data);
        if (data.length === 0) {
          toast.error('Please register a supplier first');
        }
      } catch (err) {
        toast.error('Failed to load suppliers list');
      } finally {
        setLoading(false);
      }
    };
    loadSuppliers();
  }, []);

  const handleSupplierSelect = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    const linkedProducts = supplier ? (supplier.products || []) : [];
    
    setFilteredProducts(linkedProducts);
    setFormData(prev => ({
      ...prev,
      supplierId,
      productId: linkedProducts[0]?.id || '',
      costPrice: linkedProducts[0] ? String(linkedProducts[0].purchasePrice) : '0'
    }));
  };

  const handleProductSelect = (prodId) => {
    const prod = filteredProducts.find(p => p.id === prodId);
    setFormData(prev => ({
      ...prev,
      productId: prodId,
      costPrice: prod ? String(prod.purchasePrice) : '0'
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplierId || !formData.invoiceNumber || !formData.productId || !formData.quantity || !formData.costPrice) {
      toast.error('Please fill in all mandatory fields');
      return;
    }

    try {
      setSubmitting(true);
      await api.stock.create(formData);
      toast.success('Stock intake registered. Inventory increased!');
      navigate('/stocks');
    } catch (err) {
      toast.error(err.message || 'Log failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center text-slate-500 font-bold min-h-[400px] animate-pulse">
        Loading replenishment configuration...
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-4 animate-fade-in text-slate-200">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 select-none">
        <span className="hover:text-white cursor-pointer transition-colors font-semibold" onClick={() => navigate('/stocks')}>
          Stocks Ledger
        </span>
        <span>/</span>
        <span className="text-indigo-400 font-bold">Add Stock Intake</span>
      </div>

      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/stocks')}
            className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-850 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-base font-extrabold text-slate-200 tracking-tight">
            Record New Stock Entry
          </h2>
        </div>
      </div>

      <form onSubmit={handleFormSubmit}>
        <Card className="border-slate-900 bg-slate-950/20 max-w-4xl">
          <CardContent className="p-6 flex flex-col gap-6">
            
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider inline-flex items-center gap-1.5 border-b border-slate-900 pb-2">
              <Package className="h-4 w-4" />
              Replenishment Source & Intake Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
              
              {/* Supplier select */}
              <div>
                <Select
                  label="Supplier *"
                  value={formData.supplierId}
                  onChange={(e) => handleSupplierSelect(e.target.value)}
                >
                  <option value="" className="bg-slate-900">-- Select Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>
                  ))}
                </Select>
              </div>

              {/* Invoice Number */}
              <div>
                <Input
                  label="Supplier Invoice Number *"
                  placeholder="e.g. INV-SUP-9901"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                />
              </div>

              {/* Shipment Date */}
              <div>
                <Input
                  label="Shipment Date *"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              {/* Product Expiry */}
              <div>
                <Input
                  label="Product Expiry Date"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>

              {/* Product select */}
              <div className="md:col-span-2">
                <Select
                  label="Product Received *"
                  value={formData.productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  disabled={!formData.supplierId}
                >
                  {!formData.supplierId ? (
                    <option value="" className="bg-slate-900">-- Select Supplier First --</option>
                  ) : filteredProducts.length === 0 ? (
                    <option value="" className="bg-slate-900">-- No linked products found --</option>
                  ) : (
                    filteredProducts.map(p => (
                      <option key={p.id} value={p.id} className="bg-slate-900">{p.name} ({p.sku})</option>
                    ))
                  )}
                </Select>
                {formData.supplierId && filteredProducts.length === 0 && (
                  <span className="text-[10px] text-amber-500 font-semibold mt-1 block">
                    ⚠️ This supplier is not linked to any products. Please map suppliers in the Catalog first!
                  </span>
                )}
              </div>

              {/* Intake Qty */}
              <div>
                <Input
                  label="Intake Quantity (Units) *"
                  type="number"
                  placeholder="e.g. 50"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>

              {/* Cost Price */}
              <div>
                <Input
                  label="Unit Cost Price (INR) *"
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-400">Notes / Remarks</label>
                <textarea
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[50px] transition-all"
                  placeholder="Item in good condition. Received at morning dock."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 mt-4 border-t border-slate-900 pt-4">
              <Button onClick={() => navigate('/stocks')} type="button" variant="secondary">
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting} disabled={!formData.productId} className="inline-flex items-center gap-1.5 font-bold">
                <Save className="h-4 w-4" />
                Add Stocks
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>

    </div>
  );
}
