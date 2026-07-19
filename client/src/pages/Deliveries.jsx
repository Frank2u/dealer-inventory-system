import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const loadData = async () => {
    try {
      const [dlvs, shps] = await Promise.all([
        api.deliveries.getAll(selectedShopId, paymentStatusFilter, stageFilter, dateFilter),
        api.shops.getAll()
      ]);
      setDeliveries(dlvs);
      setShops(shps);
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
    if (dispatchIdParam && deliveries.length > 0) {
      const dlv = deliveries.find(d => d.id === dispatchIdParam);
      if (dlv && dlv.status === 'ordered') {
        navigate(`/deliveries/${dlv.id}/dispatch`);
      }
    }
  }, [dispatchIdParam, deliveries]);

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
        <Button onClick={() => navigate('/deliveries/new')} variant="primary" className="py-2 inline-flex items-center gap-1.5">
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
            <div className="overflow-x-auto w-full">
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
                              onClick={() => navigate(`/deliveries/${dlv.id}/dispatch`)}
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
            </div>
          )}
        </CardContent>
      </Card>

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
