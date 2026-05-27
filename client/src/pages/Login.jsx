import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { Lock, User } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      toast.success('Successfully logged in!');
    } catch (err) {
      toast.error(err.message || 'Invalid credentials');
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
          <div className="mx-auto bg-indigo-600 h-11 w-11 rounded-xl text-white flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-600/30 mb-4 select-none">
            DIS
          </div>
          <CardTitle className="text-xl">Distributor Admin Hub</CardTitle>
          <CardDescription>Enter credentials to access delivery and billing controls</CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 pt-2">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Username Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-9.5 text-slate-500">
                <User className="h-4.5 w-4.5" />
              </span>
              <Input
                label="Username"
                placeholder="Enter username"
                className="pl-10"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="relative">
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
              className="w-full mt-2 py-2.5"
              loading={loading}
            >
              Sign In
            </Button>
            
            <div className="text-center mt-3 text-[10px] text-slate-500 font-medium">
              Demo Credentials: <span className="text-slate-400 font-semibold">admin / admin123</span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
