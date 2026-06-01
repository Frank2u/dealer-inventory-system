import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../components/ui/Toast.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import {
  TrendingUp,
  AlertTriangle,
  IndianRupee,
  Store,
  Package,
  Truck,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export const Dashboard = () => {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await api.reports.getDashboardStats();
      setStats(data);
    } catch (err) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900/60 border border-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="h-80 bg-slate-900/60 border border-slate-800 rounded-xl lg:col-span-2" />
          <div className="h-80 bg-slate-900/60 border border-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const cardItems = [
    {
      title: "Today's Sales",
      value: `₹${stats?.todaySales?.toLocaleString('en-IN') || '0'}`,
      desc: `${stats?.todayDeliveryCount || 0} deliveries dispatched today`,
      icon: <Truck className="h-5 w-5 text-indigo-400" />,
      bg: 'bg-indigo-500/5 border-indigo-500/10'
    },
    {
      title: "Total Collections",
      value: `₹${stats?.totalPaid?.toLocaleString('en-IN') || '0'}`,
      desc: "Total payments collected from shops",
      icon: <IndianRupee className="h-5 w-5 text-emerald-400" />,
      bg: 'bg-emerald-500/5 border-emerald-500/10'
    },
    {
      title: "Outstanding Dues",
      value: `₹${stats?.totalUnpaid?.toLocaleString('en-IN') || '0'}`,
      desc: "Total remaining credit dues",
      icon: <IndianRupee className="h-5 w-5 text-rose-400" />,
      bg: 'bg-rose-500/5 border-rose-500/10'
    },
    {
      title: "Net Profit",
      value: `₹${stats?.totalProfit?.toLocaleString('en-IN') || '0'}`,
      desc: "Cumulative gross net profit margin",
      icon: <TrendingUp className="h-5 w-5 text-purple-450" />,
      bg: 'bg-purple-500/5 border-purple-500/10'
    },
    {
      title: "Products Catalog",
      value: stats?.totalProducts || 0,
      desc: `${stats?.lowStockCount || 0} products low in stock`,
      icon: <Package className="h-5 w-5 text-blue-400" />,
      bg: 'bg-blue-500/5 border-blue-500/10'
    },
    {
      title: "Active Retailers",
      value: stats?.totalShops || 0,
      desc: "Delivering daily to local outlets",
      icon: <Store className="h-5 w-5 text-amber-400" />,
      bg: 'bg-amber-500/5 border-amber-500/10'
    }
  ];

  // Colors for bar charts
  const barColors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-in">
      
      {/* 1. Low stock banner alert if any */}
      {stats?.lowStockCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-center justify-between text-xs font-semibold gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-400 flex-shrink-0" />
            <span>CRITICAL INVENTORY ALERT: {stats.lowStockCount} products are below their minimum threshold stock level.</span>
          </div>
          <Link to="/products" className="text-amber-300 hover:text-amber-200 underline inline-flex items-center gap-1">
            Restock Now <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* 2. Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
        {cardItems.map((item, idx) => (
          <Card key={idx} className={`${item.bg} hover:-translate-y-0.5 transition-all duration-200`}>
            <CardContent className="p-5 flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-400 tracking-wide uppercase">{item.title}</span>
                <span className="text-2xl font-black text-slate-100 tracking-tight leading-tight">{item.value}</span>
                <span className="text-[10px] text-slate-500 font-semibold">{item.desc}</span>
              </div>
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">{item.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. Graphs section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Sales history graph */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales & Collection Ledger (Last 30 Days)</CardTitle>
            <CardDescription>Daily gross sales value versus payments collected</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.revenueGraphData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCollection" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickFormatter={(str) => str.split('-')[2]} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelClassName="text-slate-400 text-xs font-semibold"
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" name="Invoice Total" stroke="#6366f1" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                <Area type="monotone" dataKey="collected" name="Amount Paid" stroke="#10b981" fillOpacity={1} fill="url(#colorCollection)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Outstanding credit chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Debtors (Outstanding Balance)</CardTitle>
            <CardDescription>Shops with the highest cumulative credit balances</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {stats?.topDueShops && stats.topDueShops.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topDueShops} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.2} horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={9} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={9} width={90} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px' }}
                  />
                  <Bar dataKey="currentDue" name="Credit Balance" radius={[0, 4, 4, 0]} barSize={14}>
                    {stats.topDueShops.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-semibold text-slate-500">
                No outstanding customer dues recorded
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Profits Analysis section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in">
        
        {/* Profitable Retailers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Retailers by Profitability</CardTitle>
            <CardDescription>Shops contributing the highest net margins</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {stats?.topProfitableShops && stats.topProfitableShops.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topProfitableShops} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.2} horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={9} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={9} width={90} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px' }}
                  />
                  <Bar dataKey="profit" name="Net Profit" radius={[0, 4, 4, 0]} barSize={12} fill="#10b981">
                    {stats.topProfitableShops.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-semibold text-slate-500">
                No retailer profitability recorded
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profitable Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Profitability</CardTitle>
            <CardDescription>Product catalog items generating highest margins</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {stats?.topProfitableProducts && stats.topProfitableProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topProfitableProducts} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.2} horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={9} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={9} width={90} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px' }}
                  />
                  <Bar dataKey="profit" name="Net Profit" radius={[0, 4, 4, 0]} barSize={12} fill="#6366f1">
                    {stats.topProfitableProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={barColors[(index + 2) % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-semibold text-slate-500">
                No product profitability recorded
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* 4. Recent activity split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Recent Deliveries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Recent Delivery Invoices</CardTitle>
              <CardDescription>Latest order shipments dispatched to shops</CardDescription>
            </div>
            <Link to="/deliveries" className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold inline-flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/30 text-slate-400 font-semibold border-b border-slate-900 uppercase">
                  <tr>
                    <th className="p-4">Invoice #</th>
                    <th className="p-4">Retail Shop</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40">
                  {stats?.recentDeliveries && stats.recentDeliveries.length > 0 ? (
                    stats.recentDeliveries.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-900/10">
                        <td className="p-4 font-bold text-slate-200">{d.deliveryNumber}</td>
                        <td className="p-4 font-semibold text-slate-300">{d.shop.name}</td>
                        <td className="p-4 font-bold text-slate-200">₹{d.totalAmount.toLocaleString('en-IN')}</td>
                        <td className="p-4">
                          <Badge variant={d.paymentStatus === 'paid' ? 'success' : d.paymentStatus === 'partial' ? 'warning' : 'danger'}>
                            {d.paymentStatus}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-4 text-center text-slate-500 font-medium">No deliveries logged today</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Recent Payment Log</CardTitle>
              <CardDescription>Latest payment collections logged in system</CardDescription>
            </div>
            <Link to="/payments" className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/30 text-slate-400 font-semibold border-b border-slate-900 uppercase">
                  <tr>
                    <th className="p-4">Shop</th>
                    <th className="p-4">Payment Date</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40">
                  {stats?.recentPayments && stats.recentPayments.length > 0 ? (
                    stats.recentPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/10">
                        <td className="p-4 font-semibold text-slate-300">{p.shop.name}</td>
                        <td className="p-4 font-semibold text-slate-400">
                          {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-4"><Badge>{p.paymentMethod}</Badge></td>
                        <td className="p-4 font-bold text-emerald-400">+₹{p.paidAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-4 text-center text-slate-500 font-medium">No collections logged today</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;
