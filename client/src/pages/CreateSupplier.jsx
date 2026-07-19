import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { ArrowLeft, Save, Truck } from 'lucide-react';
import { useToast } from '../components/ui/Toast.jsx';
import { api } from '../services/api.js';

export default function CreateSupplier() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    gstNumber: ''
  });

  useEffect(() => {
    const loadSupplier = async () => {
      try {
        setLoading(true);
        if (id) {
          const supplier = await api.suppliers.getById(id);
          setFormData({
            name: supplier.name,
            address: supplier.address || '',
            phone: supplier.phone || '',
            gstNumber: supplier.gstNumber || ''
          });
        }
      } catch (err) {
        toast.error('Failed to load supplier parameters');
      } finally {
        setLoading(false);
      }
    };
    loadSupplier();
  }, [id]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Supplier Name is required');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      gstNumber: formData.gstNumber.trim().toUpperCase()
    };

    try {
      setSubmitting(true);
      if (id) {
        await api.suppliers.update(id, payload);
        toast.success('Supplier updated successfully');
      } else {
        await api.suppliers.create(payload);
        toast.success('Supplier registered successfully');
      }
      navigate('/suppliers');
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && id) {
    return (
      <div className="p-6 flex items-center justify-center text-slate-500 font-bold min-h-[400px] animate-pulse">
        Loading supplier configuration...
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-4 animate-fade-in text-slate-200">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 select-none">
        <span className="hover:text-white cursor-pointer transition-colors font-semibold" onClick={() => navigate('/suppliers')}>
          Suppliers Directory
        </span>
        <span>/</span>
        <span className="text-indigo-400 font-bold">
          {id ? 'Edit Supplier' : 'Register New Supplier'}
        </span>
      </div>

      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/suppliers')}
            className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-850 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-base font-extrabold text-slate-200 tracking-tight">
            {id ? 'Edit Supplier Account Details' : 'Register New Inventory Supplier'}
          </h2>
        </div>
      </div>

      <form onSubmit={handleFormSubmit}>
        <Card className="border-slate-900 bg-slate-950/20 max-w-2xl">
          <CardContent className="p-6 flex flex-col gap-6">
            
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider inline-flex items-center gap-1.5 border-b border-slate-900 pb-2">
              <Truck className="h-4 w-4" />
              Supplier Profile & Tax Info
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="sm:col-span-2">
                <Input
                  label="Supplier Name *"
                  placeholder="e.g. Coca-Cola India Pvt Ltd"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <Input
                  label="Supplier Phone"
                  placeholder="e.g. 18001882653"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <Input
                  label="Supplier GST Registration"
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

            <div className="flex justify-end gap-3 mt-4 border-t border-slate-900 pt-4">
              <Button onClick={() => navigate('/suppliers')} type="button" variant="secondary">
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting} className="inline-flex items-center gap-1.5 font-bold">
                <Save className="h-4 w-4" />
                Save Supplier Record
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>

    </div>
  );
}
