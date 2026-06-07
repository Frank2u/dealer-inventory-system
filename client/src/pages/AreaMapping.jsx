import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../components/ui/Toast.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Dialog } from '../components/ui/Dialog.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table.jsx';
import { Search, Plus, Edit2, Trash2, MapPin } from 'lucide-react';

export const AreaMapping = () => {
  const toast = useToast();
  const [areas, setAreas] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);

  // Form inputs
  const [formData, setFormData] = useState({
    areaName: '',
    codePrefix: ''
  });

  const fetchAreas = async () => {
    try {
      const data = await api.areas.getAll();
      setAreas(data);
    } catch (err) {
      toast.error('Failed to load area mappings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  // Open form for Create
  const handleCreateOpen = () => {
    setSelectedArea(null);
    setFormData({
      areaName: '',
      codePrefix: ''
    });
    setIsFormOpen(true);
  };

  // Open form for Edit
  const handleEditOpen = (area) => {
    setSelectedArea(area);
    setFormData({
      areaName: area.areaName,
      codePrefix: area.codePrefix
    });
    setIsFormOpen(true);
  };

  // Submit Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.areaName.trim() || !formData.codePrefix.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const cleanedPrefix = formData.codePrefix.trim().toUpperCase();
    if (cleanedPrefix.length < 2 || cleanedPrefix.length > 5) {
      toast.error('Code prefix must be between 2 and 5 characters');
      return;
    }

    const payload = {
      areaName: formData.areaName.trim(),
      codePrefix: cleanedPrefix
    };

    try {
      if (selectedArea) {
        await api.areas.update(selectedArea.id, payload);
        toast.success('Area code mapping updated successfully');
      } else {
        await api.areas.create(payload);
        toast.success('Area code mapping created successfully');
      }
      setIsFormOpen(false);
      fetchAreas();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  // Open Delete Dialog
  const handleDeleteOpen = (area) => {
    setSelectedArea(area);
    setIsDeleteOpen(true);
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    try {
      await api.areas.delete(selectedArea.id);
      toast.success('Area mapping deleted successfully');
      setIsDeleteOpen(false);
      fetchAreas();
    } catch (err) {
      toast.error(err.message || 'Deletion failed');
    }
  };

  const filteredAreas = areas.filter(a => 
    a.areaName.toLowerCase().includes(search.toLowerCase()) ||
    a.codePrefix.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-in">
      
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-150 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-400" />
            Area Code Mapping
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Map neighborhood/distribution areas to short code prefixes for auto-generating shop codes (e.g. SN for Singallur).
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative max-w-xs w-full">
            <span className="absolute left-3 top-3 text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <Input
              placeholder="Search area or code..."
              className="pl-9 py-1.5"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button onClick={handleCreateOpen} variant="primary" className="py-2 inline-flex items-center gap-1.5 whitespace-nowrap">
            <Plus className="h-4 w-4" />
            Add Area Code
          </Button>
        </div>
      </div>

      {/* Areas Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-slate-500 font-semibold animate-pulse">Loading area mappings...</div>
          ) : filteredAreas.length === 0 ? (
            <div className="p-10 text-center text-slate-500 font-semibold">No area mappings found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Area Name</TableHead>
                  <TableHead>Code Prefix</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAreas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-bold text-slate-200">
                      {area.areaName}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-bold text-indigo-400">
                      {area.codePrefix}
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {new Date(area.createdAt).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          onClick={() => handleEditOpen(area)}
                          variant="ghost"
                          size="sm"
                          title="Edit Area Mapping"
                        >
                          <Edit2 className="h-4 w-4 text-indigo-400" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteOpen(area)}
                          variant="ghost"
                          size="sm"
                          title="Delete Area Mapping"
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
        title={selectedArea ? 'Edit Area Code Mapping' : 'Add Area Code Mapping'}
        maxWidth="md"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Area Name *"
                placeholder="e.g. Singallur"
                value={formData.areaName}
                onChange={(e) => setFormData({ ...formData, areaName: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Code Prefix *"
                placeholder="e.g. SN"
                maxLength="5"
                value={formData.codePrefix}
                onChange={(e) => setFormData({ ...formData, codePrefix: e.target.value.toUpperCase() })}
              />
              <span className="text-[10px] text-slate-500 font-semibold mt-1 block">
                Uppercase prefix between 2-5 characters long.
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t border-slate-800/80 pt-4">
            <Button onClick={() => setIsFormOpen(false)} variant="secondary">Cancel</Button>
            <Button type="submit" variant="primary">Save Mapping</Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Deletion"
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4 text-center py-2">
          <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="font-bold text-slate-200">Remove Area Code Mapping?</h4>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete the mapping for <span className="text-slate-250 font-bold">{selectedArea?.areaName}</span>? 
              This mapping will be removed. Note that you cannot delete an area mapping if shops are still registered under it.
            </p>
          </div>
          <div className="flex justify-center gap-3 mt-4 border-t border-slate-800/80 pt-4">
            <Button onClick={() => setIsDeleteOpen(false)} variant="secondary">Cancel</Button>
            <Button onClick={handleDeleteConfirm} variant="destructive">Delete Mapping</Button>
          </div>
        </div>
      </Dialog>

    </div>
  );
};

export default AreaMapping;
