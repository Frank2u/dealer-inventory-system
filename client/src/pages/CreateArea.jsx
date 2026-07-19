import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { ArrowLeft, Save, MapPin } from 'lucide-react';
import { useToast } from '../components/ui/Toast.jsx';
import { api } from '../services/api.js';

export default function CreateArea() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    areaName: '',
    codePrefix: ''
  });

  useEffect(() => {
    const loadArea = async () => {
      try {
        setLoading(true);
        if (id) {
          const area = await api.areas.getById(id);
          setFormData({
            areaName: area.areaName,
            codePrefix: area.codePrefix
          });
        }
      } catch (err) {
        toast.error('Failed to load area mapping parameters');
      } finally {
        setLoading(false);
      }
    };
    loadArea();
  }, [id]);

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
      setSubmitting(true);
      if (id) {
        await api.areas.update(id, payload);
        toast.success('Area code mapping updated successfully');
      } else {
        await api.areas.create(payload);
        toast.success('Area code mapping created successfully');
      }
      navigate('/areas');
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && id) {
    return (
      <div className="p-6 flex items-center justify-center text-slate-500 font-bold min-h-[400px] animate-pulse">
        Loading area config...
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-4 animate-fade-in text-slate-200">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 select-none">
        <span className="hover:text-white cursor-pointer transition-colors font-semibold" onClick={() => navigate('/areas')}>
          Area Code Mapping
        </span>
        <span>/</span>
        <span className="text-indigo-400 font-bold">
          {id ? 'Edit Area Prefix' : 'Add Area Prefix'}
        </span>
      </div>

      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/areas')}
            className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-850 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-base font-extrabold text-slate-200 tracking-tight">
            {id ? 'Edit Area Prefix Details' : 'Create New Area Prefix Mapping'}
          </h2>
        </div>
      </div>

      <form onSubmit={handleFormSubmit}>
        <Card className="border-slate-900 bg-slate-950/20 max-w-xl">
          <CardContent className="p-6 flex flex-col gap-6">
            
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider inline-flex items-center gap-1.5 border-b border-slate-900 pb-2">
              <MapPin className="h-4 w-4" />
              Area Information & Short Code
            </span>

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

            <div className="flex justify-end gap-3 mt-4 border-t border-slate-900 pt-4">
              <Button onClick={() => navigate('/areas')} type="button" variant="secondary">
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting} className="inline-flex items-center gap-1.5 font-bold">
                <Save className="h-4 w-4" />
                Save Mapping
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>

    </div>
  );
}
