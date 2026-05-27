import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../components/ui/Toast.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Dialog } from '../components/ui/Dialog.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table.jsx';
import { Plus, Import, Trash2, Calendar, ClipboardList } from 'lucide-react';

export const IncomingStock = () => {
  const toast = useToast();
  const [entries, setEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    supplierName: '',
    invoiceNumber: '',
    productId: '',
    quantity: '',
    costPrice: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const loadData = async () => {
    try {
      const [stockLogs, catalogProds] = await Promise.all([
        api.stock.getAll(),
        api.products.getAll()
      ]);
      setEntries(stockLogs);
      setProducts(catalogProds);
    } catch (err) {
      toast.error('Failed to load stock entry logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOpen = () => {
    if (products.length === 0) {
      toast.error('Please add products to the catalog first');
      return;
    }
    setFormData({
      supplierName: '',
      invoiceNumber: '',
      productId: products[0]?.id || '',
      quantity: '',
      costPrice: String(products[0]?.purchasePrice || '0'),
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsFormOpen(true);
  };

  // Pre-fill default cost price on product select
  const handleProductSelect = (prodId) => {
    const prod = products.find(p => p.id === prodId);
    setFormData(prev => ({
      ...prev,
      productId: prodId,
      costPrice: prod ? String(prod.purchasePrice) : '0'
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplierName || !formData.invoiceNumber || !formData.productId || !formData.quantity || !formData.costPrice) {
      toast.error('Please fill in all mandatory fields');
      return;
    }

    try {
      await api.stock.create(formData);
      toast.success('Stock entry logged. Inventory increased!');
      setIsFormOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Log failed');
    }
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
    <div className="p-6 flex flex-col gap-6 animate-fade-in">
      
      {/* Header action */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Stock replenishment records</h2>
        <Button onClick={handleCreateOpen} variant="primary" className="py-2 inline-flex items-center gap-1.5">
          <Plus className="h-4 w-4" />
          Log Incoming Stock
        </Button>
      </div>

      {/* Stock logs table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-slate-500 font-semibold animate-pulse">Loading stock entries...</div>
          ) : entries.length === 0 ? (
            <div className="p-10 text-center text-slate-500 font-semibold">No stock intake recorded yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rep Date</TableHead>
                  <TableHead>Supplier Name</TableHead>
                  <TableHead>Supplier Inv #</TableHead>
                  <TableHead>Product Received</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Total Cost</TableHead>
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
                        {entry.supplierName}
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
          )}
        </CardContent>
      </Card>

      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Log Incoming Stock Shipment"
        maxWidth="lg"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2.5">
            <div>
              <Input
                label="Supplier Name *"
                placeholder="e.g. Coca Cola Bottlers Ltd."
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Supplier Invoice Number *"
                placeholder="e.g. INV-CC-9901"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Shipment Date *"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Select
                label="Product Received *"
                value={formData.productId}
                onChange={(e) => handleProductSelect(e.target.value)}
              >
                {products.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900">{p.name} ({p.sku})</option>
                ))}
              </Select>
            </div>
            <div>
              <Input
                label="Intake Quantity (Units) *"
                type="number"
                placeholder="e.g. 50"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Unit Cost Price (INR) *"
                type="number"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Notes / Remarks</label>
              <textarea
                className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[45px] transition-all"
                placeholder="Item in good condition. Received at morning dock."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 border-t border-slate-800/80 pt-4">
            <Button onClick={() => setIsFormOpen(false)} variant="secondary">Cancel</Button>
            <Button type="submit" variant="primary">Log Shipment</Button>
          </div>
        </form>
      </Dialog>

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
              Are you sure you want to delete the stock entry from <span className="text-slate-200 font-bold">{selectedEntry?.supplierName}</span>? 
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

export default IncomingStock;
