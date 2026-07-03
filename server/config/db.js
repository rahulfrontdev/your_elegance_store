const mongoose = require('mongoose');

const connectDB = async () => {
  let uri = process.env.MONGO_URI;

  if (!uri) {
    console.error(
      'MongoDB: MONGO_URI is not set. Add it to your environment or .env (see .env.example).'
    );
    process.exit(1);
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
