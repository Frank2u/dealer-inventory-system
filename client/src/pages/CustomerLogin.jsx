import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { Lock, Store } from 'lucide-react';

export const CustomerLogin = () => {
  const { customerLogin } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter both login credentials and password');
      return;
    }

    setLoading(true);
    try {
      await customerLogin(username, password);
      toast.success('Successfully logged into Customer Portal!');
    } catch (err) {
      toast.error(err.message || 'Invalid username, shop code, phone, or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />

      <Card className="w-full max-w-md glassmorphism border-slate-800/80 shadow-2xl relative z-10 animate-fade-in">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto bg-emerald-600 h-11 w-11 rounded-xl text-white flex items-center justify-center font-black text-lg shadow-lg shadow-emerald-600/30 mb-4 select-none">
            SHP
          </div>
          <CardTitle className="text-xl">Retailer Portal</CardTitle>
          <CardDescription>Enter registered username, shop code or phone to access bills and order stock</CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 pt-2">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Username Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-9.5 text-slate-500">
                <Store className="h-4.5 w-4.5" />
              </span>
              <Input
                label="Username, Shop Code or Phone"
                placeholder="e.g. supermart, DT-0001 or 9876543210"
                className="pl-10"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="relative flex flex-col gap-1">
              <span className="absolute left-3.5 top-9.5 text-slate-500">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 border-none shadow-lg shadow-emerald-600/20"
              loading={loading}
            >
              Sign In to Shop
            </Button>
            
            <div className="text-center mt-4 bg-slate-900/30 border border-slate-900/80 p-2.5 rounded-lg text-[10px] text-slate-400 font-medium">
              💡 <span className="text-slate-300 font-bold">First time logging in?</span> Your default username is your shop code in lowercase (e.g. <span className="text-slate-300 font-semibold">dt-0001</span>), and password is your phone number.
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerLogin;
