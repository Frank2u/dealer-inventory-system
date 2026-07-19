import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../components/ui/Toast.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Dialog } from '../components/ui/Dialog.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table.jsx';
import { Search, Plus, Edit2, Trash2, Building2 } from 'lucide-react';

export const Suppliers = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const fetchSuppliers = async () => {
    try {
      const data = await api.suppliers.getAll(search);
      setSuppliers(data);
    } catch (err) {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  // Open form for Create
  const handleCreateOpen = () => {
    navigate('/suppliers/new');
  };

  // Open form for Edit
  const handleEditOpen = (supplier) => {
    navigate(`/suppliers/${supplier.id}/edit`);
  };

  // Open Delete Dialog
  const handleDeleteOpen = (supplier) => {
    setSelectedSupplier(supplier);
    setIsDeleteOpen(true);
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    try {
      await api.suppliers.delete(selectedSupplier.id);
      toast.success('Supplier deleted successfully');
      setIsDeleteOpen(false);
      fetchSuppliers();
    } catch (err) {
      toast.error(err.message || 'Deletion failed');
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-in text-slate-200">
      
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-150 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-400" />
            Registered Suppliers
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage product manufacturers, suppliers, and billing details.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative max-w-xs w-full">
            <span className="absolute left-3 top-3 text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <Input
              placeholder="Search by name or GST..."
              className="pl-9 py-1.5"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button onClick={handleCreateOpen} variant="primary" className="py-2 inline-flex items-center gap-1.5 whitespace-nowrap">
            <Plus className="h-4 w-4" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-slate-500 font-semibold animate-pulse">Loading suppliers...</div>
          ) : suppliers.length === 0 ? (
            <div className="p-10 text-center text-slate-500 font-semibold">No suppliers registered yet</div>
          ) : (
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Contact Phone</TableHead>
                    <TableHead>GST Number</TableHead>
                    <TableHead>Linked Products</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-bold text-slate-200">
                        {supplier.name}
                      </TableCell>
                      <TableCell className="text-slate-350 max-w-[200px] truncate" title={supplier.address}>
                        {supplier.address || 'N/A'}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {supplier.phone || 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-indigo-400">
                        {supplier.gstNumber || 'N/A'}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-300">
                        {supplier.products?.length || 0} items
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            onClick={() => handleEditOpen(supplier)}
                            variant="ghost"
                            size="sm"
                            title="Edit Supplier Details"
                          >
                            <Edit2 className="h-4 w-4 text-indigo-400" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteOpen(supplier)}
                            variant="ghost"
                            size="sm"
                            title="Delete Supplier"
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



      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Supplier Deletion"
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4 text-center py-2">
          <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="font-bold text-slate-200">Delete supplier record?</h4>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete <span className="text-slate-250 font-bold">{selectedSupplier?.name}</span>? 
              This action cannot be undone and will fail if any catalog products are linked to this supplier.
            </p>
          </div>
          <div className="flex justify-center gap-3 mt-4 border-t border-slate-800/80 pt-4">
            <Button onClick={() => setIsDeleteOpen(false)} variant="secondary">Cancel</Button>
            <Button onClick={handleDeleteConfirm} variant="destructive">Delete Supplier</Button>
          </div>
        </div>
      </Dialog>

    </div>
  );
};

export default Suppliers;
