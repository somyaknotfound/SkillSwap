const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skillswap');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration script to give 100 credits to all existing users
const migrateCredits = async () => {
  try {
    console.log('Starting credits migration...');
    
    // Find all users who don't have wallet data or have 0 credits
    const users = await User.find({
      $or: [
        { 'wallet.balance': { $exists: false } },
        { 'wallet.balance': 0 },
        { credits: 0 }
      ]
    });

    console.log(`Found ${users.length} users to migrate`);

    for (const user of users) {
      // Initialize wallet if it doesn't exist
      if (!user.wallet) {
        user.wallet = {
          balance: 100,
          totalPurchased: 0,
          totalSpent: 0,
          totalEarned: 0
        };
      } else {
        // Update existing wallet
        user.wallet.balance = 100;
        if (user.wallet.totalPurchased === 0) {
          user.wallet.totalPurchased = 100; // Mark as purchased for initial credits
        }
      }

      // Update credits
      user.credits = 100;

      await user.save();
      console.log(`Updated credits for user: ${user.username}`);
    }

    console.log('Credits migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run migration
connectDB().then(() => {
  migrateCredits();
});
