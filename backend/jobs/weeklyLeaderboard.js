const cron = require('node-cron');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const creditsConfig = require('../config/credits');

// Weekly leaderboard promotion job - runs every Sunday at 11:59 PM
const weeklyLeaderboardJob = cron.schedule('59 23 * * 0', async () => {
  console.log('Starting weekly leaderboard job...');
  
  try {
    // Get top 5 learners by performance points this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const topLearners = await User.find({
      lastActivity: { $gte: oneWeekAgo },
      isActive: true,
      role: 'student'
    })
      .select('_id username performance_points badge_level badge_tier')
      .sort({ performance_points: -1 })
      .limit(creditsConfig.leaderboard.weeklyTopCount);

    console.log(`Found ${topLearners.length} top learners for weekly promotion`);

    for (const learner of topLearners) {
      try {
        const oldBadge = `${learner.badge_level} ${learner.badge_tier}`;
        
        // Promote 1 tier if not at max
        if (learner.badge_tier < 3) {
          learner.badge_tier += 1;
          await learner.save();
          
          const newBadge = `${learner.badge_level} ${learner.badge_tier}`;
          
          // Create bonus transaction for promotion
          await Transaction.createBonusTransaction(
            learner._id,
            0, // No credits, just badge promotion
            'Weekly Leaderboard Promotion',
            {
              promotionType: 'tier',
              oldBadge,
              newBadge,
              rank: topLearners.indexOf(learner) + 1,
              performancePoints: learner.performance_points
            }
          );
          
          console.log(`Promoted ${learner.username} from ${oldBadge} to ${newBadge}`);
        } else {
          console.log(`${learner.username} is already at max tier for ${learner.badge_level}`);
        }
      } catch (error) {
        console.error(`Error promoting learner ${learner.username}:`, error);
      }
    }

    console.log('Weekly leaderboard job completed successfully');
  } catch (error) {
    console.error('Weekly leaderboard job failed:', error);
  }
}, {
  scheduled: false,
  timezone: 'UTC'
});

// Monthly decay job - runs on the 1st of every month at 12:00 AM
const monthlyDecayJob = cron.schedule('0 0 1 * *', async () => {
  console.log('Starting monthly decay job...');
  
  try {
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - (creditsConfig.inactivityThresholdWeeks * 7));
    
    // Find inactive learners (>6 weeks without activity)
    const inactiveLearners = await User.find({
      lastActivity: { $lt: sixWeeksAgo },
      isActive: true,
      role: 'student',
      badge_level: { $ne: 'Bronze' } // Don't decay Bronze level users
    })
      .select('_id username badge_level badge_tier lastActivity');

    console.log(`Found ${inactiveLearners.length} inactive learners for decay`);

    for (const learner of inactiveLearners) {
      try {
        const oldBadge = `${learner.badge_level} ${learner.badge_tier}`;
        
        // Drop 1 tier
        if (learner.badge_tier > 1) {
          learner.badge_tier -= 1;
        } else {
          // If at tier 1, drop to previous level tier 3
          const levels = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Legend'];
          const currentLevelIndex = levels.indexOf(learner.badge_level);
          
          if (currentLevelIndex > 0) {
            learner.badge_level = levels[currentLevelIndex - 1];
            learner.badge_tier = 3;
          }
        }
        
        await learner.save();
        
        const newBadge = `${learner.badge_level} ${learner.badge_tier}`;
        
        // Create transaction for decay
        await Transaction.createBonusTransaction(
          learner._id,
          0, // No credits change
          'Monthly Inactivity Decay',
          {
            decayType: 'badge',
            oldBadge,
            newBadge,
            lastActivity: learner.lastActivity,
            inactivityWeeks: creditsConfig.inactivityThresholdWeeks
          }
        );
        
        console.log(`Decayed ${learner.username} from ${oldBadge} to ${newBadge}`);
      } catch (error) {
        console.error(`Error decaying learner ${learner.username}:`, error);
      }
    }

    console.log('Monthly decay job completed successfully');
  } catch (error) {
    console.error('Monthly decay job failed:', error);
  }
}, {
  scheduled: false,
  timezone: 'UTC'
});

// Start jobs if not in test environment
if (process.env.NODE_ENV !== 'test') {
  weeklyLeaderboardJob.start();
  monthlyDecayJob.start();
  console.log('Cron jobs started: weekly leaderboard and monthly decay');
}

module.exports = {
  weeklyLeaderboardJob,
  monthlyDecayJob
};
