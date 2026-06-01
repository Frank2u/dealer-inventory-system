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
import { Plus, Trash2, IndianRupee, CreditCard, Landmark, Check } from 'lucide-react';

export const Payments = () => {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [shops, setShops] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterShopId, setFilterShopId] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form fields
  const [formShopId, setFormShopId] = useState('');
  const [formDeliveryIds, setFormDeliveryIds] = useState([]);
  const [formPaidAmount, setFormPaidAmount] = useState('');
  const [formPaymentDate, setFormPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState('CASH');
  const [formNotes, setFormNotes] = useState('');

  const loadData = async () => {
    try {
      const [pts, shps] = await Promise.all([
        api.payments.getAll(filterShopId),
        api.shops.getAll()
      ]);
      setPayments(pts);
      setShops(shps);
    } catch (err) {
      toast.error('Failed to load collections registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterShopId]);

  // Load unpaid invoices when shop is selected in Form
  useEffect(() => {
    const fetchUnpaid = async () => {
      if (!formShopId) {
        setUnpaidInvoices([]);
        return;
      }
      try {
        const dlvs = await api.deliveries.getAll(formShopId);
        // Filter out fully paid invoices
        const unpaid = dlvs.filter(d => d.remainingDue > 0);
        setUnpaidInvoices(unpaid);
      } catch (err) {
        console.error('Failed to load unpaid invoices for shop:', err);
      }
    };
    fetchUnpaid();
  }, [formShopId, refreshTrigger]);

  const handleCreateOpen = () => {
    if (shops.length === 0) {
      toast.error('Please register retail shops first');
      return;
    }
    setFormShopId(shops[0].id);
    setFormDeliveryIds([]);
    setFormPaidAmount('');
    setFormPaymentDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMethod('CASH');
    setFormNotes('');
    setIsFormOpen(true);
  };

  // Toggle invoice selection and update total sum
  const handleToggleInvoiceSelection = (dlvId) => {
    setFormDeliveryIds(prev => {
      const next = prev.includes(dlvId)
        ? prev.filter(id => id !== dlvId)
        : [...prev, dlvId];
      
      // Calculate sum and set paid amount
      const sum = unpaidInvoices
        .filter(d => next.includes(d.id))
        .reduce((total, d) => total + d.remainingDue, 0);
      setFormPaidAmount(sum > 0 ? String(sum) : '');
      return next;
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formShopId || !formPaidAmount) {
      toast.error('Please fill in Shop and Payment Amount');
      return;
    }

    const amount = parseFloat(formPaidAmount);
    if (amount <= 0) {
      toast.error('Payment amount must be greater than zero');
      return;
    }

    // Validate specific invoice limit
    if (formDeliveryIds.length > 0) {
      const totalSelectedDue = unpaidInvoices
        .filter(d => formDeliveryIds.includes(d.id))
        .reduce((sum, d) => sum + d.remainingDue, 0);
      if (amount > totalSelectedDue) {
        toast.error(`Payment exceeds the selected invoices due amount of ₹${totalSelectedDue}`);
        return;
      }
    }

    try {
      await api.payments.create({
        shopId: formShopId,
        deliveryIds: formDeliveryIds,
        paidAmount: amount,
        paymentDate: formPaymentDate,
        paymentMethod: formPaymentMethod,
        notes: formNotes
      });
      toast.success('Collection logged. Outstanding balance reduced!');
      setIsFormOpen(false);
      setRefreshTrigger(prev => prev + 1);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Payment submission failed');
    }
  };

  const handleDeleteOpen = (pt) => {
    setSelectedPayment(pt);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.payments.delete(selectedPayment.id);
      toast.success('Payment deleted. Outstanding balances reverted.');
      setIsDeleteOpen(false);
      setRefreshTrigger(prev => prev + 1);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Payment deletion failed');
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-in">
      
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Filter shop selector */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <select
            className="bg-slate-950/20 border border-slate-900 text-xs font-semibold text-slate-400 rounded-lg px-3 py-2.5 outline-none cursor-pointer hover:border-slate-800"
            value={filterShopId}
            onChange={(e) => setFilterShopId(e.target.value)}
          >
            <option value="">All Retail Shops</option>
            {shops.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Trigger Payment Collection */}
        <Button onClick={handleCreateOpen} variant="primary" className="py-2 inline-flex items-center gap-1.5">
          <Plus className="h-4 w-4" />
          Log Payment Collection
        </Button>
      </div>

      {/* Payments history table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-slate-500 font-semibold animate-pulse">Loading collections registry...</div>
          ) : payments.length === 0 ? (
            <div className="p-10 text-center text-slate-500 font-semibold">No payment collections logged</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collection Date</TableHead>
                  <TableHead>Retail Shop</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Linked Invoices</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Amount Collected</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((pt) => {
                  const icons = {
                    CASH: <IndianRupee className="h-3 w-3 text-emerald-400" />,
                    UPI: <Check className="h-3 w-3 text-indigo-400" />,
                    CARD: <CreditCard className="h-3 w-3 text-cyan-400" />,
                    CHEQUE: <Landmark className="h-3 w-3 text-amber-400" />,
                    BANK_TRANSFER: <Landmark className="h-3 w-3 text-blue-450" />
                  };

                  return (
                    <TableRow key={pt.id}>
                      <TableCell className="font-semibold text-slate-400">
                        {new Date(pt.paymentDate).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="font-bold text-slate-200">{pt.shop?.name}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="inline-flex items-center gap-1.5 normal-case">
                          {icons[pt.paymentMethod]}
                          <span>{pt.paymentMethod.replace('_', ' ')}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-indigo-400 text-xs">
                        {pt.deliveryNumbers?.length > 0 ? pt.deliveryNumbers.join(', ') : <span className="text-slate-500 font-semibold normal-case">On Account</span>}
                      </TableCell>
                      <TableCell className="text-xs text-slate-550 truncate max-w-xs font-semibold">
                        {pt.notes || '-'}
                      </TableCell>
                      <TableCell className="font-bold text-emerald-400 text-sm">
                        +₹{pt.paidAmount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleDeleteOpen(pt)}
                          variant="ghost"
                          size="sm"
                          title="Delete Collection"
                        >
                          <Trash2 className="h-4 w-4 text-rose-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 3. Log Collection Modal Dialog */}
      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Log Payment Collection"
        maxWidth="md"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Shop select */}
            <div className="md:col-span-2">
              <Select
                label="Select Retailer Shop *"
                value={formShopId}
                onChange={(e) => {
                  setFormShopId(e.target.value);
                  setFormDeliveryIds([]);
                  setFormPaidAmount('');
                }}
              >
                {shops.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-900">
                    {s.name} (Due: ₹{s.currentDue})
                  </option>
                ))}
              </Select>
            </div>

            {/* Shop Details & Unpaid Delivery Invoices List */}
            {(() => {
              const selectedShopObj = shops.find(s => s.id === formShopId);
              if (!selectedShopObj) return null;
              return (
                <div className="md:col-span-2 bg-slate-950/40 p-4 border border-slate-900/80 rounded-xl flex flex-col gap-3 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/60 pb-2.5 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Retailer Account Summary</span>
                      <span className="text-sm font-extrabold text-slate-200">{selectedShopObj.name}</span>
                    </div>
                    <div className="flex flex-col sm:text-right">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Pending Due</span>
                      <span className="text-lg font-black text-rose-400">₹{selectedShopObj.currentDue.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400 font-medium">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Owner</span>
                      <span className="text-slate-350 font-semibold">{selectedShopObj.ownerName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Phone</span>
                      <span className="text-slate-355 font-semibold">{selectedShopObj.phone}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Area/Location</span>
                      <span className="text-slate-355 font-semibold">{selectedShopObj.area}</span>
                    </div>
                  </div>

                  {/* Pending Invoices List */}
                  <div className="mt-2.5">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-1.5">Unpaid or Partially Paid Invoices ({unpaidInvoices.length})</span>
                    {unpaidInvoices.length === 0 ? (
                      <p className="text-xs text-slate-500 font-semibold italic bg-slate-950/20 p-2.5 rounded border border-slate-900">No outstanding invoices for this retailer.</p>
                    ) : (
                      <div className="max-h-[160px] overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/30">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                            <tr>
                              <th className="p-2 text-center w-10">
                                <input
                                  type="checkbox"
                                  checked={unpaidInvoices.length > 0 && formDeliveryIds.length === unpaidInvoices.length}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const allIds = unpaidInvoices.map(d => d.id);
                                      setFormDeliveryIds(allIds);
                                      const sum = unpaidInvoices.reduce((total, d) => total + d.remainingDue, 0);
                                      setFormPaidAmount(String(sum));
                                    } else {
                                      setFormDeliveryIds([]);
                                      setFormPaidAmount('');
                                    }
                                  }}
                                  className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                                />
                              </th>
                              <th className="p-2">Invoice #</th>
                              <th className="p-2">Date</th>
                              <th className="p-2 text-right">Total</th>
                              <th className="p-2 text-right">Pending</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900/40 text-slate-300">
                            {unpaidInvoices.map((d) => {
                              const isSelected = formDeliveryIds.includes(d.id);
                              return (
                                <tr
                                  key={d.id}
                                  onClick={() => handleToggleInvoiceSelection(d.id)}
                                  className={`hover:bg-slate-850/20 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-500/10' : ''}`}
                                >
                                  <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleInvoiceSelection(d.id)}
                                      className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-2 font-bold text-slate-200">{d.deliveryNumber}</td>
                                  <td className="p-2 text-slate-400 font-semibold">{new Date(d.deliveryDate).toLocaleDateString('en-IN')}</td>
                                  <td className="p-2 text-right font-semibold">₹{d.totalAmount.toLocaleString('en-IN')}</td>
                                  <td className="p-2 text-right font-bold text-rose-400">₹{d.remainingDue.toLocaleString('en-IN')}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Selected count and sum summary */}
                  {formDeliveryIds.length > 0 && (
                    <div className="flex justify-between items-center bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-lg text-xs font-bold text-indigo-400 mt-2">
                      <span>Selected: {formDeliveryIds.length} of {unpaidInvoices.length} Invoices</span>
                      <span>Total Amount Selected: ₹{unpaidInvoices.filter(d => formDeliveryIds.includes(d.id)).reduce((sum, d) => sum + d.remainingDue, 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Paid Amount */}
            <Input
              label="Payment Amount Collected (INR) *"
              type="number"
              placeholder="e.g. 5000"
              value={formPaidAmount}
              onChange={(e) => setFormPaidAmount(e.target.value)}
            />

            {/* Payment date */}
            <Input
              label="Collection Date *"
              type="date"
              value={formPaymentDate}
              onChange={(e) => setFormPaymentDate(e.target.value)}
            />

            {/* Payment method */}
            <div className="md:col-span-2">
              <Select
                label="Payment Method *"
                value={formPaymentMethod}
                onChange={(e) => setFormPaymentMethod(e.target.value)}
              >
                <option value="CASH" className="bg-slate-900">Cash</option>
                <option value="UPI" className="bg-slate-900">UPI/QR Code Scan</option>
                <option value="CARD" className="bg-slate-900">Credit/Debit Card</option>
                <option value="CHEQUE" className="bg-slate-900">Bank Cheque</option>
                <option value="BANK_TRANSFER" className="bg-slate-900">Direct Bank Transfer</option>
              </Select>
            </div>

            {/* Notes */}
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Collection Notes / Reference Details</label>
              <textarea
                className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                placeholder="Cheque #44102. Deposited on Friday. UPI Ref: 9912048."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

          </div>
          <div className="flex justify-end gap-3 mt-4 border-t border-slate-800/80 pt-4">
            <Button onClick={() => setIsFormOpen(false)} variant="secondary">Cancel</Button>
            <Button type="submit" variant="primary">Log Collection</Button>
          </div>
        </form>
      </Dialog>

      {/* 4. Delete Payment Confirmation */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Payment Deletion"
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4 text-center py-2">
          <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="font-bold text-slate-200">Revert payment collection?</h4>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete this payment of <span className="text-emerald-400 font-bold">₹{selectedPayment?.paidAmount?.toLocaleString('en-IN')}</span> from <span className="text-slate-200 font-bold">{selectedPayment?.shop?.name}</span>? 
              This will increase the outstanding credit balance on the customer account and revert the linked invoice balances.
            </p>
          </div>
          <div className="flex justify-center gap-3 mt-4 border-t border-slate-800/80 pt-4">
            <Button onClick={() => setIsDeleteOpen(false)} variant="secondary">Cancel</Button>
            <Button onClick={handleDeleteConfirm} variant="destructive">Revert Payment</Button>
          </div>
        </div>
      </Dialog>

    </div>
  );
};

export default Payments;
