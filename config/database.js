const mongoose = require('mongoose');

// Database connection configuration
const connectDatabase = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/myapp', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1); // Exit process with failure
  }
};

// Handle database connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB Connection Error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB Disconnected');
});

// Export the connection function
module.exports = connectDatabase; 