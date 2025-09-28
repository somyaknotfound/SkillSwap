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

// Fix wallet and credits synchronization
const fixWalletSync = async () => {
  try {
    console.log('Starting wallet synchronization fix...');
    
    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to check`);

    for (const user of users) {
      let needsUpdate = false;
      
      // Initialize wallet if it doesn't exist
      if (!user.wallet) {
        user.wallet = {
          balance: user.credits || 100,
          totalPurchased: user.credits || 100,
          totalSpent: 0,
          totalEarned: 0
        };
        needsUpdate = true;
        console.log(`Initialized wallet for ${user.username}`);
      } else {
        // Sync credits with wallet balance
        if (user.credits !== user.wallet.balance) {
          user.credits = user.wallet.balance;
          needsUpdate = true;
          console.log(`Synced credits for ${user.username}: ${user.wallet.balance}`);
        }
      }

      if (needsUpdate) {
        await user.save();
        console.log(`Updated user: ${user.username}`);
      }
    }

    console.log('Wallet synchronization fix completed successfully!');
  } catch (error) {
    console.error('Sync error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run fix
connectDB().then(() => {
  fixWalletSync();
});
