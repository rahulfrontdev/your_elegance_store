const mongoose = require('mongoose');

const connectDB = async () => {
  const isProd = process.env.NODE_ENV === 'production';
  let uri = process.env.MONGO_URI;

  if (!uri) {
    if (isProd) {
      console.error(
        'MongoDB: MONGO_URI is not set. Add it to your environment or .env (see .env.example).'
      );
      process.exit(1);
    }
    uri = 'mongodb://127.0.0.1:27017';
    console.warn(
      'MongoDB: MONGO_URI not set; using local default mongodb://127.0.0.1:27017 (copy .env.example to .env to configure).'
    );
  }

  const dbName = process.env.MONGO_DB_NAME || 'ecommerce_db';

  try {
    const conn = await mongoose.connect(uri, { dbName });
    console.log(`MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

