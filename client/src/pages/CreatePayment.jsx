import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { ArrowLeft, Save, IndianRupee } from 'lucide-react';
import { useToast } from '../components/ui/Toast.jsx';
import { api } from '../services/api.js';

export default function CreatePayment() {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Mappings
  const [shops, setShops] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);

  // Form states
  const [formShopId, setFormShopId] = useState('');
  const [formDeliveryIds, setFormDeliveryIds] = useState([]);
  const [formPaidAmount, setFormPaidAmount] = useState('');
  const [formPaymentDate, setFormPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState('CASH');
  const [formNotes, setFormNotes] = useState('');

  // Fetch shops dependencies
  useEffect(() => {
    const loadShops = async () => {
      try {
        setLoading(true);
        const data = await api.shops.getAll();
        setShops(data);
        if (data.length > 0) {
          setFormShopId(data[0].id);
        } else {
          toast.error('Please register retail shops first');
        }
      } catch (err) {
        toast.error('Failed to load retail shops list');
      } finally {
        setLoading(false);
      }
    };
    loadShops();
  }, []);

  // Fetch unpaid invoices when shop is selected
  useEffect(() => {
    const fetchUnpaid = async () => {
      if (!formShopId) {
        setUnpaidInvoices([]);
        return;
      }
      try {
        const dlvs = await api.deliveries.getAll(formShopId);
        const unpaid = dlvs.filter(d => d.remainingDue > 0);
        setUnpaidInvoices(unpaid);
      } catch (err) {
        console.error('Failed to load unpaid invoices for shop:', err);
      }
    };
    fetchUnpaid();
  }, [formShopId]);

  // Toggle invoice selection
  const handleToggleInvoiceSelection = (dlvId) => {
    setFormDeliveryIds(prev => {
      const next = prev.includes(dlvId)
        ? prev.filter(id => id !== dlvId)
        : [...prev, dlvId];
      
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
      setSubmitting(true);
      await api.payments.create({
        shopId: formShopId,
        deliveryIds: formDeliveryIds,
        paidAmount: amount,
        paymentDate: formPaymentDate,
        paymentMethod: formPaymentMethod,
        notes: formNotes
      });
      toast.success('Collection logged. Outstanding balance reduced!');
      navigate('/payments');
    } catch (err) {
      toast.error(err.message || 'Payment submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedShopObj = shops.find(s => s.id === formShopId);
  const totalSelectedDue = unpaidInvoices
    .filter(d => formDeliveryIds.includes(d.id))
    .reduce((sum, d) => sum + d.remainingDue, 0);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center text-slate-500 font-bold min-h-[400px] animate-pulse">
        Loading payment collection params...
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-4 animate-fade-in text-slate-200">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 select-none">
        <span className="hover:text-white cursor-pointer transition-colors font-semibold" onClick={() => navigate('/payments')}>
          Collections Ledger
        </span>
        <span>/</span>
        <span className="text-indigo-400 font-bold">Log Payment Collection</span>
      </div>

      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/payments')}
            className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-850 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-base font-extrabold text-slate-200 tracking-tight">
            Log New Payment Collection
          </h2>
        </div>
      </div>

      <form onSubmit={handleFormSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <div className="lg:col-span-8 flex flex-col gap-6">
            <Card className="border-slate-900 bg-slate-950/20">
              <CardContent className="p-6 flex flex-col gap-6">
                
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider inline-flex items-center gap-1.5 border-b border-slate-900 pb-2">
                  <IndianRupee className="h-4 w-4" />
                  Select Retail Shop & Invoices
                </span>

                <div className="flex flex-col gap-4">
                  
                  {/* Select Retail Shop */}
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

                  {/* Shop Information & Ledger List */}
                  {selectedShopObj && (
                    <div className="bg-slate-950/40 p-4 border border-slate-900/80 rounded-xl flex flex-col gap-4">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/60 pb-2.5 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Retailer Account</span>
                          <span className="text-sm font-extrabold text-slate-200">{selectedShopObj.name}</span>
                        </div>
                        <div className="flex flex-col sm:text-right">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Outstanding Due Balance</span>
                          <span className="text-base font-black text-rose-450">₹{selectedShopObj.currentDue.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400 font-medium">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Owner</span>
                          <span className="text-slate-300 font-semibold">{selectedShopObj.ownerName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Phone</span>
                          <span className="text-slate-300 font-semibold">{selectedShopObj.phone}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Area/Location</span>
                          <span className="text-slate-300 font-semibold">{selectedShopObj.area}</span>
                        </div>
                      </div>

                      {/* Pending Invoices List */}
                      <div className="mt-2">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-2">
                          Unpaid or Partially Paid Invoices ({unpaidInvoices.length})
                        </span>
                        {unpaidInvoices.length === 0 ? (
                          <p className="text-xs text-slate-500 font-semibold italic bg-slate-950/20 p-2.5 rounded border border-slate-900">
                            No outstanding invoices for this retailer.
                          </p>
                        ) : (
                          <div className="max-h-[220px] overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/30">
                            <table className="w-full text-xs text-left border-collapse">
                              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                                <tr>
                                  <th className="p-3.5 text-center w-10">
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
                                      className="rounded border-slate-850 bg-slate-900 text-indigo-650 focus:ring-0 h-4 w-4 cursor-pointer"
                                    />
                                  </th>
                                  <th className="p-3.5">Invoice #</th>
                                  <th className="p-3.5">Date</th>
                                  <th className="p-3.5 text-right">Total Amount</th>
                                  <th className="p-3.5 text-right text-rose-400">Remaining Due</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-900/45 text-slate-300">
                                {unpaidInvoices.map((d) => {
                                  const isSelected = formDeliveryIds.includes(d.id);
                                  return (
                                    <tr
                                      key={d.id}
                                      onClick={() => handleToggleInvoiceSelection(d.id)}
                                      className={`hover:bg-slate-850/25 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-500/5' : ''}`}
                                    >
                                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => handleToggleInvoiceSelection(d.id)}
                                          className="rounded border-slate-850 bg-slate-900 text-indigo-600 focus:ring-0 h-4 w-4 cursor-pointer"
                                        />
                                      </td>
                                      <td className="p-3 font-bold text-slate-200">{d.deliveryNumber}</td>
                                      <td className="p-3 text-slate-400 font-semibold">{new Date(d.deliveryDate).toLocaleDateString('en-IN')}</td>
                                      <td className="p-3 text-right font-semibold">₹{d.totalAmount.toLocaleString('en-IN')}</td>
                                      <td className="p-3 text-right font-bold text-rose-455 text-rose-400">₹{d.remainingDue.toLocaleString('en-IN')}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                </div>

              </CardContent>
            </Card>
          </div>

          {/* Right/Sidebar collection configuration panel */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <Card className="border-slate-900 bg-slate-950/20">
              <CardContent className="p-4 flex flex-col gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collection Config</span>

                {/* Paid Amount */}
                <Input
                  label="Payment Amount Collected (INR) *"
                  type="number"
                  placeholder="e.g. 5000"
                  value={formPaidAmount}
                  onChange={(e) => setFormPaidAmount(e.target.value)}
                />

                {/* Selected due helper */}
                {formDeliveryIds.length > 0 && (
                  <div className="flex flex-col gap-1 bg-indigo-550/10 bg-indigo-500/5 border border-indigo-500/10 p-2.5 rounded-lg text-[10px] font-bold text-indigo-400">
                    <span>Selected: {formDeliveryIds.length} Invoices</span>
                    <span>Max Due Limit: ₹{totalSelectedDue.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Collection Date */}
                <Input
                  label="Collection Date *"
                  type="date"
                  value={formPaymentDate}
                  onChange={(e) => setFormPaymentDate(e.target.value)}
                />

                {/* Payment Method */}
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

                {/* Notes */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Ref / Notes</label>
                  <textarea
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[70px] transition-all"
                    placeholder="Cheque #44102. UPI Ref: 9912048."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                  />
                </div>

                <div className="border-t border-slate-900 pt-3 mt-1 flex flex-col gap-2">
                  <Button type="submit" variant="primary" loading={submitting} className="w-full inline-flex items-center justify-center gap-1.5 font-bold py-2">
                    <Save className="h-4.5 w-4.5" />
                    Log Collection
                  </Button>
                  <Button onClick={() => navigate('/payments')} type="button" variant="secondary" className="w-full">
                    Cancel
                  </Button>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>
      </form>

    </div>
  );
}
