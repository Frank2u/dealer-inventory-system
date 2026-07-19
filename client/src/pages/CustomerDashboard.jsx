import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../services/api.js';
import { useToast } from '../components/ui/Toast.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { 
  ShoppingBag, 
  Receipt, 
  IndianRupee, 
  Bell, 
  Truck, 
  Percent, 
  Plus, 
  Minus,
  ClipboardList, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Building
} from 'lucide-react';

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [shop, setShop] = useState(null);
  const [ledger, setLedger] = useState({ deliveries: [], payments: [] });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tab control: 'overview' | 'order' | 'history' | 'payments'
  const [activeTab, setActiveTab] = useState('overview');
  
  // Order intake state
  const [orderItems, setOrderItems] = useState({}); // { [productId]: qty }
  const [orderNotes, setOrderNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);



  const loadData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [shopData, ledgerData, productsData] = await Promise.all([
        api.shops.getById(user.id),
        api.shops.getHistory(user.id),
        api.products.getAll()
      ]);
      setShop(shopData);
      setLedger(ledgerData);
      setProducts(productsData);
      
      // Initialize order quantities to empty
      const initialItems = {};
      productsData.forEach(p => {
        if (p.lots && p.lots.length > 0) {
          p.lots.forEach(lot => {
            initialItems[`${p.id}:${lot.id}`] = 0;
          });
        } else {
          initialItems[`${p.id}:`] = 0;
        }
      });
      setOrderItems(initialItems);
    } catch (err) {
      toast.error('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle order submission
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    // Extract non-zero items
    const itemsToSubmit = Object.entries(orderItems)
      .filter(([_, qty]) => qty > 0)
      .map(([key, qty]) => {
        const parts = key.split(':');
        const productId = parts[0];
        const stockEntryId = parts[1] || null;
        
        const prod = products.find(p => p.id === productId);
        return {
          productId,
          stockEntryId,
          quantity: qty,
          price: prod ? prod.sellingPrice : 0
        };
      });

    if (itemsToSubmit.length === 0) {
      toast.error('Please select at least one product to order');
      return;
    }

    try {
      setSubmittingOrder(true);
      
      const payload = {
        shopId: user.id,
        items: itemsToSubmit,
        paidAmount: 0,
        status: 'ordered',
        notes: orderNotes.trim()
      };

      await api.deliveries.create(payload);
      toast.success('Delivery request submitted successfully! Pending dispatcher approval.');
      
      // Reset quantities
      // Reset quantities
      const resetItems = {};
      products.forEach(p => {
        if (p.lots && p.lots.length > 0) {
          p.lots.forEach(lot => {
            resetItems[`${p.id}:${lot.id}`] = 0;
          });
        } else {
          resetItems[`${p.id}:`] = 0;
        }
      });
      setOrderItems(resetItems);
      setOrderNotes('');
      setActiveTab('history');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to submit order request');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const updateItemQty = (key, change) => {
    const parts = key.split(':');
    const prodId = parts[0];
    const lotId = parts[1];

    const prod = products.find(p => p.id === prodId);
    let maxStock = prod ? prod.currentStock : 9999;
    if (lotId && prod) {
      const lot = prod.lots?.find(l => l.id === lotId);
      if (lot) maxStock = lot.remainingStock;
    }

    setOrderItems(prev => {
      const current = prev[key] || 0;
      const next = Math.min(maxStock, Math.max(0, current + change));
      return { ...prev, [key]: next };
    });
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500 font-semibold animate-pulse">
        Syncing with Distributor Ledger...
      </div>
    );
  }

  // Calculate Metrics
  const pendingDeliveriesCount = ledger.deliveries.filter(d => d.status === 'ordered').length;
  
  // GST breakdown for delivered invoices
  const deliveredInvoices = ledger.deliveries.filter(d => d.status === 'delivered');
  const gstClaimed = deliveredInvoices.reduce((sum, d) => sum + d.gstPaidByShop, 0);
  const gstAbsorbed = deliveredInvoices.reduce((sum, d) => sum + d.gstPaidByMe, 0);

  // Compute total order request cost
  const totalRequestCost = Object.entries(orderItems).reduce((sum, [prodId, qty]) => {
    const prod = products.find(p => p.id === prodId);
    return sum + (prod ? prod.sellingPrice * qty : 0);
  }, 0);

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-in text-slate-200">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/30 p-5 rounded-2xl border border-slate-900">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Welcome, <span className="text-indigo-400">{shop?.name || user?.name}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5" /> Shop Code: {shop?.shopCode} | Area: {shop?.area}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Credit Limit</span>
          <span className="text-sm font-black text-slate-200">₹{(shop?.creditLimit || 0).toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Dues */}
        <Card className="glassmorphism border-slate-900">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Outstanding Due</span>
              <span className={`text-lg font-black ${shop?.currentDue > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                ₹{(shop?.currentDue || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Pending Deliveries */}
        <Card className="glassmorphism border-slate-900">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Pending Deliveries</span>
              <span className="text-lg font-black text-slate-200">{pendingDeliveriesCount} requests</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: GST Claimed */}
        <Card className="glassmorphism border-slate-900">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">GST Paid (Claimable)</span>
              <span className="text-lg font-black text-emerald-400">₹{gstClaimed.toLocaleString('en-IN')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: GST Absorbed */}
        <Card className="glassmorphism border-slate-900">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">GST Absorbed (By Me)</span>
              <span className="text-lg font-black text-indigo-400">₹{gstAbsorbed.toLocaleString('en-IN')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-900 gap-1.5">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold tracking-wide border-b-2 transition-all ${
            activeTab === 'overview' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Replenishment Ledger
        </button>
        <button
          onClick={() => setActiveTab('order')}
          className={`px-4 py-2 text-xs font-bold tracking-wide border-b-2 transition-all ${
            activeTab === 'order' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Place Stock Order
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs font-bold tracking-wide border-b-2 transition-all ${
            activeTab === 'history' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Order Requests Log ({ledger.deliveries.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 text-xs font-bold tracking-wide border-b-2 transition-all ${
            activeTab === 'payments' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Payment Collections
        </button>
      </div>

      {/* Tab Panels */}
      
      {/* 1. Replenishment Ledger Tab */}
      {activeTab === 'overview' && (
        <Card className="border-slate-900 bg-slate-950/20">
          <CardContent className="p-0">
            {deliveredInvoices.length === 0 ? (
              <div className="p-10 text-center text-slate-500 font-semibold">No stock replenishments completed yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Total Bill</TableHead>
                    <TableHead>Paid Portion</TableHead>
                    <TableHead>Remaining Due</TableHead>
                    <TableHead>GST Breakdown</TableHead>
                    <TableHead>Billing Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveredInvoices.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs font-bold text-indigo-400">{d.deliveryNumber}</TableCell>
                      <TableCell className="font-semibold text-slate-400">
                        {new Date(d.deliveryDate).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="font-bold text-slate-200">₹{d.totalAmount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-emerald-450 font-semibold">₹{d.paidAmount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="font-bold text-rose-400">₹{d.remainingDue.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-col text-[11px] leading-tight text-slate-400">
                          <span>Total Tax: ₹{d.totalGst.toFixed(2)}</span>
                          {d.gstPaidByShop > 0 ? (
                            <span className="text-emerald-500 font-medium">Claimable: ₹{d.gstPaidByShop.toFixed(2)}</span>
                          ) : (
                            <span className="text-indigo-400">Absorbed: ₹{d.gstPaidByMe.toFixed(2)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={d.paymentStatus === 'paid' ? 'success' : d.paymentStatus === 'partial' ? 'warning' : 'danger'}>
                          {d.paymentStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* 2. Place Order Tab */}
      {activeTab === 'order' && (
        <form onSubmit={handlePlaceOrder} className="flex flex-col gap-4">
          <Card className="border-slate-900 bg-slate-950/20">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Supplier / Brand</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Available Stock</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>GST Value</TableHead>
                    <TableHead>Order Quantity</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const rows = [];
                    products.forEach(prod => {
                      if (prod.lots && prod.lots.length > 0) {
                        prod.lots.forEach(lot => {
                          rows.push({
                            product: prod,
                            lot: lot,
                            key: `${prod.id}:${lot.id}`
                          });
                        });
                      } else {
                        rows.push({
                          product: prod,
                          lot: null,
                          key: `${prod.id}:`
                        });
                      }
                    });

                    if (rows.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center p-6 text-slate-500 font-semibold">
                            No products available in catalog.
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return rows.map((row) => {
                      const prod = row.product;
                      const lot = row.lot;
                      const qty = orderItems[row.key] || 0;

                      return (
                        <TableRow key={row.key}>
                          <TableCell className="font-bold text-slate-200">
                            <div className="flex flex-col gap-0.5">
                              <span>{prod.name}</span>
                              <span className="text-[10px] text-slate-500 font-semibold uppercase">{prod.unitType} packing (Lot Size: {prod.lotSize})</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-350 font-semibold">
                            <div className="flex flex-col leading-tight">
                              <span className="text-slate-200 text-xs">{prod.supplier?.name || 'Unknown'}</span>
                              <span className="text-[9px] text-slate-500 font-medium">{prod.brand}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-slate-400">
                            {lot && lot.expiryDate ? (
                              <span className="text-amber-400">{new Date(lot.expiryDate).toLocaleDateString('en-IN')}</span>
                            ) : (
                              <span className="text-slate-500 font-normal">No Expiry</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-slate-400">
                            {lot ? (
                              <span className={lot.remainingStock <= 5 ? 'text-amber-400' : 'text-slate-300'}>
                                {lot.remainingStock} pcs
                              </span>
                            ) : (
                              <span className={prod.currentStock <= 5 ? 'text-amber-400' : 'text-slate-300'}>
                                {prod.currentStock} pcs
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-bold text-slate-200">₹{prod.sellingPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-xs">
                            {(() => {
                              const itemTotal = prod.sellingPrice * qty;
                              const gstVal = itemTotal * (prod.gstPercent / (100 + prod.gstPercent));
                              return (
                                <div className="flex flex-col leading-tight">
                                  {prod.gstPercent > 0 ? (
                                    <Badge variant="info" className="text-[8px] px-1 py-0 tracking-wider w-fit font-bold">{prod.gstPercent}% GST</Badge>
                                  ) : (
                                    <span className="text-[9px] text-slate-500 uppercase font-semibold">No GST</span>
                                  )}
                                  {qty > 0 && prod.gstPercent > 0 && (
                                    <span className="text-[9px] text-indigo-400 font-bold mt-0.5">₹{gstVal.toFixed(2)}</span>
                                  )}
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateItemQty(row.key, -1)}
                                className="h-7 w-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-800 cursor-pointer"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-8 text-center text-xs font-bold text-slate-100">{qty}</span>
                              <button
                                type="button"
                                onClick={() => updateItemQty(row.key, 1)}
                                className="h-7 w-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-800 cursor-pointer"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold text-indigo-400">
                            ₹{(prod.sellingPrice * qty).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mt-2">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-450 mb-1.5 block">Delivery Instructions / Remarks</label>
              <textarea
                className="w-full bg-slate-900/60 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[45px] transition-all"
                placeholder="Preferred delivery slot, drop-off location instructions, etc."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col gap-3 items-end">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Estimated Total Order Value</span>
                <span className="text-lg font-black text-slate-200">₹{totalRequestCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              
              <Button
                type="submit"
                variant="primary"
                className="w-full bg-emerald-600 hover:bg-emerald-500 border-none shadow-lg shadow-emerald-600/10 py-2 inline-flex items-center justify-center gap-1.5"
                loading={submittingOrder}
                disabled={totalRequestCost === 0}
              >
                <ShoppingBag className="h-4 w-4" />
                Submit Order Request
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* 3. Order Requests Log Tab */}
      {activeTab === 'history' && (
        <Card className="border-slate-900 bg-slate-950/20">
          <CardContent className="p-0">
            {ledger.deliveries.length === 0 ? (
              <div className="p-10 text-center text-slate-500 font-semibold">No order requests placed yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice / Request #</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Items Count</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Delivery Status</TableHead>
                    <TableHead>Payment Dues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.deliveries.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs font-bold text-indigo-400">
                        {d.deliveryNumber}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-400">
                        {new Date(d.deliveryDate).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-300">
                        {d.items?.length || 0} items
                      </TableCell>
                      <TableCell className="font-bold text-slate-200">
                        ₹{d.totalAmount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={d.status === 'delivered' ? 'success' : 'warning'} className="capitalize font-bold">
                          {d.status === 'delivered' ? 'Delivered' : 'Pending Approval / Dispatch'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-slate-400">
                        {d.status === 'delivered' ? (
                          d.remainingDue > 0 ? (
                            <span className="text-rose-400">₹{d.remainingDue.toLocaleString('en-IN')} outstanding</span>
                          ) : (
                            <span className="text-emerald-500 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Fully Paid</span>
                          )
                        ) : (
                          <span className="text-slate-500 italic">Not yet invoiced</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* 4. Payment Collections Tab */}
      {activeTab === 'payments' && (
        <Card className="border-slate-900 bg-slate-950/20">
          <CardContent className="p-0">
            {ledger.payments.length === 0 ? (
              <div className="p-10 text-center text-slate-500 font-semibold">No payments collected from this shop yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Collection Date</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Linked Bill Invoice</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right">Amount Collected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-semibold text-slate-400">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <Badge className="font-bold tracking-wider">{p.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-indigo-400 font-bold">
                        {p.delivery?.deliveryNumber || 'On Account Balance'}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs italic max-w-xs truncate" title={p.notes}>
                        {p.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right font-black text-emerald-400">
                        ₹{p.paidAmount.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}



    </div>
  );
};

export default CustomerDashboard;
