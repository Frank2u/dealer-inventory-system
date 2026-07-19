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
import { Plus, Trash2, IndianRupee, CreditCard, Landmark, Check } from 'lucide-react';

export const Payments = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterShopId, setFilterShopId] = useState('');

  // Modals state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

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

  const handleCreateOpen = () => {
    navigate('/payments/new');
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
            <div className="overflow-x-auto w-full">
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
            </div>
          )}
        </CardContent>
      </Card>

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
