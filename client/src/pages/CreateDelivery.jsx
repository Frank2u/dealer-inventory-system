import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { ShoppingBag, X, AlertCircle, ArrowLeft, Save, Truck } from 'lucide-react';
import { useToast } from '../components/ui/Toast.jsx';
import { api } from '../services/api.js';

// Parses discount range string like "10% - 15%" to extract the max percentage limit
const parseDiscountRange = (rangeStr) => {
  if (!rangeStr) return { min: 0, max: 0 };
  const matches = rangeStr.match(/(\d+)%/g);
  if (!matches) return { min: 0, max: 0 };
  const values = matches.map(m => parseInt(m));
  if (values.length === 1) return { min: 0, max: values[0] };
  return { min: values[0], max: values[1] };
};

export default function CreateDelivery() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'dispatch'
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);

  // Form states
  const [invoiceShopId, setInvoiceShopId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoicePaidAmount, setInvoicePaidAmount] = useState('0');
  const [invoicePaymentMethod, setInvoicePaymentMethod] = useState('CASH');
  const [invoiceStatus, setInvoiceStatus] = useState('ordered'); // 'ordered' (invoice template) or 'delivered' (dispatch)
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadFormDependencies = async () => {
      try {
        setLoading(true);
        const [prods, shps] = await Promise.all([
          api.products.getAll(),
          api.shops.getAll()
        ]);
        setProducts(prods);
        setShops(shps);

        if (id) {
          // Edit/Dispatch mode
          setFormMode('dispatch');
          setInvoiceStatus('delivered');
          const detail = await api.deliveries.getById(id);
          setInvoiceShopId(detail.shopId);
          setInvoiceDate(detail.deliveryDate ? new Date(detail.deliveryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
          setInvoicePaidAmount(String(detail.paidAmount));
          setInvoicePaymentMethod(detail.paymentMethod || 'CASH');

          // Group detail items by product
          const grouped = {};
          detail.items.forEach(item => {
            if (!grouped[item.productId]) {
              grouped[item.productId] = [];
            }
            grouped[item.productId].push(item);
          });

          const mappedItems = Object.keys(grouped).map(prodId => {
            const product = prods.find(p => p.id === prodId);
            if (!product) return null;

            const lotsData = (product.lots && product.lots.length > 0)
              ? product.lots.map(lot => {
                  const matchedItem = grouped[prodId].find(item => item.stockEntryId === lot.id);
                  const initialDiscount = matchedItem ? (product.mrp > 0 ? ((product.mrp - matchedItem.price) / product.mrp) * 100 : 0) : 0;
                  return {
                    selected: !!matchedItem,
                    stockEntryId: lot.id,
                    expiryDate: lot.expiryDate,
                    remainingStock: lot.remainingStock,
                    costPrice: lot.costPrice,
                    sellingPrice: matchedItem ? matchedItem.price : product.sellingPrice,
                    quantity: matchedItem ? String(matchedItem.quantity) : '0',
                    discountInputType: 'percent',
                    discountVal: initialDiscount > 0 ? initialDiscount.toFixed(1) : '0',
                    error: ''
                  };
                })
              : [{
                  selected: (grouped[prodId] && grouped[prodId][0] && parseInt(grouped[prodId][0].quantity) > 0) ? true : false,
                  stockEntryId: '',
                  expiryDate: null,
                  remainingStock: product.currentStock,
                  costPrice: product.purchasePrice,
                  sellingPrice: grouped[prodId][0]?.price || product.sellingPrice,
                  quantity: String(grouped[prodId][0]?.quantity || '0'),
                  discountInputType: 'percent',
                  discountVal: '0',
                  error: ''
                }];

            return {
              productId: prodId,
              mrp: product.mrp,
              discountRange: product.discountPercent,
              unitType: product.unitType,
              lots: lotsData,
              error: ''
            };
          }).filter(Boolean);

          setInvoiceItems(mappedItems);
        } else {
          // Create Mode
          setFormMode('create');
          setInvoiceStatus('ordered');
          if (prods.length > 0) {
            const defaultProd = prods[0];
            const initialLots = defaultProd.lots && defaultProd.lots.length > 0
              ? defaultProd.lots.map(lot => ({
                  selected: false,
                  stockEntryId: lot.id,
                  expiryDate: lot.expiryDate,
                  remainingStock: lot.remainingStock,
                  costPrice: lot.costPrice,
                  sellingPrice: defaultProd.sellingPrice,
                  quantity: '0',
                  discountInputType: 'percent',
                  discountVal: '0',
                  error: ''
                }))
              : [{
                  selected: false,
                  stockEntryId: '',
                  expiryDate: null,
                  remainingStock: defaultProd.currentStock,
                  costPrice: defaultProd.purchasePrice,
                  sellingPrice: defaultProd.sellingPrice,
                  quantity: '0',
                  discountInputType: 'percent',
                  discountVal: '0',
                  error: ''
                }];

            setInvoiceItems([
              {
                productId: defaultProd.id,
                mrp: defaultProd.mrp,
                discountRange: defaultProd.discountPercent,
                unitType: defaultProd.unitType,
                lots: initialLots,
                error: ''
              }
            ]);
          }
        }
      } catch (err) {
        toast.error('Failed to initialize delivery form parameters');
      } finally {
        setLoading(false);
      }
    };
    loadFormDependencies();
  }, [id]);

  // Add card item to invoice creator
  const addInvoiceItem = () => {
    if (products.length === 0) return;
    const defaultProd = products[0];
    const initialLots = defaultProd.lots && defaultProd.lots.length > 0
      ? defaultProd.lots.map(lot => ({
          selected: false,
          stockEntryId: lot.id,
          expiryDate: lot.expiryDate,
          remainingStock: lot.remainingStock,
          costPrice: lot.costPrice,
          sellingPrice: defaultProd.sellingPrice,
          quantity: '0',
          discountInputType: 'percent',
          discountVal: '0',
          error: ''
        }))
      : [{
          selected: false,
          stockEntryId: '',
          expiryDate: null,
          remainingStock: defaultProd.currentStock,
          costPrice: defaultProd.purchasePrice,
          sellingPrice: defaultProd.sellingPrice,
          quantity: '0',
          discountInputType: 'percent',
          discountVal: '0',
          error: ''
        }];

    setInvoiceItems(prev => [
      ...prev,
      {
        productId: defaultProd.id,
        mrp: defaultProd.mrp,
        discountRange: defaultProd.discountPercent,
        unitType: defaultProd.unitType,
        lots: initialLots,
        error: ''
      }
    ]);
  };

  // Remove card item
  const removeInvoiceItem = (index) => {
    if (invoiceItems.length === 1) return;
    setInvoiceItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update item field in invoice creator
  const handleItemChange = (index, field, value) => {
    const updated = [...invoiceItems];
    const item = updated[index];

    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (!prod) return;

      item.productId = value;
      item.mrp = prod.mrp;
      item.discountRange = prod.discountPercent;
      item.unitType = prod.unitType;
      item.lots = (prod.lots && prod.lots.length > 0)
        ? prod.lots.map(lot => ({
            selected: false,
            stockEntryId: lot.id,
            expiryDate: lot.expiryDate,
            remainingStock: lot.remainingStock,
            costPrice: lot.costPrice,
            sellingPrice: prod.sellingPrice,
            quantity: '0',
            discountInputType: 'percent',
            discountVal: '0',
            error: ''
          }))
        : [{
            selected: false,
            stockEntryId: '',
            expiryDate: null,
            remainingStock: prod.currentStock,
            costPrice: prod.purchasePrice,
            sellingPrice: prod.sellingPrice,
            quantity: '0',
            discountInputType: 'percent',
            discountVal: '0',
            error: ''
          }];
      item.error = '';
    }
    setInvoiceItems(updated);
  };

  // Update individual lot values inside an item
  const handleLotChange = (itemIdx, lotIdx, field, value) => {
    const updated = [...invoiceItems];
    const item = updated[itemIdx];
    const lot = item.lots[lotIdx];

    if (field === 'selected') {
      lot.selected = value;
      if (value) {
        if (lot.quantity === '0' || !lot.quantity) {
          lot.quantity = '1';
        }
      } else {
        lot.quantity = '0';
        lot.error = '';
      }
    } else if (field === 'quantity') {
      lot.quantity = value;
      if (parseInt(value) > 0) {
        lot.selected = true;
      } else if (parseInt(value) === 0) {
        lot.selected = false;
      }
    } else if (field === 'discountInputType') {
      lot.discountInputType = value;
      lot.discountVal = '0';
    } else if (field === 'discountVal') {
      lot.discountVal = value;
    }

    // Calculate discounted price
    const mrp = item.mrp || 0;
    let price = mrp;
    let discountPercentCalculated = 0;

    if (lot.discountInputType === 'percent') {
      const percent = parseFloat(lot.discountVal) || 0;
      price = mrp - (mrp * percent / 100);
      discountPercentCalculated = percent;
    } else {
      const amount = parseFloat(lot.discountVal) || 0;
      price = mrp - amount;
      discountPercentCalculated = mrp > 0 ? (amount / mrp) * 100 : 0;
    }

    lot.sellingPrice = price >= 0 ? price : 0;

    // Validate quantities and discounts
    const qty = parseInt(lot.quantity) || 0;
    const { max } = parseDiscountRange(item.discountRange);

    if (lot.selected) {
      if (invoiceStatus === 'delivered' && qty > lot.remainingStock) {
        lot.error = `Only ${lot.remainingStock} in stock`;
      } else if (discountPercentCalculated > max) {
        lot.error = `Discount (${discountPercentCalculated.toFixed(1)}%) exceeds max (${max}%)`;
      } else {
        lot.error = '';
      }
    } else {
      lot.error = '';
    }

    item.error = item.lots.some(l => l.error) ? 'Please fix errors on active lots' : '';
    setInvoiceItems(updated);
  };

  const getInvoiceTotal = () => {
    return invoiceItems.reduce((sum, item) => {
      const itemSum = item.lots ? item.lots.reduce((lotSum, lot) => {
        if (!lot.selected) return lotSum;
        const qty = parseInt(lot.quantity) || 0;
        return lotSum + (lot.sellingPrice * qty);
      }, 0) : 0;
      return sum + itemSum;
    }, 0);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!invoiceShopId) {
      toast.error('Select a retail shop');
      return;
    }

    // Validate errors and stocks
    if (invoiceItems.some(item => item.error)) {
      toast.error('Please resolve all validation errors first');
      return;
    }

    const itemsToSubmit = [];
    for (const item of invoiceItems) {
      if (!item.productId) {
        toast.error('Select a product for all lines');
        return;
      }
      
      const activeLots = item.lots.filter(lot => lot.selected && (parseInt(lot.quantity) || 0) > 0);
      for (const lot of activeLots) {
        const qty = parseInt(lot.quantity);
        if (invoiceStatus === 'delivered' && qty > lot.remainingStock) {
          toast.error(`Insufficient stock for product lot`);
          return;
        }
        itemsToSubmit.push({
          productId: item.productId,
          stockEntryId: lot.stockEntryId || null,
          quantity: qty,
          price: lot.sellingPrice
        });
      }
    }

    if (itemsToSubmit.length === 0) {
      toast.error('Please enter quantity for at least one lot');
      return;
    }

    const grandTotal = getInvoiceTotal();
    const payAmt = parseFloat(invoicePaidAmount) || 0;
    if (payAmt > grandTotal) {
      toast.error('Paid amount cannot exceed total invoice amount');
      return;
    }

    try {
      setSubmitting(true);
      if (formMode === 'create') {
        await api.deliveries.create({
          shopId: invoiceShopId,
          deliveryDate: invoiceDate,
          paidAmount: payAmt,
          paymentMethod: invoicePaymentMethod,
          items: itemsToSubmit,
          status: invoiceStatus
        });
        toast.success('Delivery Invoice generated successfully!');
      } else {
        await api.deliveries.dispatch(id, {
          items: itemsToSubmit,
          paidAmount: payAmt,
          paymentMethod: invoicePaymentMethod,
          deliveryDate: invoiceDate
        });
        toast.success('Order dispatched and inventory updated successfully!');
      }
      navigate('/deliveries');
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center text-slate-500 font-bold min-h-[400px] animate-pulse">
        Loading delivery configuration...
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-4 animate-fade-in text-slate-200">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 select-none">
        <span className="hover:text-slate-355 hover:text-white cursor-pointer transition-colors font-semibold" onClick={() => navigate('/deliveries')}>
          Deliveries Ledger
        </span>
        <span>/</span>
        <span className="text-indigo-400 font-bold">
          {formMode === 'create' ? 'Create Delivery Invoice' : 'Dispatch Order Request'}
        </span>
      </div>

      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/deliveries')}
            className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-850 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-base font-extrabold text-slate-200 tracking-tight">
            {formMode === 'create' ? 'Generate New Delivery Invoice' : `Dispatch Order Request (#${id.slice(0,8)})`}
          </h2>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Items card */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Card className="border-slate-900 bg-slate-950/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider inline-flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4" />
                    Delivery Items Allocation
                  </span>
                  {formMode === 'create' && (
                    <Button onClick={addInvoiceItem} type="button" variant="secondary" size="sm" className="py-1">
                      + Add Product Card
                    </Button>
                  )}
                </div>

                <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-1">
                  {invoiceItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col md:grid md:grid-cols-12 gap-3 bg-slate-950/40 border border-slate-900 p-4 rounded-lg relative">
                      
                      {/* Product selector */}
                      <div className="w-full md:col-span-11">
                        <Select
                          label={`Product #${idx + 1}`}
                          value={item.productId}
                          disabled={formMode === 'dispatch'}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        >
                          <option value="" className="bg-slate-900">-- Select Product --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id} className="bg-slate-900" disabled={invoiceStatus === 'delivered' && p.currentStock <= 0}>
                              {p.name} [{p.sku}] (Stock: {p.currentStock} {p.unitType})
                            </option>
                          ))}
                        </Select>
                      </div>

                      {/* Remove card button */}
                      <div className="md:col-span-1 flex justify-end pb-1 mt-4 md:mt-0">
                        <button
                          type="button"
                          onClick={() => removeInvoiceItem(idx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-455 hover:text-rose-400 hover:bg-slate-900 transition-all cursor-pointer"
                          disabled={invoiceItems.length === 1 || formMode === 'dispatch'}
                        >
                          <X className="h-4.5 w-4.5" />
                        </button>
                      </div>

                      {/* Multi-lot display list section */}
                      {item.productId && item.lots && (
                        <div className="col-span-12 w-full bg-slate-900/40 border border-slate-850/60 p-3 rounded-lg">
                          <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-850/60">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Available Stock Batches & Delivery Allocation</span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              MRP: ₹{(item.mrp || 0).toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                            {item.lots.map((lot, lotIdx) => {
                              const subtotal = lot.sellingPrice * (parseInt(lot.quantity) || 0);
                              return (
                                <div key={lot.stockEntryId || 'general'} className={`flex flex-col lg:grid lg:grid-cols-12 gap-3 items-stretch lg:items-center p-3 rounded-lg border transition-all duration-150 ${
                                  lot.selected 
                                    ? 'bg-slate-950/80 border-indigo-500/20 shadow-md shadow-indigo-950/20' 
                                    : 'bg-slate-950/30 border-slate-900/60 opacity-60'
                                }`}>
                                  
                                  {/* Left section: Checkbox & Metadata */}
                                  <div className="flex flex-wrap items-center gap-3 lg:col-span-7">
                                    {/* Select Checkbox */}
                                    <div className="flex items-center justify-center p-1">
                                      <input
                                        type="checkbox"
                                        checked={!!lot.selected}
                                        onChange={(e) => handleLotChange(idx, lotIdx, 'selected', e.target.checked)}
                                        className="h-5 w-5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer"
                                      />
                                    </div>

                                    {/* Expiry Date */}
                                    <div className="min-w-[100px] flex-1 sm:flex-initial">
                                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Expiry Date</span>
                                      <span className="text-xs font-bold text-amber-400">
                                        {lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString('en-IN') : 'General Stock'}
                                      </span>
                                    </div>
                                    
                                    {/* Available stock */}
                                    <div className="min-w-[80px] flex-1 sm:flex-initial">
                                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Available</span>
                                      <span className="text-xs text-slate-300 font-semibold">
                                        {lot.remainingStock} pcs
                                      </span>
                                    </div>

                                    {/* Base price */}
                                    <div className="min-w-[80px] flex-1 sm:flex-initial">
                                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Base Price</span>
                                      <span className="text-xs text-slate-300 font-mono">
                                        ₹{item.mrp.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right section: Inputs & Subtotal */}
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:col-span-5 w-full">
                                    {/* Discount input & Allowed limit */}
                                    <div className="flex-1 min-w-[140px] flex flex-col gap-0.5">
                                      <div className="flex items-center gap-1">
                                        <div className="w-[60%]">
                                          <Input
                                            label="Discount"
                                            type="number"
                                            min="0"
                                            step="any"
                                            disabled={!lot.selected}
                                            className="py-1 text-xs text-center disabled:opacity-50"
                                            value={lot.discountVal}
                                            onChange={(e) => handleLotChange(idx, lotIdx, 'discountVal', e.target.value)}
                                          />
                                        </div>
                                        <div className="w-[40%] mt-4">
                                          <select
                                            value={lot.discountInputType}
                                            disabled={!lot.selected}
                                            onChange={(e) => handleLotChange(idx, lotIdx, 'discountInputType', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-slate-350 focus:outline-none cursor-pointer font-bold disabled:opacity-50 h-[34px]"
                                          >
                                            <option value="percent">%</option>
                                            <option value="amount">₹</option>
                                          </select>
                                        </div>
                                      </div>
                                      <span className="text-[10px] text-indigo-400 font-extrabold block text-center mt-0.5">
                                        Allowed: {item.discountRange || '0%'}
                                      </span>
                                    </div>

                                    {/* Delivery Lot Req (Quantity) */}
                                    <div className="w-full sm:w-[90px]">
                                      <Input
                                        label="Req Qty"
                                        type="number"
                                        min="0"
                                        disabled={!lot.selected}
                                        className="py-1 text-xs text-center font-bold disabled:opacity-50"
                                        value={lot.quantity}
                                        onChange={(e) => handleLotChange(idx, lotIdx, 'quantity', e.target.value)}
                                      />
                                    </div>

                                    {/* Subtotal */}
                                    <div className="min-w-[75px] text-right flex flex-col justify-end mt-4 sm:mt-0">
                                      <span className="text-[9px] text-slate-500 font-bold uppercase block text-right">Amount</span>
                                      <span className="text-sm font-black text-indigo-400 font-mono block text-right">
                                        ₹{subtotal.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Error line per lot */}
                                  {lot.error && (
                                    <span className="col-span-12 text-[10px] text-rose-450 font-bold block bg-rose-500/5 px-2.5 py-1 rounded border border-rose-500/10 w-full mt-1">
                                      ⚠️ {lot.error}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Error line */}
                      {item.error && (
                        <div className="col-span-12 w-full text-[10px] text-rose-450 font-semibold flex items-center gap-1 mt-1 bg-rose-500/5 px-2.5 py-1.5 rounded border border-rose-500/10">
                          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{item.error}</span>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Summary Card */}
          <div className="flex flex-col gap-4">
            <Card className="border-slate-900 bg-slate-950/20">
              <CardContent className="p-4 flex flex-col gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Delivery Configuration</span>
                
                {formMode === 'create' && (
                  <div className="flex gap-2 p-1.5 bg-slate-900/60 border border-slate-850 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setInvoiceStatus('ordered')}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        invoiceStatus === 'ordered'
                          ? 'bg-slate-800 text-indigo-400 border border-slate-700 shadow'
                          : 'text-slate-450 hover:text-slate-300'
                      }`}
                    >
                      Book Order
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceStatus('delivered')}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        invoiceStatus === 'delivered'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-450 hover:text-slate-300'
                      }`}
                    >
                      Direct Dispatch
                    </button>
                  </div>
                )}

                <Select
                  label="Retailer Shop *"
                  value={invoiceShopId}
                  disabled={formMode === 'dispatch'}
                  onChange={(e) => setInvoiceShopId(e.target.value)}
                >
                  <option value="" className="bg-slate-900">-- Select Shop --</option>
                  {shops.map(s => (
                    <option key={s.id} value={s.id} className="bg-slate-900">
                      {s.shopCode ? `[${s.shopCode}] ` : ''}{s.name} (Due: ₹{s.currentDue})
                    </option>
                  ))}
                </Select>

                <Input
                  label="Delivery Date *"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />

                <div className="border-t border-slate-900 my-2 pt-2">
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                    <span>Taxable Value:</span>
                    {(() => {
                      const formTotalAmount = getInvoiceTotal();
                      const formTotalGst = invoiceItems.reduce((sum, item) => {
                        const prod = products.find(p => p.id === item.productId);
                        const gstPercent = prod ? (prod.gstPercent || 0) : 0;
                        const itemGst = item.lots ? item.lots.reduce((lotSum, lot) => {
                          if (!lot.selected) return lotSum;
                          const qty = parseInt(lot.quantity) || 0;
                          const lotTotal = lot.sellingPrice * qty;
                          return lotSum + (lotTotal * (gstPercent / (100 + gstPercent)));
                        }, 0) : 0;
                        return sum + itemGst;
                      }, 0);
                      return <span className="font-semibold text-slate-200">₹{(formTotalAmount - formTotalGst).toFixed(2)}</span>;
                    })()}
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
                    <span>GST Extracted (Incl.):</span>
                    {(() => {
                      const formTotalGst = invoiceItems.reduce((sum, item) => {
                        const prod = products.find(p => p.id === item.productId);
                        const gstPercent = prod ? (prod.gstPercent || 0) : 0;
                        const itemGst = item.lots ? item.lots.reduce((lotSum, lot) => {
                          if (!lot.selected) return lotSum;
                          const qty = parseInt(lot.quantity) || 0;
                          const lotTotal = lot.sellingPrice * qty;
                          return lotSum + (lotTotal * (gstPercent / (100 + gstPercent)));
                        }, 0) : 0;
                        return sum + itemGst;
                      }, 0);
                      return <span className="font-semibold text-slate-200">₹{formTotalGst.toFixed(2)}</span>;
                    })()}
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-slate-200 border-t border-slate-900 pt-2 mb-1">
                    <span>Invoice Amount:</span>
                    <span>₹{getInvoiceTotal().toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-3 flex flex-col gap-3">
                  <Input
                    label="Amount Received (Paid) *"
                    type="number"
                    min="0"
                    step="any"
                    value={invoicePaidAmount}
                    onChange={(e) => setInvoicePaidAmount(e.target.value)}
                  />

                  <Select
                    label="Payment Method"
                    value={invoicePaymentMethod}
                    onChange={(e) => setInvoicePaymentMethod(e.target.value)}
                  >
                    <option value="CASH" className="bg-slate-900">Cash</option>
                    <option value="UPI" className="bg-slate-900">UPI / QR Code</option>
                    <option value="CARD" className="bg-slate-900">Debit / Credit Card</option>
                    <option value="BANK_TRANSFER" className="bg-slate-900">Bank NEFT/RTGS</option>
                    <option value="CHEQUE" className="bg-slate-900">Cheque</option>
                  </Select>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-2 py-2.5 inline-flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10 cursor-pointer font-bold"
                  loading={submitting}
                >
                  {invoiceStatus === 'delivered' ? (
                    <>
                      <Truck className="h-4 w-4" />
                      Dispatch & Save Invoice
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Generate Booking Invoice
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
          
        </div>
      </form>
    </div>
  );
}
