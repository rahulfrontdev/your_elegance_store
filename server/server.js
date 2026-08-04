require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { startDiscountJobs } = require('./jobs/discountCron');

const authRoutes = require('./routes/authRoutes.js');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes.js');
const cartRoutes=require('./routes/cartRoutes.js')
const carouselRoutes = require('./routes/carouselRoutes');
const orderRoutes = require('./routes/orderRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const discountRoutes = require('./routes/discountRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const addressRoutes = require('./routes/addressRoutes');
const reelRoutes = require('./routes/reelRoutes');
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
// const subCategoryRoutes = require('./routes/subCategoryRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
// app.use('/api/subcategories', subCategoryRoutes);
app.use('/api/cart',cartRoutes)
app.use('/api/carousel', carouselRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/catalogs', catalogRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'E-commerce API is running' });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API origin: ${process.env.API_PUBLIC_URL || 'https://yourelegancestore.com'}`);
  console.log(`Upload storage: memory → ${path.join(__dirname, 'uploads')}`);
  startDiscountJobs();
});

