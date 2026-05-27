import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../components/ui/Toast.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Printer, Download, Calendar, Filter, FileSpreadsheet, Percent, Coins, ArrowUpRight } from 'lucide-react';

export const Reports = () => {
  const toast = useToast();
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [shops, setShops] = useState([]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load shops for selection
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const shps = await api.shops.getAll();
        setShops(shps);
      } catch (err) {
        console.error(err);
      }
    };
    fetchShops();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.reports.getReport(reportType, startDate, endDate, selectedShopId);
      setData(res);
    } catch (err) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType, startDate, endDate, selectedShopId]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      toast.warning('No data available to export');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Generate headers and rows dynamically based on type
    if (reportType === 'sales') {
      csvContent += "Invoice Number,Date,Shop Name,Items Count,Total Amount,Paid Amount,Remaining Due,Status\n";
      data.forEach(d => {
        csvContent += `"${d.deliveryNumber}","${new Date(d.deliveryDate).toLocaleDateString('en-IN')}","${d.shop?.name}",${d.items?.length || 0},${d.totalAmount},${d.paidAmount},${d.remainingDue},"${d.paymentStatus}"\n`;
      });
    } else if (reportType === 'dues') {
      csvContent += "Shop Name,Owner Name,Phone Number,Area,Credit Limit,Current Outstanding Due\n";
      data.forEach(s => {
        csvContent += `"${s.name}","${s.ownerName}","${s.phone}","${s.area}",${s.creditLimit},${s.currentDue}\n`;
      });
    } else if (reportType === 'products') {
      csvContent += "Product Name,SKU Code,Category,Units Sold,Revenue Generated,Cost Value,Profit Earned\n";
      data.forEach(p => {
        csvContent += `"${p.name}","${p.sku}","${p.category}",${p.quantity},${p.revenue},${p.purchaseCost},${p.profit}\n`;
      });
    } else if (reportType === 'collections') {
      csvContent += "Payment Date,Shop Name,Payment Method,Invoice Number,Notes,Amount Collected\n";
      data.forEach(p => {
        csvContent += `"${new Date(p.paymentDate).toLocaleDateString('en-IN')}","${p.shop?.name}","${p.paymentMethod}","${p.delivery?.deliveryNumber || 'On Account'}","${p.notes || ''}",${p.paidAmount}\n`;
      });
    } else if (reportType === 'movement') {
      csvContent += "Date,Movement Type,Reference,Product SKU,Product Name,Quantity Change,Unit Rate,Total Value\n";
      data.forEach(m => {
        csvContent += `"${new Date(m.date).toLocaleDateString('en-IN')}","${m.type}","${m.reference}","${m.sku}","${m.productName}",${m.quantity},${m.cost},${m.total}\n`;
      });
    } else if (reportType === 'profit') {
      csvContent += "Gross Sales Revenue,Cost of Goods Sold (COGS),Gross Profit Earned,Profit Margin Percent\n";
      csvContent += `${data.totalSales},${data.totalCogs},${data.grossProfit},${data.marginPercent.toFixed(2)}%\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Report_${reportType}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Report exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 flex flex-col gap-6 animate-fade-in no-print">
      
      {/* 1. Filter Panel */}
      <Card className="bg-slate-950/20 border-slate-900">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
            
            {/* Report Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Report Category</label>
              <select
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 transition-all"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="sales">Daily/Monthly Sales Register</option>
                <option value="dues">Outstanding Shop Dues</option>
                <option value="products">Product-wise Sales Register</option>
                <option value="movement">Stock Movement History (Ledger)</option>
                <option value="collections">Payment Collections Register</option>
                <option value="profit">Profit Margins & Sales COGS</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Start Date</label>
              <Input
                type="date"
                className="py-1.5"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">End Date</label>
              <Input
                type="date"
                className="py-1.5"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Shop filter (Only enabled for certain report types) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Retail Shop (Optional)</label>
              <select
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:pointer-events-none"
                value={selectedShopId}
                disabled={reportType === 'profit' || reportType === 'movement'}
                onChange={(e) => setSelectedShopId(e.target.value)}
              >
                <option value="">All Shops</option>
                {shops.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Action triggers */}
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} variant="secondary" className="py-2 inline-flex items-center gap-1.5">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleExportCSV} variant="primary" className="py-2 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700">
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Special widgets for Profit Margins */}
      {reportType === 'profit' && !loading && data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <Card className="bg-indigo-650/5 border-indigo-900/30">
            <CardContent className="p-5 flex flex-col gap-1">
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Gross Sales Revenue</span>
              <span className="text-xl font-black text-indigo-200">₹{data.totalSales?.toLocaleString('en-IN')}</span>
            </CardContent>
          </Card>
          <Card className="bg-rose-650/5 border-rose-900/30">
            <CardContent className="p-5 flex flex-col gap-1">
              <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Cost of Goods Sold (COGS)</span>
              <span className="text-xl font-black text-rose-200">₹{data.totalCogs?.toLocaleString('en-IN')}</span>
            </CardContent>
          </Card>
          <Card className="bg-emerald-650/5 border-emerald-900/30">
            <CardContent className="p-5 flex flex-col gap-1">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Gross Profit margins</span>
              <span className="text-xl font-black text-emerald-200">₹{data.grossProfit?.toLocaleString('en-IN')}</span>
            </CardContent>
          </Card>
          <Card className="bg-amber-650/5 border-amber-900/30">
            <CardContent className="p-5 flex flex-col gap-1">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Profit Margin %</span>
              <span className="text-xl font-black text-amber-200">{data.marginPercent?.toFixed(2)}%</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. Dynamic Reports Table rendering */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center animate-pulse text-slate-500 font-semibold">Generating report logs...</div>
          ) : !data || (Array.isArray(data) && data.length === 0) ? (
            <div className="p-10 text-center text-slate-500 font-semibold">No transactions recorded inside these date limits</div>
          ) : (
            <Table id="printable-report-table">
              
              {/* Sales Report */}
              {reportType === 'sales' && (
                <>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Retail Shop</TableHead>
                      <TableHead>Line Items</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Remaining Due</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-bold text-slate-200">{d.deliveryNumber}</TableCell>
                        <TableCell className="font-semibold text-slate-400">{new Date(d.deliveryDate).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell className="font-semibold text-slate-350">{d.shop?.name}</TableCell>
                        <TableCell>{d.items?.length || 0} lines</TableCell>
                        <TableCell className="font-bold text-slate-200">₹{d.totalAmount.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="font-semibold text-emerald-400">₹{d.paidAmount.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="font-bold text-rose-400">₹{d.remainingDue.toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          <Badge variant={d.paymentStatus === 'paid' ? 'success' : d.paymentStatus === 'partial' ? 'warning' : 'danger'}>
                            {d.paymentStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              )}

              {/* Outstanding Dues */}
              {reportType === 'dues' && (
                <>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shop Name</TableHead>
                      <TableHead>Owner Name</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Area/Location</TableHead>
                      <TableHead>Credit Limit</TableHead>
                      <TableHead>Current Due Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-bold text-slate-200">{s.name}</TableCell>
                        <TableCell className="font-semibold text-slate-300">{s.ownerName}</TableCell>
                        <TableCell className="font-semibold text-slate-400">{s.phone}</TableCell>
                        <TableCell>{s.area}</TableCell>
                        <TableCell className="font-semibold text-slate-400">₹{s.creditLimit.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="font-bold text-rose-400">₹{s.currentDue.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              )}

              {/* Product Wise Sales */}
              {reportType === 'products' && (
                <>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>SKU Code</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Total Pack Units Sold</TableHead>
                      <TableHead>Gross Revenue</TableHead>
                      <TableHead>Cost Value (COGS)</TableHead>
                      <TableHead>Net Profit Earned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((p) => (
                      <TableRow key={p.productId}>
                        <TableCell className="font-bold text-slate-200">{p.name}</TableCell>
                        <TableCell className="font-mono text-indigo-400 text-xs">{p.sku}</TableCell>
                        <TableCell>{p.category}</TableCell>
                        <TableCell className="font-semibold text-slate-300">{p.quantity} units</TableCell>
                        <TableCell className="font-bold text-slate-200">₹{p.revenue.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="font-semibold text-slate-400">₹{p.purchaseCost.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="font-bold text-emerald-400">₹{p.profit.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              )}

              {/* Payment Collections */}
              {reportType === 'collections' && (
                <>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Collection Date</TableHead>
                      <TableHead>Shop Name</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Linked Invoice</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Collected Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-semibold text-slate-400">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell className="font-bold text-slate-200">{p.shop?.name}</TableCell>
                        <TableCell><Badge>{p.paymentMethod}</Badge></TableCell>
                        <TableCell className="font-mono text-indigo-400 text-xs">{p.delivery?.deliveryNumber || 'On Account'}</TableCell>
                        <TableCell className="text-xs text-slate-500 truncate max-w-xs">{p.notes || '-'}</TableCell>
                        <TableCell className="font-bold text-emerald-400">₹{p.paidAmount.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              )}

              {/* Stock Movement */}
              {reportType === 'movement' && (
                <>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Movement Date</TableHead>
                      <TableHead>Category/Type</TableHead>
                      <TableHead>Reference Details</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Quantity Ledger</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-semibold text-slate-400">{new Date(m.date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell>
                          <Badge variant={m.type === 'STOCK_IN' ? 'success' : 'info'}>
                            {m.type === 'STOCK_IN' ? 'Intake' : 'Delivery'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-300 font-semibold">{m.reference}</TableCell>
                        <TableCell className="font-mono text-xs text-indigo-400">{m.sku}</TableCell>
                        <TableCell className="font-semibold text-slate-350">{m.productName}</TableCell>
                        <TableCell className={`font-bold ${m.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </TableCell>
                        <TableCell className="text-slate-400">₹{m.cost.toFixed(2)}</TableCell>
                        <TableCell className="font-bold text-slate-200">₹{Math.abs(m.total).toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              )}

              {/* Profit summaries if chosen */}
              {reportType === 'profit' && (
                <>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gross sales billing</TableHead>
                      <TableHead>Cost of inventory (COGS)</TableHead>
                      <TableHead>Gross profit margins</TableHead>
                      <TableHead>Profit Margin Percent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="font-bold text-slate-100 text-sm">₹{data.totalSales?.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="font-semibold text-slate-400 text-sm">₹{data.totalCogs?.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="font-bold text-emerald-400 text-sm">₹{data.grossProfit?.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="font-bold text-slate-200 text-sm">{data.marginPercent?.toFixed(2)}%</TableCell>
                    </TableRow>
                  </TableBody>
                </>
              )}

            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* 4. Print-Only Report layout */}
      <div className="hidden print-only flex-col gap-4">
        <div className="text-center border-b border-slate-900 pb-4">
          <h1 className="text-lg font-black tracking-widest uppercase">Wholesale Distributors Ledger Reports</h1>
          <p className="text-xs text-slate-500 font-semibold uppercase mt-1">Category: {reportType} report ({startDate} to {endDate})</p>
        </div>
        
        {/* Render a replica table styled for standard A4 printing */}
        <table className="w-full text-xs text-left border border-slate-300 border-collapse print-table">
          <thead>
            {reportType === 'sales' && (
              <tr className="bg-slate-100">
                <th>Invoice #</th>
                <th>Date</th>
                <th>Retail Shop</th>
                <th>Lines</th>
                <th>Total Amt</th>
                <th>Paid Amt</th>
                <th>Remaining Due</th>
                <th>Status</th>
              </tr>
            )}
            {reportType === 'dues' && (
              <tr className="bg-slate-100">
                <th>Shop Name</th>
                <th>Owner Name</th>
                <th>Phone Number</th>
                <th>Area</th>
                <th>Credit Limit</th>
                <th>Current Due</th>
              </tr>
            )}
            {reportType === 'products' && (
              <tr className="bg-slate-100">
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Qty Sold</th>
                <th>Revenue</th>
                <th>COGS</th>
                <th>Net Profit</th>
              </tr>
            )}
            {reportType === 'collections' && (
              <tr className="bg-slate-100">
                <th>Date</th>
                <th>Shop Name</th>
                <th>Method</th>
                <th>Invoice #</th>
                <th>Amount Collected</th>
              </tr>
            )}
            {reportType === 'movement' && (
              <tr className="bg-slate-100">
                <th>Date</th>
                <th>Type</th>
                <th>Reference</th>
                <th>SKU</th>
                <th>Product</th>
                <th>Qty Ledger</th>
                <th>Rate</th>
                <th>Total Value</th>
              </tr>
            )}
          </thead>
          <tbody>
            {reportType === 'sales' && Array.isArray(data) && data.map(d => (
              <tr key={d.id}>
                <td>{d.deliveryNumber}</td>
                <td>{new Date(d.deliveryDate).toLocaleDateString('en-IN')}</td>
                <td>{d.shop?.name}</td>
                <td>{d.items?.length || 0}</td>
                <td>₹{d.totalAmount}</td>
                <td>₹{d.paidAmount}</td>
                <td>₹{d.remainingDue}</td>
                <td>{d.paymentStatus}</td>
              </tr>
            ))}
            {reportType === 'dues' && Array.isArray(data) && data.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.ownerName}</td>
                <td>{s.phone}</td>
                <td>{s.area}</td>
                <td>₹{s.creditLimit}</td>
                <td>₹{s.currentDue}</td>
              </tr>
            ))}
            {reportType === 'products' && Array.isArray(data) && data.map(p => (
              <tr key={p.productId}>
                <td>{p.name}</td>
                <td>{p.sku}</td>
                <td>{p.category}</td>
                <td>{p.quantity}</td>
                <td>₹{p.revenue}</td>
                <td>₹{p.purchaseCost}</td>
                <td>₹{p.profit}</td>
              </tr>
            ))}
            {reportType === 'collections' && Array.isArray(data) && data.map(p => (
              <tr key={p.id}>
                <td>{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                <td>{p.shop?.name}</td>
                <td>{p.paymentMethod}</td>
                <td>{p.delivery?.deliveryNumber || 'On Account'}</td>
                <td>₹{p.paidAmount}</td>
              </tr>
            ))}
            {reportType === 'movement' && Array.isArray(data) && data.map(m => (
              <tr key={m.id}>
                <td>{new Date(m.date).toLocaleDateString('en-IN')}</td>
                <td>{m.type === 'STOCK_IN' ? 'Intake' : 'Delivery'}</td>
                <td>{m.reference}</td>
                <td>{m.sku}</td>
                <td>{m.productName}</td>
                <td>{m.quantity}</td>
                <td>₹{m.cost}</td>
                <td>₹{m.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Reports;
