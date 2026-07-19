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
import { Plus, Import, Trash2, Calendar, ClipboardList } from 'lucide-react';

export const Stocks = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const loadData = async () => {
    try {
      const [stockLogs, suppliersList] = await Promise.all([
        api.stock.getAll(),
        api.suppliers.getAll()
      ]);
      setEntries(stockLogs);
      setSuppliers(suppliersList);
    } catch (err) {
      toast.error('Failed to load stocks and suppliers data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOpen = () => {
    navigate('/stocks/new');
  };

  const handleDeleteOpen = (entry) => {
    setSelectedEntry(entry);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.stock.delete(selectedEntry.id);
      toast.success('Stock entry deleted and stock reverted');
      setIsDeleteOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-in text-slate-200">
      
      {/* Header action */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Stock replenishment records</h2>
        <Button onClick={handleCreateOpen} variant="primary" className="py-2 inline-flex items-center gap-1.5">
          <Plus className="h-4 w-4" />
          Add Stocks
        </Button>
      </div>

      {/* Stock logs table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-slate-500 font-semibold animate-pulse">Loading stock records...</div>
          ) : entries.length === 0 ? (
            <div className="p-10 text-center text-slate-500 font-semibold">No stock intake recorded yet</div>
          ) : (
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rep Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Supplier Inv #</TableHead>
                    <TableHead>Product Received</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-semibold text-slate-400">
                        {new Date(entry.date).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="font-bold text-slate-200">
                        <div>
                          {entry.supplier?.name || 'Unknown'}
                          {entry.notes && <p className="text-[10px] text-slate-500 font-medium truncate max-w-xs">{entry.notes}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{entry.invoiceNumber}</TableCell>
                      <TableCell className="font-semibold text-slate-300">
                        {entry.product?.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-indigo-400">{entry.product?.sku}</TableCell>
                      <TableCell className="font-bold text-emerald-400">+{entry.quantity} {entry.product?.unitType || 'pcs'}</TableCell>
                      <TableCell className="font-semibold text-slate-400">₹{entry.costPrice.toFixed(2)}</TableCell>
                      <TableCell className="font-bold text-slate-200">₹{(entry.quantity * entry.costPrice).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-xs text-slate-500 font-semibold">
                        {entry.expiryDate ? new Date(entry.expiryDate).toLocaleDateString('en-IN') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleDeleteOpen(entry)}
                          variant="ghost"
                          size="sm"
                          title="Delete Entry"
                        >
                          <Trash2 className="h-4 w-4 text-rose-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Delete Entry Confirmation Modal */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Stock Log Deletion"
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4 text-center py-2">
          <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="font-bold text-slate-200">Revert and delete intake log?</h4>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete this stock entry? 
              This will reduce the current stock of <span className="text-slate-200 font-bold">{selectedEntry?.product?.name}</span> by <span className="text-rose-400 font-bold">{selectedEntry?.quantity}</span> units.
            </p>
          </div>
          <div className="flex justify-center gap-3 mt-4 border-t border-slate-800/80 pt-4">
            <Button onClick={() => setIsDeleteOpen(false)} variant="secondary">Cancel</Button>
            <Button onClick={handleDeleteConfirm} variant="destructive">Delete & Revert</Button>
          </div>
        </div>
      </Dialog>

    </div>
  );
};

export default Stocks;
