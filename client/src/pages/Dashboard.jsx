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
  TrendingDown,
  Search
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
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [dashboardAreaFilter, setDashboardAreaFilter] = useState('');

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

  // handleDirectDispatch removed - routing to edit modal instead

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-5">
          {[...Array(7)].map((_, i) => (
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
    },
    {
      title: "GST Takecare (Me)",
      value: `₹${(stats?.totalMyGstClaimable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      desc: "Absorbed GST claimable in annual filing",
      icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
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

      {/* 1.5 Today's Deliveries Notification */}
      {stats?.todayDeliveries && stats.todayDeliveries.length > 0 && (
        <Card className="border-indigo-500/10 shadow-lg relative overflow-hidden backdrop-blur-md">
          {/* Visual Accent/Glow Indicator */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-405" />
          
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 gap-3">
            <div>
              <CardTitle className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Today's Scheduled Deliveries & Booked Orders
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-500">Monitor all scheduled delivery items and dispatch booked orders for today</CardDescription>
            </div>
            <Link
              to={`/deliveries?stage=ordered&date=${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
              className="px-3.5 py-1.5 bg-indigo-650/15 hover:bg-indigo-650/25 border border-indigo-550/20 hover:border-indigo-550/45 text-indigo-400 hover:text-indigo-300 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              Filter Today's Pending Deliveries
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {/* Filter toolbar */}
            {(() => {
              const uniqueAreas = stats?.todayDeliveries
                ? Array.from(new Set(stats.todayDeliveries.map(d => d.shop?.area).filter(Boolean)))
                : [];

              const filteredDeliveries = stats?.todayDeliveries
                ? stats.todayDeliveries.filter(d => {
                    const matchesSearch = 
                      d.shop?.name?.toLowerCase().includes(dashboardSearch.toLowerCase()) || 
                      d.shop?.shopCode?.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
                      d.deliveryNumber?.toLowerCase().includes(dashboardSearch.toLowerCase());
                    const matchesArea = dashboardAreaFilter ? d.shop?.area === dashboardAreaFilter : true;
                    return matchesSearch && matchesArea;
                  })
                : [];

              return (
                <>
                  <div className="flex flex-col sm:flex-row gap-3 px-4 py-3 border-b border-slate-900/60 items-center justify-between bg-slate-900/10">
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1">
                      {/* Search Shop Input */}
                      <div className="relative max-w-xs w-full">
                        <span className="absolute left-3 top-2.5 text-slate-500"><Search className="h-3.5 w-3.5" /></span>
                        <input
                          type="text"
                          placeholder="Search code or shop..."
                          className="w-full bg-slate-950/20 border border-slate-900 text-xs rounded-lg pl-8 pr-3 py-2 text-slate-200 focus:outline-none focus:border-slate-800"
                          value={dashboardSearch}
                          onChange={(e) => setDashboardSearch(e.target.value)}
                        />
                      </div>
                      
                      {/* Area Dropdown Select */}
                      <select
                        className="bg-slate-950/20 border border-slate-900 text-xs font-semibold text-slate-400 rounded-lg px-3 py-2 outline-none cursor-pointer hover:border-slate-800"
                        value={dashboardAreaFilter}
                        onChange={(e) => setDashboardAreaFilter(e.target.value)}
                      >
                        <option value="">All Areas</option>
                        {uniqueAreas.map(area => (
                          <option key={area} value={area}>{area}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="text-[10px] text-indigo-400 font-bold uppercase bg-indigo-500/5 border border-indigo-500/10 px-2.5 py-1.5 rounded-md">
                      {filteredDeliveries.length} Pending
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900/35 text-slate-400 font-semibold border-b border-slate-900/60 uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-4">Invoice #</th>
                          <th className="p-4">Retail Shop</th>
                          <th className="p-4">Dispatched Time</th>
                          <th className="p-4">Products & Pack Sizes</th>
                          <th className="p-4">Total Value</th>
                          <th className="p-4">Stage</th>
                          <th className="p-4 text-center">Quick Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/40">
                        {filteredDeliveries.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="p-8 text-center text-slate-500 font-semibold">
                              No pending scheduled deliveries match your filter
                            </td>
                          </tr>
                        ) : (
                          filteredDeliveries.map((delivery) => (
                            <tr key={delivery.id} className="hover:bg-slate-900/10 transition-colors duration-150">
                              <td className="p-4 font-bold text-slate-200">{delivery.deliveryNumber}</td>
                              <td className="p-4">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-slate-200">{delivery.shop?.name}</span>
                                    {delivery.shop?.shopCode && (
                                      <Badge variant="indigo" className="text-[9px] px-1 py-0 font-mono font-bold bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
                                        {delivery.shop.shopCode}
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-medium">{delivery.shop?.area || delivery.shop?.address}</span>
                                </div>
                              </td>
                              <td className="p-4 font-semibold text-slate-400">
                                {new Date(delivery.deliveryDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col gap-1 max-w-xs">
                                  {delivery.items?.map((item) => (
                                    <span key={item.id} className="text-[11px] text-slate-350 truncate">
                                      • <span className="font-semibold text-slate-200">{item.product?.name}</span>
                                      <span className="text-indigo-400 font-bold ml-1">x{item.quantity}</span>
                                      <span className="text-slate-500 text-[10px] ml-1">
                                        (Lot Size: {item.lotSize} {item.product?.unitType || 'pcs'})
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="p-4 font-bold text-slate-200">
                                <div className="flex flex-col gap-0.5">
                                  <span>₹{delivery.totalAmount.toLocaleString('en-IN')}</span>
                                  <span className={`text-[9px] font-bold ${
                                    delivery.paymentStatus === 'paid' ? 'text-emerald-400' : delivery.paymentStatus === 'partial' ? 'text-amber-400' : 'text-rose-450'
                                  }`}>
                                    {delivery.paymentStatus.toUpperCase()}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                <Badge variant={delivery.status === 'delivered' ? 'success' : 'info'}>
                                  {delivery.status === 'delivered' ? 'DISPATCHED' : 'PENDING'}
                                </Badge>
                              </td>
                              <td className="p-4 text-center">
                                {delivery.status === 'ordered' ? (
                                  <Link
                                    to={`/deliveries?dispatchId=${delivery.id}`}
                                    title="Review & Edit Order details before Dispatching"
                                    className="py-1.5 px-3 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-lg border border-indigo-550/20 shadow hover:-translate-y-0.5 transition-all inline-flex items-center justify-center gap-1 cursor-pointer font-bold text-[10px] uppercase tracking-wider"
                                  >
                                    <Truck className="h-3.5 w-3.5" />
                                    <span>Dispatch</span>
                                  </Link>
                                ) : (
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Completed</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* 2. Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-5">
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
