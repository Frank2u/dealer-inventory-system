import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../components/ui/Toast.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Dialog } from '../components/ui/Dialog.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table.jsx';
import { Search, Plus, Edit2, Trash2, Building2 } from 'lucide-react';

export const Companies = () => {
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Form inputs
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    gstNumber: ''
  });

  const fetchCompanies = async () => {
    try {
      const data = await api.companies.getAll(search);
      setCompanies(data);
    } catch (err) {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [search]);

  // Open form for Create
  const handleCreateOpen = () => {
    setSelectedCompany(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      gstNumber: ''
    });
    setIsFormOpen(true);
  };

  // Open form for Edit
  const handleEditOpen = (company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      address: company.address || '',
      phone: company.phone || '',
      gstNumber: company.gstNumber || ''
    });
    setIsFormOpen(true);
  };

  // Submit Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Company Name is required');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      gstNumber: formData.gstNumber.trim().toUpperCase()
    };

    try {
      if (selectedCompany) {
        await api.companies.update(selectedCompany.id, payload);
        toast.success('Company updated successfully');
      } else {
        await api.companies.create(payload);
        toast.success('Company registered successfully');
      }
      setIsFormOpen(false);
      fetchCompanies();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  // Open Delete Dialog
  const handleDeleteOpen = (company) => {
    setSelectedCompany(company);
    setIsDeleteOpen(true);
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    try {
      await api.companies.delete(selectedCompany.id);
      toast.success('Company deleted successfully');
      setIsDeleteOpen(false);
      fetchCompanies();
    } catch (err) {
      toast.error(err.message || 'Deletion failed');
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-in">
      
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-150 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-400" />
            Registered Companies
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
            Add Company
          </Button>
        </div>
      </div>

      {/* Companies Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-slate-500 font-semibold animate-pulse">Loading companies...</div>
          ) : companies.length === 0 ? (
            <div className="p-10 text-center text-slate-500 font-semibold">No companies registered yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Contact Phone</TableHead>
                  <TableHead>GST Number</TableHead>
                  <TableHead>Linked Products</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-bold text-slate-200">
                      {company.name}
                    </TableCell>
                    <TableCell className="text-slate-350 max-w-[200px] truncate" title={company.address}>
                      {company.address || 'N/A'}
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {company.phone || 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-indigo-400">
                      {company.gstNumber || 'N/A'}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-300">
                      {company.products?.length || 0} items
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          onClick={() => handleEditOpen(company)}
                          variant="ghost"
                          size="sm"
                          title="Edit Company Details"
                        >
                          <Edit2 className="h-4 w-4 text-indigo-400" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteOpen(company)}
                          variant="ghost"
                          size="sm"
                          title="Delete Company"
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

      {/* Create / Edit Dialog */}
      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedCompany ? 'Edit Company Details' : 'Register New Company'}
        maxWidth="md"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Company Name *"
                placeholder="e.g. Coca-Cola India Pvt Ltd"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Company Phone"
                placeholder="e.g. 18001882653"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Company GST Registration"
                placeholder="e.g. 06AACCC1100F1Z4"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Registered Address"
                placeholder="e.g. Gurugram, Haryana, India"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t border-slate-800/80 pt-4">
            <Button onClick={() => setIsFormOpen(false)} variant="secondary">Cancel</Button>
            <Button type="submit" variant="primary">Save Company</Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Company Deletion"
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4 text-center py-2">
          <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="font-bold text-slate-200">Delete company record?</h4>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete <span className="text-slate-250 font-bold">{selectedCompany?.name}</span>? 
              This action cannot be undone and will fail if any catalog products are linked to this company.
            </p>
          </div>
          <div className="flex justify-center gap-3 mt-4 border-t border-slate-800/80 pt-4">
            <Button onClick={() => setIsDeleteOpen(false)} variant="secondary">Cancel</Button>
            <Button onClick={handleDeleteConfirm} variant="destructive">Delete Company</Button>
          </div>
        </div>
      </Dialog>

    </div>
  );
};

export default Companies;
