import prisma from '../prisma.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Today's sales
    const todayDeliveries = await prisma.delivery.findMany({
      where: {
        deliveryDate: {
          gte: today,
          lt: tomorrow
        }
      }
    });
    const todaySales = todayDeliveries.reduce((sum, d) => sum + d.totalAmount, 0);
    const todayDeliveryCount = todayDeliveries.length;

    // 2. Total Unpaid Dues (sum of all shops' currentDue)
    const shopsData = await prisma.shop.findMany({
      select: { currentDue: true }
    });
    const totalUnpaid = shopsData.reduce((sum, s) => sum + s.currentDue, 0);

    // Total Paid Amount (sum of all collections)
    const paymentsData = await prisma.payment.findMany({
      select: { paidAmount: true }
    });
    const totalPaid = paymentsData.reduce((sum, p) => sum + p.paidAmount, 0);

    // Calculate profits (totalProfit, shopProfits, productProfits)
    const allDeliveryItems = await prisma.deliveryItem.findMany({
      include: {
        product: true,
        delivery: {
          include: { shop: true }
        }
      }
    });

    let totalProfit = 0;
    const shopProfitsMap = {};
    const productProfitsMap = {};

    allDeliveryItems.forEach(item => {
      if (item.product) {
        const profit = item.totalAmount - (item.product.purchasePrice * item.quantity);
        totalProfit += profit;

        // Group by shop
        if (item.delivery && item.delivery.shop) {
          const shopId = item.delivery.shopId;
          const shopName = item.delivery.shop.name;
          if (!shopProfitsMap[shopId]) {
            shopProfitsMap[shopId] = { name: shopName, profit: 0 };
          }
          shopProfitsMap[shopId].profit += profit;
        }

        // Group by product
        const productId = item.productId;
        const productName = item.product.name;
        if (!productProfitsMap[productId]) {
          productProfitsMap[productId] = { name: productName, profit: 0 };
        }
        productProfitsMap[productId].profit += profit;
      }
    });

    const topProfitableShops = Object.values(shopProfitsMap)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    const topProfitableProducts = Object.values(productProfitsMap)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    // 3. Count products and shops
    const totalProducts = await prisma.product.count();
    const totalShops = await prisma.shop.count();

    // 4. Low stock count
    const products = await prisma.product.findMany({
      select: { currentStock: true, minStockAlert: true }
    });
    const lowStockCount = products.filter(p => p.currentStock <= p.minStockAlert).length;

    // 5. Recent deliveries (top 5)
    const recentDeliveries = await prisma.delivery.findMany({
      take: 5,
      orderBy: { deliveryDate: 'desc' },
      include: { shop: true }
    });

    // 6. Recent payments (top 5)
    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { paymentDate: 'desc' },
      include: { shop: true }
    });

    // 7. Top Selling Products
    const items = await prisma.deliveryItem.findMany({
      include: { product: true }
    });
    const productSalesMap = {};
    items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name: item.product.name,
          sku: item.product.sku,
          quantity: 0,
          revenue: 0
        };
      }
      productSalesMap[item.productId].quantity += item.quantity;
      productSalesMap[item.productId].revenue += item.totalAmount;
    });
    const topSelling = Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 8. Monthly Revenue Graph (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const salesHistory = await prisma.delivery.findMany({
      where: {
        deliveryDate: { gte: thirtyDaysAgo }
      },
      orderBy: { deliveryDate: 'asc' }
    });

    // Group sales by date
    const dailySalesMap = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailySalesMap[dateStr] = { date: dateStr, revenue: 0, collected: 0, outstanding: 0 };
    }

    salesHistory.forEach(d => {
      const dateStr = d.deliveryDate.toISOString().split('T')[0];
      if (dailySalesMap[dateStr]) {
        dailySalesMap[dateStr].revenue += d.totalAmount;
        dailySalesMap[dateStr].collected += d.paidAmount;
        dailySalesMap[dateStr].outstanding += d.remainingDue;
      }
    });

    const revenueGraphData = Object.values(dailySalesMap).sort((a, b) => a.date.localeCompare(b.date));

    // 9. Outstanding payment graph: shop-wise due (top 5)
    const topDueShops = await prisma.shop.findMany({
      where: { currentDue: { gt: 0 } },
      orderBy: { currentDue: 'desc' },
      take: 5,
      select: { name: true, currentDue: true }
    });

    res.json({
      todaySales,
      todayDeliveryCount,
      totalUnpaid,
      totalPaid,
      totalProfit,
      topProfitableShops,
      topProfitableProducts,
      totalProducts,
      totalShops,
      lowStockCount,
      topSelling,
      recentDeliveries,
      recentPayments,
      revenueGraphData,
      topDueShops
    });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const { type, startDate, endDate, shopId } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    if (type === 'sales') {
      // Sales report
      const deliveries = await prisma.delivery.findMany({
        where: {
          deliveryDate: { gte: start, lte: end },
          ...(shopId ? { shopId } : {})
        },
        include: { shop: true, items: true },
        orderBy: { deliveryDate: 'desc' }
      });
      return res.json(deliveries);
    }

    if (type === 'dues') {
      // Outstanding dues
      const shops = await prisma.shop.findMany({
        where: {
          currentDue: { gt: 0 },
          ...(shopId ? { id: shopId } : {})
        },
        orderBy: { currentDue: 'desc' }
      });
      return res.json(shops);
    }

    if (type === 'products') {
      // Product-wise sales report
      const items = await prisma.deliveryItem.findMany({
        where: {
          delivery: {
            deliveryDate: { gte: start, lte: end }
          }
        },
        include: {
          product: {
            include: { category: true }
          }
        }
      });

      const prodMap = {};
      items.forEach(item => {
        if (!prodMap[item.productId]) {
          prodMap[item.productId] = {
            productId: item.productId,
            name: item.product.name,
            sku: item.product.sku,
            category: item.product.category.name,
            quantity: 0,
            revenue: 0,
            purchaseCost: 0
          };
        }
        prodMap[item.productId].quantity += item.quantity;
        prodMap[item.productId].revenue += item.totalAmount;
        prodMap[item.productId].purchaseCost += item.quantity * item.product.purchasePrice;
      });

      const productReport = Object.values(prodMap).map(p => ({
        ...p,
        profit: p.revenue - p.purchaseCost
      }));

      return res.json(productReport);
    }

    if (type === 'collections') {
      // Payment collection report
      const payments = await prisma.payment.findMany({
        where: {
          paymentDate: { gte: start, lte: end },
          ...(shopId ? { shopId } : {})
        },
        include: { shop: true, delivery: true },
        orderBy: { paymentDate: 'desc' }
      });
      return res.json(payments);
    }

    if (type === 'profit') {
      // Profit Report (Revenue - COGS)
      const deliveries = await prisma.delivery.findMany({
        where: {
          deliveryDate: { gte: start, lte: end }
        },
        include: {
          items: {
            include: { product: true }
          }
        }
      });

      let totalSales = 0;
      let totalCogs = 0;

      deliveries.forEach(d => {
        totalSales += d.totalAmount;
        d.items.forEach(item => {
          totalCogs += item.quantity * item.product.purchasePrice;
        });
      });

      return res.json({
        totalSales,
        totalCogs,
        grossProfit: totalSales - totalCogs,
        marginPercent: totalSales > 0 ? ((totalSales - totalCogs) / totalSales) * 100 : 0
      });
    }

    if (type === 'movement') {
      // Stock movement report
      const stockIns = await prisma.stockEntry.findMany({
        where: { date: { gte: start, lte: end } },
        include: { product: true }
      });

      const stockOuts = await prisma.deliveryItem.findMany({
        where: {
          delivery: {
            deliveryDate: { gte: start, lte: end }
          }
        },
        include: { product: true, delivery: true }
      });

      const movements = [];

      stockIns.forEach(sin => {
        movements.push({
          id: sin.id,
          date: sin.date,
          type: 'STOCK_IN',
          reference: `Supplier: ${sin.supplierName} (Inv: ${sin.invoiceNumber})`,
          sku: sin.product.sku,
          productName: sin.product.name,
          quantity: sin.quantity,
          cost: sin.costPrice,
          total: sin.quantity * sin.costPrice
        });
      });

      stockOuts.forEach(sout => {
        movements.push({
          id: sout.id,
          date: sout.delivery.deliveryDate,
          type: 'STOCK_OUT',
          reference: `Delivery Invoice: ${sout.delivery.deliveryNumber}`,
          sku: sout.product.sku,
          productName: sout.product.name,
          quantity: -sout.quantity,
          cost: sout.price,
          total: sout.quantity * sout.price
        });
      });

      // Sort by date descending
      movements.sort((a, b) => b.date - a.date);

      return res.json(movements);
    }

    return res.status(400).json({ message: 'Invalid report type' });
  } catch (error) {
    next(error);
  }
};
