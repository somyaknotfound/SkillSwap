// Credits and Badges System Configuration

module.exports = {
  // Platform fees and rates
  platformFeePercent: 2, // 2% platform fee
  minCashoutCredits: 100, // Minimum credits required for cashout
  cashoutFeePercent: 5, // 5% cashout fee
  creditToFiatRate: 0.01, // 1 credit = $0.01 USD
  
  // Badge thresholds
  badgeThresholds: {
    'Bronze': { 1: 0, 2: 100, 3: 250 },
    'Silver': { 1: 500, 2: 750, 3: 1000 },
    'Gold': { 1: 1500, 2: 2000, 3: 2500 },
    'Platinum': { 1: 3500, 2: 4500, 3: 5500 },
    'Diamond': { 1: 7000, 2: 9000, 3: 11000 },
    'Master': { 1: 14000, 2: 18000, 3: 22000 },
    'Legend': { 1: 30000, 2: 40000, 3: 50000 }
  },
  
  // Badge discount percentages
  badgeDiscounts: {
    'Bronze': 0,
    'Silver': 5,
    'Gold': 10,
    'Platinum': 15,
    'Diamond': 20,
    'Master': 25,
    'Legend': 30
  },
  
  // Tier multipliers
  tierMultipliers: {
    1: 1.5,  // Tier I gets 1.5x discount
    2: 1.25, // Tier II gets 1.25x discount
    3: 1     // Tier III gets base discount
  },
  
  // Performance points for course completion
  completionPoints: {
    beginner: 50,
    intermediate: 75,
    advanced: 100
  },
  
  // Onboarding bonus
  onboardingBonus: 50, // Credits given to new users
  
  // Inactivity threshold for decay (in weeks)
  inactivityThresholdWeeks: 6,
  
  // Leaderboard settings
  leaderboard: {
    weeklyTopCount: 5,
    monthlyTopCount: 5,
    allTimeTopCount: 10
  }
};
