import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { ArrowLeft, Save, Store } from 'lucide-react';
import { useToast } from '../components/ui/Toast.jsx';
import { api } from '../services/api.js';

export default function CreateShop() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Dependencies
  const [areas, setAreas] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    phone: '',
    alternatePhone: '',
    address: '',
    area: '',
    gstNumber: '',
    creditLimit: '0',
    notes: '',
    username: '',
    password: ''
  });

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        setLoading(true);
        const areaList = await api.areas.getAll();
        setAreas(areaList);

        if (id) {
          const shop = await api.shops.getById(id);
          setFormData({
            name: shop.name,
            ownerName: shop.ownerName,
            phone: shop.phone,
            alternatePhone: shop.alternatePhone || '',
            address: shop.address,
            area: shop.area,
            gstNumber: shop.gstNumber || '',
            creditLimit: String(shop.creditLimit),
            notes: shop.notes || '',
            username: shop.username || '',
            password: '' // Keep empty for no change
          });
        }
      } catch (err) {
        toast.error('Failed to load shop form parameters');
      } finally {
        setLoading(false);
      }
    };
    loadDependencies();
  }, [id]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.ownerName || !formData.phone || !formData.address || !formData.area) {
      toast.error('Please fill in all mandatory fields');
      return;
    }

    try {
      setSubmitting(true);
      if (id) {
        await api.shops.update(id, formData);
        toast.success('Shop updated successfully');
      } else {
        await api.shops.create(formData);
        toast.success('Shop registered successfully');
      }
      navigate('/shops');
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center text-slate-500 font-bold min-h-[400px] animate-pulse">
        Loading shop configuration details...
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-4 animate-fade-in text-slate-200">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 select-none">
        <span className="hover:text-white cursor-pointer transition-colors font-semibold" onClick={() => navigate('/shops')}>
          Registered Retailers
        </span>
        <span>/</span>
        <span className="text-indigo-400 font-bold">
          {id ? 'Edit Shop' : 'Register New Shop'}
        </span>
      </div>

      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/shops')}
            className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-850 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-base font-extrabold text-slate-200 tracking-tight">
            {id ? 'Edit Retailer Shop Details' : 'Register New Retailer Shop'}
          </h2>
        </div>
      </div>

      <form onSubmit={handleFormSubmit}>
        <Card className="border-slate-900 bg-slate-950/20 max-w-4xl">
          <CardContent className="p-6 flex flex-col gap-6">
            
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider inline-flex items-center gap-1.5 border-b border-slate-900 pb-2">
              <Store className="h-4 w-4" />
              Shop Identity & Account Settings
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
              
              {/* Shop Name */}
              <div>
                <Input
                  label="Shop Name *"
                  placeholder="e.g. Super Mart Grocery"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Owner Name */}
              <div>
                <Input
                  label="Owner Name *"
                  placeholder="e.g. John Doe"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                />
              </div>

              {/* GST Number */}
              <div>
                <Input
                  label="GST Registration Number"
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                />
              </div>

              {/* Primary Phone */}
              <div>
                <Input
                  label="Primary Phone *"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              {/* Alternate Phone */}
              <div>
                <Input
                  label="Alternate Phone"
                  placeholder="e.g. 9876543211"
                  value={formData.alternatePhone}
                  onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                />
              </div>

              {/* Username */}
              <div>
                <Input
                  label="Retailer Portal Username"
                  placeholder={id ? "e.g. supermart" : "Defaults to lowercase shop code"}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              {/* Password */}
              <div>
                <Input
                  label="Retailer Login Password"
                  type="password"
                  placeholder={id ? "•••••••• (Leave blank to keep same)" : "Defaults to phone number"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              {/* Area */}
              <div>
                <Select
                  label="Area/Location *"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                >
                  <option value="" className="bg-slate-900">-- Select Area --</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.areaName} className="bg-slate-900">
                      {a.areaName} ({a.codePrefix})
                    </option>
                  ))}
                </Select>
                {areas.length === 0 && (
                  <span className="text-[10px] text-amber-500 font-semibold mt-1 block animate-pulse">
                    Please define area codes in "Area Codes" page first!
                  </span>
                )}
              </div>

              {/* Credit Limit */}
              <div>
                <Input
                  label="Allowed Credit Limit (INR)"
                  type="number"
                  placeholder="0"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                />
              </div>

              {/* Address */}
              <div className="md:col-span-3">
                <Input
                  label="Delivery Address *"
                  placeholder="Full delivery coordinates"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-3 flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-400">Merchant Notes / Delivery Preferences</label>
                <textarea
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px] transition-all"
                  placeholder="Prefer morning deliveries. Pays via UPI."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 mt-4 border-t border-slate-900 pt-4">
              <Button onClick={() => navigate('/shops')} type="button" variant="secondary">
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting} className="inline-flex items-center gap-1.5 font-bold">
                <Save className="h-4 w-4" />
                Save Shop Record
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>

    </div>
  );
}
