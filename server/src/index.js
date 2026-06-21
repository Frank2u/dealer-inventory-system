import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import shopRoutes from './routes/shops.js';
import productRoutes from './routes/products.js';
import stockRoutes from './routes/stock.js';
import deliveryRoutes from './routes/deliveries.js';
import paymentRoutes from './routes/payments.js';
import reportRoutes from './routes/reports.js';
import areaRoutes from './routes/areas.js';
import companyRoutes from './routes/companies.js';
import { errorHandler } from './middleware/error.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true, // Dynamically reflect request origin to support credentials securely
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/companies', companyRoutes);

// Base route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Dealer Inventory System API is running' });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
