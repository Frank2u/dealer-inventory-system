import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { Database, Download, ShieldCheck, Sun, Moon, Key } from 'lucide-react';

export const Settings = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  // Backup downloader
  const handleDownloadBackup = async () => {
    setLoading(true);
    try {
      // Fetch data for all modules
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [shops, products, stock, deliveries, payments] = await Promise.all([
        fetch('/api/shops', { headers }).then(r => r.json()),
        fetch('/api/products', { headers }).then(r => r.json()),
        fetch('/api/stock', { headers }).then(r => r.json()),
        fetch('/api/deliveries', { headers }).then(r => r.json()),
        fetch('/api/payments', { headers }).then(r => r.json())
      ]);

      const backupObj = {
        backupDate: new Date().toISOString(),
        version: '1.0.0',
        data: {
          shops,
          products,
          stockEntries: stock,
          deliveries,
          payments
        }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Wholesale_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);

      toast.success('System database backup downloaded successfully!');
    } catch (err) {
      toast.error('Failed to compile database backup file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-in max-w-4xl">
      
      {/* 1. Account Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            User Security & Credentials
          </CardTitle>
          <CardDescription>View current session credentials and role permissions</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={user?.name || 'System Administrator'}
              disabled
            />
            <Input
              label="Username"
              value={user?.username || 'admin'}
              disabled
            />
            <Input
              label="Assigned System Role"
              value={user?.role?.toUpperCase() || 'ADMIN'}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Backup controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-400" />
            Database Backup & Recovery
          </CardTitle>
          <CardDescription>Download a complete snapshot of all merchant files, inventory catalogs, and invoice histories in JSON format.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="bg-slate-950/20 border border-slate-900 p-4 rounded-xl text-slate-400 text-xs leading-relaxed max-w-2xl">
            💡 <strong>Tip:</strong> Periodic backups are recommended to prevent data loss. You can download the JSON backup and keep it locally, or feed it into script pipelines for imports.
          </div>
          <div className="flex items-center mt-2">
            <Button
              onClick={handleDownloadBackup}
              variant="primary"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
              loading={loading}
            >
              <Download className="h-4.5 w-4.5" />
              Backup System Database
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default Settings;
