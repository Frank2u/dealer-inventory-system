import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../components/ui/Toast.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Dialog } from '../components/ui/Dialog.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Search, Plus, Eye, Edit2, Trash2, IndianRupee, Phone, MapPin, FileText, ClipboardList, Truck } from 'lucide-react';

export const Shops = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [search, setSearch] = useState('');
  const [hasDueOnly, setHasDueOnly] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [historyData, setHistoryData] = useState({ deliveries: [], payments: [] });
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form inputs
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    phone: '',
    alternatePhone: '',
    address: '',
    area: '',
    gstNumber: '',
    creditLimit: '0',
    notes: ''
  });

  const fetchShops = async () => {
    try {
      const data = await api.shops.getAll(search, hasDueOnly, sortBy);
      setShops(data);
    } catch (err) {
      toast.error('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [search, hasDueOnly, sortBy]);

  // Open Form for Create
  const handleCreateOpen = () => {
    setSelectedShop(null);
    setFormData({
      name: '',
      ownerName: '',
      phone: '',
      alternatePhone: '',
      address: '',
      area: '',
      gstNumber: '',
      creditLimit: '0',
      notes: ''
    });
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleEditOpen = (shop) => {
    setSelectedShop(shop);
    setFormData({
      name: shop.name,
      ownerName: shop.ownerName,
      phone: shop.phone,
      alternatePhone: shop.alternatePhone || '',
      address: shop.address,
      area: shop.area,
      gstNumber: shop.gstNumber || '',
      creditLimit: String(shop.creditLimit),
      notes: shop.notes || ''
    });
    setIsFormOpen(true);
  };

  // Submit Shop (Create / Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.ownerName || !formData.phone || !formData.address || !formData.area) {
      toast.error('Please fill in all mandatory fields');
      return;
    }

    try {
      if (selectedShop) {
        await api.shops.update(selectedShop.id, formData);
        toast.success('Shop updated successfully');
      } else {
        await api.shops.create(formData);
        toast.success('Shop registered successfully');
      }
      setIsFormOpen(false);
      fetchShops();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  // Open Delete confirmation
  const handleDeleteOpen = (shop) => {
    setSelectedShop(shop);
    setIsDeleteOpen(true);
  };

  // Execute Delete
  const handleDeleteConfirm = async () => {
    try {
      await api.shops.delete(selectedShop.id);
      toast.success('Shop deleted successfully');
      setIsDeleteOpen(false);
      fetchShops();
    } catch (err) {
      toast.error(err.message || 'Deletion failed');
    }
  };

  // Open History Drawer
  const handleHistoryOpen = async (shop) => {
    setSelectedShop(shop);
    setHistoryLoading(true);
    setIsHistoryOpen(true);
    try {
      const data = await api.shops.getHistory(shop.id);
      setHistoryData(data);
    } catch (err) {
      toast.error('Failed to load shop ledger history');
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-in">
      
      {/* 1. Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative max-w-xs w-full">
            <span className="absolute left-3 top-3 text-slate-500"><Search className="h-4 w-4" /></span>
            <Input
              placeholder="Search name, owner, area..."
              className="pl-9 py-1.5"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Has Due Filter Checkbox */}
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 select-none cursor-pointer bg-slate-950/20 border border-slate-900 px-3 py-2 rounded-lg hover:border-slate-800">
            <input
              type="checkbox"
              className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 h-4 w-4"
              checked={hasDueOnly}
              onChange={(e) => setHasDueOnly(e.target.checked)}
            />
            <span>Show Outstanding Dues Only</span>
          </label>

          {/* Sort Dropdown */}
          <select
            className="bg-slate-950/20 border border-slate-900 text-xs font-semibold text-slate-400 rounded-lg px-3 py-2.5 outline-none cursor-pointer hover:border-slate-800"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="">Sort by (Default)</option>
            <option value="due_desc">Due: High to Low</option>
            <option value="due_asc">Due: Low to High</option>
          </select>
        </div>

        {/* Add Shop Trigger */}
        <Button onClick={handleCreateOpen} variant="primary" className="py-2 inline-flex items-center gap-1.5">
          <Plus className="h-4 w-4" />
          Add New Shop
        </Button>
      </div>

      {/* 2. Shop list table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-slate-500 font-semibold animate-pulse">Loading shops...</div>
          ) : shops.length === 0 ? (
            <div className="p-10 text-center text-slate-500 font-semibold">No registered shops found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>GST Number</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead>Current Due</TableHead>
                  <TableHead>Total Profit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shops.map((shop) => (
                  <TableRow key={shop.id}>
                    <TableCell className="font-bold text-slate-200">
                      <div>
                        {shop.name}
                        {shop.notes && <p className="text-[10px] text-slate-500 font-medium truncate max-w-xs">{shop.notes}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-300">{shop.ownerName}</TableCell>
                    <TableCell className="font-semibold text-slate-400">
                      <div className="flex flex-col text-xs leading-tight">
                        <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3 text-slate-600" />{shop.phone}</span>
                        {shop.alternatePhone && <span className="text-[10px] text-slate-600 pl-4">Alt: {shop.alternatePhone}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <span className="inline-flex items-center gap-1 text-xs"><MapPin className="h-3.5 w-3.5 text-indigo-500/60" />{shop.area}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{shop.gstNumber || 'N/A'}</TableCell>
                    <TableCell className="font-semibold text-slate-400">₹{shop.creditLimit.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <span className={`font-bold text-sm ${shop.currentDue > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                        ₹{shop.currentDue.toLocaleString('en-IN')}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-emerald-450 text-sm">
                      ₹{(shop.profit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          onClick={() => navigate(`/deliveries?shopId=${shop.id}`)}
                          variant="ghost"
                          size="sm"
                          title="View Deliveries"
                        >
                          <Truck className="h-4 w-4 text-emerald-400" />
                        </Button>
                        <Button
                          onClick={() => handleHistoryOpen(shop)}
                          variant="ghost"
                          size="sm"
                          title="Ledger History"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleEditOpen(shop)}
                          variant="ghost"
                          size="sm"
                          title="Edit Details"
                        >
                          <Edit2 className="h-4 w-4 text-indigo-400" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteOpen(shop)}
                          variant="ghost"
                          size="sm"
                          title="Delete Shop"
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

      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedShop ? 'Edit Retailer Shop' : 'Register New Retailer Shop'}
        maxWidth="lg"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2.5">
            <div>
              <Input
                label="Shop Name *"
                placeholder="e.g. Super Mart Grocery"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Owner Name *"
                placeholder="e.g. John Doe"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="GST Registration Number"
                placeholder="e.g. 29ABCDE1234F1Z5"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Primary Phone *"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Alternate Phone"
                placeholder="e.g. 9876543211"
                value={formData.alternatePhone}
                onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Area/Location *"
                placeholder="e.g. Downtown Sector 4"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Delivery Address *"
                placeholder="Full delivery coordinates"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Allowed Credit Limit (INR)"
                type="number"
                placeholder="0"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
              />
            </div>
            <div className="md:col-span-3 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Merchant Notes / Delivery Preferences</label>
              <textarea
                className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[45px] transition-all"
                placeholder="Prefer morning deliveries. Pays via UPI."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 border-t border-slate-800/80 pt-4">
            <Button onClick={() => setIsFormOpen(false)} variant="secondary">Cancel</Button>
            <Button type="submit" variant="primary">Save Shop</Button>
          </div>
        </form>
      </Dialog>

      {/* 4. Ledger History Modal Dialog */}
      <Dialog
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Merchant Account Ledger - ${selectedShop?.name}`}
        maxWidth="lg"
      >
        {historyLoading ? (
          <div className="p-10 text-center animate-pulse text-slate-500 font-semibold">Fetching transactions ledger...</div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* Account statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/40 p-4 border border-slate-800 rounded-xl">
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Shop Owner</span>
                <span className="text-slate-200 font-semibold text-sm">{selectedShop?.ownerName}</span>
              </div>
              <div className="flex flex-col leading-tight border-l border-slate-800/60 pl-4">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Credit Limit</span>
                <span className="text-slate-200 font-bold text-sm">₹{selectedShop?.creditLimit?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex flex-col leading-tight border-l border-slate-800/60 pl-4">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Current Dues</span>
                <span className="text-rose-400 font-black text-sm">₹{selectedShop?.currentDue?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Delivery invoices history */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 inline-flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-indigo-400" />
                Delivery Invoices ({historyData.deliveries.length})
              </h3>
              <div className="max-h-[220px] overflow-y-auto rounded-lg border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Items Count</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Outstanding</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {historyData.deliveries.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-slate-500 font-medium">No deliveries dispatched to this shop</td>
                      </tr>
                    ) : (
                      historyData.deliveries.map(d => (
                        <tr key={d.id} className="hover:bg-slate-850/20 text-slate-300">
                          <td className="p-3 font-bold text-slate-200">{d.deliveryNumber}</td>
                          <td className="p-3 font-semibold text-slate-400">{new Date(d.deliveryDate).toLocaleDateString('en-IN')}</td>
                          <td className="p-3 font-semibold">{d.items?.length || 0} items</td>
                          <td className="p-3 font-bold">₹{d.totalAmount.toLocaleString('en-IN')}</td>
                          <td className="p-3 font-bold text-rose-400/90">₹{d.remainingDue.toLocaleString('en-IN')}</td>
                          <td className="p-3">
                            <Badge variant={d.paymentStatus === 'paid' ? 'success' : d.paymentStatus === 'partial' ? 'warning' : 'danger'}>
                              {d.paymentStatus}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payments history */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 inline-flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4 text-emerald-400" />
                Payments Collected ({historyData.payments.length})
              </h3>
              <div className="max-h-[220px] overflow-y-auto rounded-lg border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Payment Date</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Linked Invoice</th>
                      <th className="p-3">Notes</th>
                      <th className="p-3">Amount Collected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {historyData.payments.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-slate-500 font-medium">No collections recorded from this shop</td>
                      </tr>
                    ) : (
                      historyData.payments.map(p => (
                        <tr key={p.id} className="hover:bg-slate-850/20 text-slate-300">
                          <td className="p-3 font-semibold text-slate-400">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                          <td className="p-3"><Badge>{p.paymentMethod}</Badge></td>
                          <td className="p-3 font-semibold text-indigo-400">{p.delivery?.deliveryNumber || 'On Account'}</td>
                          <td className="p-3 text-[11px] text-slate-500 font-medium truncate max-w-xs">{p.notes || '-'}</td>
                          <td className="p-3 font-bold text-emerald-400">₹{p.paidAmount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-end border-t border-slate-850 pt-4 mt-2">
              <Button onClick={() => setIsHistoryOpen(false)} variant="secondary">Close Ledger</Button>
            </div>

          </div>
        )}
      </Dialog>

      {/* 5. Delete Shop Confirmation Modal */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Shop Deletion"
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4 text-center py-2">
          <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="font-bold text-slate-200">Remove customer record?</h4>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete <span className="text-slate-200 font-bold">{selectedShop?.name}</span>? 
              This action will remove the shop and all its linked invoices/payments history permanently.
            </p>
          </div>
          <div className="flex justify-center gap-3 mt-4 border-t border-slate-800/80 pt-4">
            <Button onClick={() => setIsDeleteOpen(false)} variant="secondary">Cancel</Button>
            <Button onClick={handleDeleteConfirm} variant="destructive">Remove Shop</Button>
          </div>
        </div>
      </Dialog>

    </div>
  );
};

export default Shops;
