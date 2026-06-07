import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../components/ui/Toast.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Dialog } from '../components/ui/Dialog.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Plus, Eye, Trash2, Printer, ShoppingBag, X, Calendar, User, Search, Store, AlertCircle, Phone, Truck, IndianRupee } from 'lucide-react';

export const Deliveries = () => {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const shopIdParam = searchParams.get('shopId');
  const stageParam = searchParams.get('stage');
  const dateParam = searchParams.get('date') || '';

  const [deliveries, setDeliveries] = useState([]);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedShopId, setSelectedShopId] = useState(shopIdParam || '');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [stageFilter, setStageFilter] = useState(stageParam || '');
  const [dateFilter, setDateFilter] = useState(dateParam);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // Invoice creation form state
  const [invoiceShopId, setInvoiceShopId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoicePaidAmount, setInvoicePaidAmount] = useState('0');
  const [invoicePaymentMethod, setInvoicePaymentMethod] = useState('CASH');
  const [invoiceStatus, setInvoiceStatus] = useState('ordered');
  const [formMode, setFormMode] = useState('create');
  const [dispatchId, setDispatchId] = useState(null);
  const [editDispatchInfo, setEditDispatchInfo] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState([
    { productId: '', quantity: '1', price: 0, currentStock: 0, error: '' }
  ]);

  useEffect(() => {
    if (invoiceItems.length > 0 && products.length > 0) {
      setInvoiceItems(prev => prev.map(item => {
        const qty = parseInt(item.quantity) || 0;
        let error = '';
        const { max } = parseDiscountRange(item.discountRange);
        
        const mrp = item.mrp || 0;
        let discountPercentCalculated = 0;
        if (item.discountInputType === 'percent') {
          discountPercentCalculated = parseFloat(item.discountVal) || 0;
        } else {
          const amount = parseFloat(item.discountVal) || 0;
          discountPercentCalculated = mrp > 0 ? (amount / mrp) * 100 : 0;
        }

        if (invoiceStatus === 'delivered' && qty > item.currentStock) {
          error = `Only ${item.currentStock} in stock`;
        } else if (discountPercentCalculated > max) {
          error = `Discount (${discountPercentCalculated.toFixed(1)}%) exceeds max allowed (${max}%)`;
        }
        return { ...item, error };
      }));
    }
  }, [invoiceStatus]);

  const loadData = async () => {
    try {
      const [dlvs, shps, prods] = await Promise.all([
        api.deliveries.getAll(selectedShopId, paymentStatusFilter, stageFilter, dateFilter),
        api.shops.getAll(),
        api.products.getAll()
      ]);
      setDeliveries(dlvs);
      setShops(shps);
      setProducts(prods);
    } catch (err) {
      toast.error('Failed to load deliveries ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedShopId, paymentStatusFilter, stageFilter, dateFilter]);

  const dispatchIdParam = searchParams.get('dispatchId');

  useEffect(() => {
    if (dispatchIdParam && deliveries.length > 0 && products.length > 0) {
      const dlv = deliveries.find(d => d.id === dispatchIdParam);
      if (dlv && dlv.status === 'ordered') {
        handleDispatchDelivery(dlv);
      }
    }
  }, [dispatchIdParam, deliveries, products]);

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

  const handleCreateOpen = () => {
    if (shops.length === 0) {
      toast.error('Please register retail shops first');
      return;
    }
    if (products.length === 0) {
      toast.error('Please add products to inventory first');
      return;
    }
    setInvoiceShopId(shops[0].id);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setInvoicePaidAmount('0');
    setInvoicePaymentMethod('CASH');
    setInvoiceStatus('ordered');
    setFormMode('create');
    setDispatchId(null);
    
    const defaultProd = products[0];
    const initialDiscount = defaultProd.mrp > 0 ? ((defaultProd.mrp - defaultProd.sellingPrice) / defaultProd.mrp) * 100 : 0;
    setInvoiceItems([
      {
        productId: defaultProd.id,
        quantity: '1',
        mrp: defaultProd.mrp,
        discountRange: defaultProd.discountPercent,
        discountInputType: 'percent',
        discountVal: initialDiscount > 0 ? initialDiscount.toFixed(1) : '0',
        price: defaultProd.sellingPrice,
        currentStock: defaultProd.currentStock,
        error: ''
      }
    ]);
    setIsFormOpen(true);
  };

  // Add line item to invoice creator
  const addInvoiceItem = () => {
    const defaultProd = products[0];
    const initialDiscount = defaultProd.mrp > 0 ? ((defaultProd.mrp - defaultProd.sellingPrice) / defaultProd.mrp) * 100 : 0;
    setInvoiceItems(prev => [
      ...prev,
      {
        productId: defaultProd.id,
        quantity: '1',
        mrp: defaultProd.mrp,
        discountRange: defaultProd.discountPercent,
        discountInputType: 'percent',
        discountVal: initialDiscount > 0 ? initialDiscount.toFixed(1) : '0',
        price: defaultProd.sellingPrice,
        currentStock: defaultProd.currentStock,
        error: ''
      }
    ]);
  };

  // Remove line item
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
      const initDiscount = prod && prod.mrp > 0 ? ((prod.mrp - prod.sellingPrice) / prod.mrp) * 100 : 0;
      item.productId = value;
      item.mrp = prod ? prod.mrp : 0;
      item.discountRange = prod ? prod.discountPercent : '';
      item.price = prod ? prod.sellingPrice : 0;
      item.currentStock = prod ? prod.currentStock : 0;
      item.discountVal = initDiscount > 0 ? initDiscount.toFixed(1) : '0';
      item.discountInputType = 'percent';
      item.error = '';
    } else if (field === 'quantity') {
      item.quantity = value;
    } else if (field === 'discountInputType') {
      item.discountInputType = value;
      item.discountVal = '0';
    } else if (field === 'discountVal') {
      item.discountVal = value;
    }

    // Recalculate price and validate discount
    const mrp = item.mrp || 0;
    let price = mrp;
    let discountPercentCalculated = 0;

    if (item.discountInputType === 'percent') {
      const percent = parseFloat(item.discountVal) || 0;
      price = mrp - (mrp * percent / 100);
      discountPercentCalculated = percent;
    } else {
      const amount = parseFloat(item.discountVal) || 0;
      price = mrp - amount;
      discountPercentCalculated = mrp > 0 ? (amount / mrp) * 100 : 0;
    }

    item.price = price >= 0 ? price : 0;

    // Validation
    const qty = parseInt(item.quantity) || 0;
    const { max } = parseDiscountRange(item.discountRange);

    if (invoiceStatus === 'delivered' && qty > item.currentStock) {
      item.error = `Only ${item.currentStock} in stock`;
    } else if (discountPercentCalculated > max) {
      item.error = `Discount (${discountPercentCalculated.toFixed(1)}%) exceeds max allowed (${max}%)`;
    } else {
      item.error = '';
    }

    setInvoiceItems(updated);
  };

  // Calculate totals for invoice creation
  const getInvoiceTotal = () => {
    return invoiceItems.reduce((sum, item) => {
      const qty = parseInt(item.quantity) || 0;
      return sum + (item.price * qty);
    }, 0);
  };

  // Submit invoice creation
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
      const qty = parseInt(item.quantity) || 0;
      if (qty <= 0) {
        toast.error('Quantities must be greater than zero');
        return;
      }
      if (invoiceStatus === 'delivered' && qty > item.currentStock) {
        toast.error(`Insufficient stock for one or more items`);
        return;
      }
      itemsToSubmit.push({
        productId: item.productId,
        quantity: qty,
        price: item.price
      });
    }

    const grandTotal = getInvoiceTotal();
    const payAmt = parseFloat(invoicePaidAmount) || 0;
    if (payAmt > grandTotal) {
      toast.error('Paid amount cannot exceed total invoice amount');
      return;
    }

    try {
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
        await api.deliveries.dispatch(dispatchId, {
          items: itemsToSubmit,
          paidAmount: payAmt,
          paymentMethod: invoicePaymentMethod,
          deliveryDate: invoiceDate
        });
        toast.success('Order dispatched and inventory updated successfully!');
      }
      setIsFormOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  // Open Invoice Viewer
  const handleInvoiceOpen = async (dlv) => {
    try {
      const detail = await api.deliveries.getById(dlv.id);
      setSelectedDelivery(detail);
      setIsInvoiceOpen(true);
    } catch (err) {
      toast.error('Failed to fetch invoice details');
    }
  };

  // Open Delete Invoice Confirmation
  const handleDeleteOpen = (dlv) => {
    setSelectedDelivery(dlv);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.deliveries.delete(selectedDelivery.id);
      toast.success('Invoice deleted. Inventory stock levels restored.');
      setIsDeleteOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Invoice deletion failed');
    }
  };

  const handleDispatchDelivery = async (dlv) => {
    try {
      const detail = await api.deliveries.getById(dlv.id);
      setFormMode('dispatch');
      setDispatchId(detail.id);
      setInvoiceShopId(detail.shopId);
      // Default to order's booked delivery date
      setInvoiceDate(detail.deliveryDate ? new Date(detail.deliveryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setInvoicePaidAmount(String(detail.paidAmount));
      setInvoicePaymentMethod(detail.paymentMethod || 'CASH');
      setInvoiceStatus('delivered');
      setEditDispatchInfo(false); // Reset to summary mode

      const items = detail.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        const mrp = product ? product.mrp : item.price;
        const initialDiscount = mrp > 0 ? ((mrp - item.price) / mrp) * 100 : 0;
        
        return {
          productId: item.productId,
          quantity: String(item.quantity),
          mrp: mrp,
          discountRange: product ? product.discountPercent : '',
          discountInputType: 'percent',
          discountVal: initialDiscount > 0 ? initialDiscount.toFixed(1) : '0',
          price: item.price,
          currentStock: product ? product.currentStock : 0,
          error: ''
        };
      });
      setInvoiceItems(items);
      setIsFormOpen(true);
    } catch (err) {
      toast.error('Failed to load order details for dispatch');
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    const newParams = new URLSearchParams(searchParams);
    if (newParams.get('dispatchId')) {
      newParams.delete('dispatchId');
      const searchStr = newParams.toString();
      const newUrl = `${window.location.pathname}${searchStr ? `?${searchStr}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  };

  const totalGstPaidByShop = deliveries.reduce((sum, d) => sum + (d.gstPaidByShop || 0), 0);
  const totalGstPaidByMe = deliveries.reduce((sum, d) => sum + (d.gstPaidByMe || 0), 0);
  const totalInvoiceGst = deliveries.reduce((sum, d) => sum + (d.totalGst || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-in no-print">
      
      {/* 1. Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Shop select filter */}
          <select
            className="bg-slate-950/20 border border-slate-900 text-xs font-semibold text-slate-400 rounded-lg px-3 py-2.5 outline-none cursor-pointer hover:border-slate-800"
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
          >
            <option value="">All Retail Shops</option>
            {shops.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Stage filter */}
          <select
            className="bg-slate-950/20 border border-slate-900 text-xs font-semibold text-slate-400 rounded-lg px-3 py-2.5 outline-none cursor-pointer hover:border-slate-800"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value="">All Stages</option>
            <option value="ordered">Ordered (Pending)</option>
            <option value="delivered">Dispatched (Delivered)</option>
          </select>

          {/* Payment Status Filter */}
          <select
            className="bg-slate-950/20 border border-slate-900 text-xs font-semibold text-slate-400 rounded-lg px-3 py-2.5 outline-none cursor-pointer hover:border-slate-800"
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
          >
            <option value="">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>

          {/* Date Filter */}
          <div className="flex items-center gap-2 bg-slate-950/20 border border-slate-900 rounded-lg px-3.5 py-2 hover:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase">Date</span>
            <input
              type="date"
              style={{ colorScheme: 'dark' }}
              className="bg-transparent border-none text-xs font-semibold text-slate-400 outline-none cursor-pointer p-0 w-28"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-slate-550 hover:text-slate-300 ml-0.5 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Trigger Invoice Generation */}
        <Button onClick={handleCreateOpen} variant="primary" className="py-2 inline-flex items-center gap-1.5">
          <Plus className="h-4 w-4" />
          New Delivery Invoice
        </Button>
      </div>

      {/* GST Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-indigo-500/5 border-indigo-500/10 hover:-translate-y-0.5 transition-all duration-200">
          <CardContent className="p-5 flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 tracking-wide uppercase">GST Paid by Client (Shop)</span>
              <span className="text-2xl font-black text-slate-100 tracking-tight leading-tight">
                ₹{totalGstPaidByShop.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">Taxes paid by registered retailers</span>
            </div>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
              <User className="h-5 w-5 text-indigo-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/10 hover:-translate-y-0.5 transition-all duration-200">
          <CardContent className="p-5 flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 tracking-wide uppercase">GST Paid by Me</span>
              <span className="text-2xl font-black text-slate-100 tracking-tight leading-tight">
                ₹{totalGstPaidByMe.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">Taxes absorbed (claimable in annual filing)</span>
            </div>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/20 border border-slate-900 hover:-translate-y-0.5 transition-all duration-200">
          <CardContent className="p-5 flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 tracking-wide uppercase">Total Active GST</span>
              <span className="text-2xl font-black text-slate-100 tracking-tight leading-tight">
                ₹{totalInvoiceGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">Combined GST for filtered records</span>
            </div>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
              <IndianRupee className="h-5 w-5 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Deliveries table list */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-slate-500 font-semibold animate-pulse">Loading invoices ledger...</div>
          ) : deliveries.length === 0 ? (
            <div className="p-10 text-center text-slate-500 font-semibold">No deliveries logged in this filter</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Retail Shop</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Items Count</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>GST (Payer)</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Remaining Due</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((dlv) => (
                  <TableRow key={dlv.id}>
                    <TableCell className="font-bold text-slate-200">{dlv.deliveryNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-300">{dlv.shop?.name}</span>
                        {dlv.shop?.shopCode && (
                          <span className="text-[10px] font-mono text-indigo-400 font-bold">{dlv.shop.shopCode}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-400">
                      {new Date(dlv.deliveryDate).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell>{dlv.items?.length || 0} lines</TableCell>
                    <TableCell className="font-bold text-slate-200">₹{dlv.totalAmount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-200">₹{(dlv.totalGst || 0).toFixed(2)}</span>
                        {dlv.status === 'delivered' ? (
                          <span className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">
                            Shop: ₹{(dlv.gstPaidByShop || 0).toFixed(1)} | Me: ₹{(dlv.gstPaidByMe || 0).toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Pending</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-400">₹{dlv.paidAmount.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="font-bold text-rose-400">₹{dlv.remainingDue.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <Badge variant={dlv.status === 'delivered' ? 'success' : 'info'}>
                        {dlv.status === 'delivered' ? 'DISPATCHED' : 'ORDERED'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={dlv.paymentStatus === 'paid' ? 'success' : dlv.paymentStatus === 'partial' ? 'warning' : 'danger'}>
                        {dlv.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {dlv.status === 'ordered' && (
                          <Button
                            onClick={() => handleDispatchDelivery(dlv)}
                            variant="ghost"
                            size="sm"
                            title="Dispatch Delivery (Deduct Stock)"
                            className="text-indigo-400 hover:text-indigo-300"
                          >
                            <Truck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => handleInvoiceOpen(dlv)}
                          variant="ghost"
                          size="sm"
                          title="View & Print Invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteOpen(dlv)}
                          variant="ghost"
                          size="sm"
                          title="Delete Invoice"
                        >
                          <Trash2 className="h-4 w-4 text-rose-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 3. Invoice Creator Modal Dialog */}
      <Dialog
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        title={formMode === 'create' ? "Create Delivery Invoice" : "Dispatch & Review Booked Order"}
        maxWidth="lg"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          
          {/* Toggle to switch modes (Only in dispatch mode) */}
          {formMode === 'dispatch' && (
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-805 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-200">Modify Order Details?</span>
                <span className="text-[10px] text-slate-400">Enable this if you need to adjust quantities, products, discounts, or paid amount before dispatching.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={editDispatchInfo}
                  onChange={(e) => setEditDispatchInfo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
              </label>
            </div>
          )}

          {/* If edit mode is enabled or creating a new invoice, show form inputs */}
          {(formMode === 'create' || editDispatchInfo) ? (
            <>
              {/* Invoice Type Selection Toggle */}
              {formMode === 'create' && (
                <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-200">Invoice Status / Type</span>
                    <span className="text-[10px] text-slate-400">Order Booking records future deliveries. Direct Dispatch immediately updates inventory and accounts.</span>
                  </div>
                  <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setInvoiceStatus('ordered')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        invoiceStatus === 'ordered'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Order Booking (Reserve)
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceStatus('delivered')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        invoiceStatus === 'delivered'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Direct Dispatch (Invoice)
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Shop select */}
                <Select
                  label="Select Retailer Shop *"
                  value={invoiceShopId}
                  disabled={formMode === 'dispatch'}
                  onChange={(e) => setInvoiceShopId(e.target.value)}
                >
                  {shops.map(s => (
                    <option key={s.id} value={s.id} className="bg-slate-900">
                      {s.shopCode ? `[${s.shopCode}] ` : ''}{s.name} (Due: ₹{s.currentDue})
                    </option>
                  ))}
                </Select>

                {/* Invoice Date */}
                <Input
                  label="Delivery Date *"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>

              {/* Line items section */}
              <div className="mt-2.5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider inline-flex items-center gap-1">
                    <ShoppingBag className="h-4 w-4 text-indigo-400" />
                    Line Items
                  </span>
                  <Button onClick={addInvoiceItem} type="button" variant="secondary" size="sm" className="py-1">
                    + Add Item
                  </Button>
                </div>

                <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                  {invoiceItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col md:grid md:grid-cols-12 gap-3 items-end bg-slate-950/20 border border-slate-900 p-3 rounded-lg relative">
                      
                      {/* Product selector */}
                      <div className="w-full md:col-span-4">
                        <Select
                          label={`Item #${idx + 1}`}
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id} className="bg-slate-900" disabled={invoiceStatus === 'delivered' && p.currentStock <= 0}>
                              {p.name} [{p.sku}] (Stock: {p.currentStock} {p.unitType})
                            </option>
                          ))}
                        </Select>
                        {item.productId && (
                          <div className="flex flex-col gap-0.5 mt-1">
                            <span className="text-[9px] text-slate-500 font-bold block">
                              MRP: ₹{(item.mrp || 0).toFixed(2)} | Range: {item.discountRange || '0%'}
                            </span>
                            {(() => {
                              const prod = products.find(p => p.id === item.productId);
                              const gstPercent = prod ? (prod.gstPercent || 0) : 0;
                              const itemTotal = item.price * (parseInt(item.quantity) || 0);
                              const itemGst = itemTotal * (gstPercent / (100 + gstPercent));
                              return (
                                <span className="text-[9px] text-indigo-400 font-bold block">
                                  GST Included: {gstPercent}% (₹{itemGst.toFixed(2)})
                                </span>
                              );
                            })()}
                            <span className={`text-[10px] font-bold block ${
                              item.currentStock <= 0 
                                ? 'text-rose-400' 
                                : item.currentStock <= 5 
                                  ? 'text-amber-400' 
                                  : 'text-emerald-400'
                            }`}>
                              Stock in Hand: {item.currentStock} units
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Discount Type */}
                      <div className="w-full md:col-span-2">
                        <Select
                          label="Type"
                          value={item.discountInputType}
                          onChange={(e) => handleItemChange(idx, 'discountInputType', e.target.value)}
                        >
                          <option value="percent" className="bg-slate-900">Discount %</option>
                          <option value="amount" className="bg-slate-900">Discount ₹</option>
                        </Select>
                      </div>

                      {/* Discount Value */}
                      <div className="w-full md:col-span-2">
                        <Input
                          label="Value"
                          type="number"
                          min="0"
                          step="any"
                          value={item.discountVal}
                          onChange={(e) => handleItemChange(idx, 'discountVal', e.target.value)}
                        />
                      </div>

                      {/* Quantity Input */}
                      <div className="w-full md:col-span-2">
                        <Input
                          label="Qty *"
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        />
                      </div>

                      {/* Rate display */}
                      <div className="flex flex-col items-end md:items-start gap-1 pb-2 md:col-span-1">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">Rate</span>
                        <span className="text-sm font-bold text-slate-200" title={`Unit price: ₹${item.price.toFixed(2)}`}>
                          ₹{((parseInt(item.quantity) || 0) * item.price).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Remove line */}
                      <div className="pb-1.5 md:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeInvoiceItem(idx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 cursor-pointer"
                          disabled={invoiceItems.length === 1}
                        >
                          <X className="h-4.5 w-4.5" />
                        </button>
                      </div>

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
              </div>

              {/* Live GST Summary Box */}
              {(() => {
                const formTotalAmount = getInvoiceTotal();
                const formTotalGst = invoiceItems.reduce((sum, item) => {
                  const qty = parseInt(item.quantity) || 0;
                  const prod = products.find(p => p.id === item.productId);
                  const gstPercent = prod ? (prod.gstPercent || 0) : 0;
                  const itemTotal = item.price * qty;
                  const itemGst = itemTotal * (gstPercent / (100 + gstPercent));
                  return sum + itemGst;
                }, 0);
                const formTaxableValue = formTotalAmount - formTotalGst;
                const selectedShop = shops.find(s => s.id === invoiceShopId);
                const formHasGst = !!(selectedShop && selectedShop.gstNumber && selectedShop.gstNumber.trim());
                return (
                  <div className="bg-slate-950/30 p-3 rounded-lg border border-slate-900/60 mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Taxable Base</span>
                      <span className="font-semibold text-slate-200">₹{formTaxableValue.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">GST Extracted (Incl.)</span>
                      <span className="font-semibold text-slate-200">₹{formTotalGst.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">GST Allocation</span>
                      <span className={`font-bold ${formHasGst ? 'text-indigo-400' : 'text-amber-500'}`}>
                        {formHasGst ? `Paid by Shop (GSTIN: ${selectedShop.gstNumber})` : 'Absorbed (My Account - No GSTIN)'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Payment receipt adjustments */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800/80 pt-4 mt-2">
                
                {/* Grand Total display */}
                <div className="flex flex-col justify-center leading-none">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Invoice Total Amount</span>
                  <span className="text-xl font-black text-slate-100 mt-1">₹{getInvoiceTotal().toLocaleString('en-IN')}</span>
                </div>

                {/* Paid amount */}
                <Input
                  label="Paid Amount (INR)"
                  type="number"
                  value={invoicePaidAmount}
                  onChange={(e) => setInvoicePaidAmount(e.target.value)}
                />

                {/* Payment method */}
                <Select
                  label="Payment Method"
                  value={invoicePaymentMethod}
                  disabled={parseFloat(invoicePaidAmount) <= 0}
                  onChange={(e) => setInvoicePaymentMethod(e.target.value)}
                >
                  <option value="CASH" className="bg-slate-900">Cash</option>
                  <option value="UPI" className="bg-slate-900">UPI/QR Code</option>
                  <option value="CARD" className="bg-slate-900">Card Payment</option>
                  <option value="CHEQUE" className="bg-slate-900">Cheque</option>
                  <option value="BANK_TRANSFER" className="bg-slate-900">Bank Transfer</option>
                </Select>

              </div>
            </>
          ) : (
            // Read-Only Summary Mode (Review Order before Dispatch)
            <>
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 text-slate-350">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Retailer / Shop</span>
                  <span className="text-sm font-extrabold text-slate-100">
                    {shops.find(s => s.id === invoiceShopId)?.shopCode ? `[${shops.find(s => s.id === invoiceShopId)?.shopCode}] ` : ''}
                    {shops.find(s => s.id === invoiceShopId)?.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    Area: {shops.find(s => s.id === invoiceShopId)?.area} | Owner: {shops.find(s => s.id === invoiceShopId)?.ownerName}
                  </span>
                </div>
                <div className="flex flex-col gap-1 md:text-right text-slate-350">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Scheduled Delivery Date</span>
                  <span className="text-sm font-bold text-slate-200">
                    {new Date(invoiceDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Items Summary Table */}
              <div className="rounded-lg border border-slate-800/80 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="p-3">Product Details</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">GST %</th>
                      <th className="p-3 text-right">GST Amt</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-center">Stock Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40 text-slate-300">
                    {invoiceItems.map((item, idx) => {
                      const prod = products.find(p => p.id === item.productId);
                      const qty = parseInt(item.quantity) || 0;
                      const hasStock = item.currentStock >= qty;
                      const gstPercent = prod ? (prod.gstPercent || 0) : 0;
                      const itemTotal = item.price * qty;
                      const itemGst = itemTotal * (gstPercent / (100 + gstPercent));
                      return (
                        <tr key={idx} className="hover:bg-slate-900/5">
                          <td className="p-3 font-bold text-slate-200">
                            <div className="flex flex-col">
                              <span>{prod ? prod.name : 'Unknown Product'}</span>
                              <span className="text-[10px] text-slate-500 font-normal">SKU: {prod?.sku || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="p-3 text-right font-bold">{qty}</td>
                          <td className="p-3 text-right">₹{item.price.toFixed(2)}</td>
                          <td className="p-3 text-right text-slate-400">{gstPercent}%</td>
                          <td className="p-3 text-right text-slate-400 font-semibold">₹{itemGst.toFixed(2)}</td>
                          <td className="p-3 text-right font-bold">₹{itemTotal.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              hasStock ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {hasStock ? `Available (${item.currentStock})` : `Shortage (Stock: ${item.currentStock})`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paid / Due Info Card */}
              {(() => {
                const formTotalAmount = getInvoiceTotal();
                const formTotalGst = invoiceItems.reduce((sum, item) => {
                  const qty = parseInt(item.quantity) || 0;
                  const prod = products.find(p => p.id === item.productId);
                  const gstPercent = prod ? (prod.gstPercent || 0) : 0;
                  const itemTotal = item.price * qty;
                  const itemGst = itemTotal * (gstPercent / (100 + gstPercent));
                  return sum + itemGst;
                }, 0);
                const formTaxableValue = formTotalAmount - formTotalGst;
                const selectedShop = shops.find(s => s.id === invoiceShopId);
                const formHasGst = !!(selectedShop && selectedShop.gstNumber && selectedShop.gstNumber.trim());

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-800/80 pt-4 mt-2">
                    <div className="flex flex-col leading-tight">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Invoice Total (Base: ₹{formTaxableValue.toFixed(2)})</span>
                      <span className="text-lg font-black text-slate-100 mt-1">₹{formTotalAmount.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-slate-450 mt-1">GST Total Included: ₹{formTotalGst.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Paid Amount</span>
                      <span className="text-lg font-bold text-emerald-400 mt-1">₹{parseFloat(invoicePaidAmount).toLocaleString('en-IN')} ({invoicePaymentMethod})</span>
                      <span className="text-[10px] text-slate-450 mt-1">
                        GST Allocation: <span className="font-semibold text-slate-200">{formHasGst ? 'Shop' : 'Distributor (Me)'}</span>
                      </span>
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Outstanding Credit Due</span>
                      <span className="text-lg font-black text-rose-450 mt-1">₹{(formTotalAmount - parseFloat(invoicePaidAmount)).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Stock error warning alert */}
              {invoiceItems.some(item => (parseInt(item.quantity) || 0) > item.currentStock) && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-450 p-3 rounded-lg text-[11px] font-semibold flex items-center gap-2 mt-2">
                  <AlertCircle className="h-4.5 w-4.5 text-rose-500 flex-shrink-0" />
                  <span>Cannot dispatch: Insufficient stock in hand for one or more items. Please restock or enable "Modify Order Details" above to adjust quantities.</span>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 mt-4 border-t border-slate-800/80 pt-4">
            <Button onClick={handleCloseForm} type="button" variant="secondary">Cancel</Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={formMode === 'dispatch' && !editDispatchInfo && invoiceItems.some(item => (parseInt(item.quantity) || 0) > item.currentStock)}
            >
              {formMode === 'dispatch' 
                ? (editDispatchInfo ? 'Save Changes & Confirm Dispatch' : 'Confirm Dispatch & Deduct Stock') 
                : invoiceStatus === 'ordered' 
                  ? 'Book & Save Order' 
                  : 'Dispatch & Print Invoice'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 4. Delete Invoice Confirmation */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Invoice Deletion"
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4 text-center py-2">
          <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="font-bold text-slate-200">Remove delivery invoice record?</h4>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete invoice <span className="text-slate-200 font-bold">{selectedDelivery?.deliveryNumber}</span>? 
              This will remove the transaction, subtract the remaining outstanding dues from the shop's account, and restore the delivered product stock counts.
            </p>
          </div>
          <div className="flex justify-center gap-3 mt-4 border-t border-slate-800/80 pt-4">
            <Button onClick={() => setIsDeleteOpen(false)} variant="secondary">Cancel</Button>
            <Button onClick={handleDeleteConfirm} variant="destructive">Remove Invoice</Button>
          </div>
        </div>
      </Dialog>

      {/* 5. Print Invoice Modal Overlay (Only shown on screen for print preview) */}
      <Dialog
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        title="Delivery Invoice Details"
        maxWidth="lg"
      >
        {selectedDelivery && (
          <div className="flex flex-col gap-5">
            
            {/* Invoice template area */}
            <div id="invoice-print-area" className="bg-slate-950/40 p-6 border border-slate-800 rounded-xl flex flex-col gap-5 print-card">
              
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row justify-between border-b border-slate-800 pb-5 gap-4">
                <div className="flex flex-col">
                  <h2 className="text-lg font-black text-slate-100 tracking-wider uppercase">Wholesale Distributors</h2>
                  <span className="text-xs text-slate-500 font-semibold uppercase">Daily Store Deliveries Depot</span>
                  <span className="text-xs text-slate-400 mt-2 font-medium">GSTIN: 29DEPOT1234E1Z3</span>
                </div>
                <div className="flex flex-col sm:text-right">
                  <h3 className="text-sm font-bold text-indigo-400">DELIVERY INVOICE</h3>
                  <span className="text-lg font-mono font-bold text-slate-200 mt-1">{selectedDelivery.deliveryNumber}</span>
                  <span className="text-xs text-slate-400 mt-1.5 font-semibold inline-flex sm:justify-end gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    Date: {new Date(selectedDelivery.deliveryDate).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Bill To Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-850 pb-5 text-xs">
                <div className="flex flex-col gap-1 text-slate-300">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Billed To (Retailer)</span>
                  <span className="text-sm font-extrabold text-slate-200">{selectedDelivery.shop?.name}</span>
                  <span className="inline-flex items-center gap-1 font-semibold"><User className="h-3.5 w-3.5 text-slate-500" />Owner: {selectedDelivery.shop?.ownerName}</span>
                  <span className="inline-flex items-center gap-1 font-semibold"><Phone className="h-3.5 w-3.5 text-slate-500" />Phone: {selectedDelivery.shop?.phone}</span>
                </div>
                <div className="flex flex-col gap-1 text-slate-300 md:text-right">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Delivery Coordinates</span>
                  <span className="font-semibold">{selectedDelivery.shop?.address}</span>
                  <span className="font-semibold">Area: {selectedDelivery.shop?.area}</span>
                  {selectedDelivery.shop?.gstNumber && <span className="font-mono mt-1 text-slate-400">GSTIN: {selectedDelivery.shop?.gstNumber}</span>}
                </div>
              </div>

              {/* Items List Table */}
              <table className="w-full text-xs text-left border-collapse print-table">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-bold">
                    <th className="p-3">Item Details</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">MRP</th>
                    <th className="p-3 text-right">Applied Disc.</th>
                    <th className="p-3 text-right">Price (Incl.)</th>
                    <th className="p-3 text-right">GST %</th>
                    <th className="p-3 text-right">GST Amt</th>
                    <th className="p-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 text-slate-300">
                  {selectedDelivery.items?.map((item) => {
                    const mrp = item.product?.mrp || 0;
                    const price = item.price || 0;
                    const diff = mrp - price;
                    const pct = mrp > 0 ? (diff / mrp) * 100 : 0;
                    return (
                      <tr key={item.id}>
                        <td className="p-3 font-bold text-slate-200">
                          <div className="flex flex-col">
                            <span>{item.product?.name}</span>
                            <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                              Brand: {item.product?.brand} | SKU: {item.product?.sku} | {item.lotSize} pcs / {item.product?.unitType}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-bold">{item.quantity}</td>
                        <td className="p-3 text-right">₹{mrp.toFixed(2)}</td>
                        <td className="p-3 text-right font-semibold text-emerald-400">
                          {mrp > 0 && pct > 0 ? `${pct.toFixed(1)}%` : '0%'}
                        </td>
                        <td className="p-3 text-right">₹{price.toFixed(2)}</td>
                        <td className="p-3 text-right text-slate-400">{item.gstPercent || 0}%</td>
                        <td className="p-3 text-right text-slate-400">₹{(item.gstAmount || 0).toFixed(2)}</td>
                        <td className="p-3 text-right font-black text-slate-200">₹{item.totalAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* GST Breakdown & Grand totals */}
              {(() => {
                const totalAmount = selectedDelivery.totalAmount || 0;
                const totalGst = selectedDelivery.totalGst || 0;
                const taxableBase = totalAmount - totalGst;
                const shopGst = selectedDelivery.gstPaidByShop || 0;
                const myGst = selectedDelivery.gstPaidByMe || 0;

                return (
                  <div className="flex flex-col sm:flex-row justify-between border-t border-slate-800/60 pt-4 mt-2 gap-4 text-xs">
                    <div className="flex flex-col gap-1 text-slate-400 max-w-xs w-full">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">GST Tax Summary</span>
                      <div className="flex justify-between gap-8 border-b border-slate-900 pb-1">
                        <span>Taxable Base Value:</span>
                        <span className="font-semibold text-slate-300">₹{taxableBase.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between gap-8 border-b border-slate-900 pb-1">
                        <span>Total GST Amount (Extracted):</span>
                        <span className="font-semibold text-slate-300">₹{totalGst.toFixed(2)}</span>
                      </div>
                      {shopGst > 0 ? (
                        <div className="flex justify-between gap-8 text-indigo-400 font-bold">
                          <span>Paid by Shop:</span>
                          <span>₹{shopGst.toFixed(2)}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between gap-8 text-amber-500 font-bold">
                          <span>Absorbed (My Account):</span>
                          <span>₹{myGst.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5 w-64 text-slate-300">
                      <div className="flex justify-between w-full">
                        <span className="font-semibold text-slate-400">Invoice Total (Incl. GST):</span>
                        <span className="font-black text-slate-200 text-sm">₹{selectedDelivery.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between w-full text-emerald-400 font-semibold border-b border-slate-800/40 pb-1.5">
                        <span>Amount Paid:</span>
                        <span>-₹{selectedDelivery.paidAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between w-full font-black text-rose-400 text-sm pt-1">
                        <span>Remaining Outstanding Due:</span>
                        <span>₹{selectedDelivery.remainingDue.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Print and close options */}
            <div className="flex justify-end gap-3 mt-4 border-t border-slate-800 pt-4">
              <Button onClick={() => setIsInvoiceOpen(false)} variant="secondary">Close Viewer</Button>
              <Button onClick={handlePrint} variant="primary" className="inline-flex items-center gap-1.5">
                <Printer className="h-4 w-4" />
                Print Invoice (PDF)
              </Button>
            </div>

          </div>
        )}
      </Dialog>

    </div>
  );
};

export default Deliveries;
