const express = require('express');
const { body, query } = require('express-validator');
const User = require('../models/User');
const Course = require('../models/Course');
const Transaction = require('../models/Transaction');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors, sanitizeInput } = require('../middleware/validation');
const creditsConfig = require('../config/credits');

const router = express.Router();

// @desc    Award performance points to learner
// @route   POST /api/credits/points/award
// @access  Private (instructor or admin)
router.post('/points/award', [
  protect,
  authorize('instructor', 'admin'),
  sanitizeInput,
  body('learnerId')
    .isMongoId()
    .withMessage('Valid learner ID is required'),
  body('courseId')
    .isMongoId()
    .withMessage('Valid course ID is required'),
  body('points')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Points must be between 1 and 1000'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { learnerId, courseId, points, reason = 'Course completion' } = req.body;

    // Verify course exists and user is the instructor
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.instructor.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to award points for this course'
      });
    }

    // Get learner
    const learner = await User.findById(learnerId);
    if (!learner) {
      return res.status(404).json({
        success: false,
        message: 'Learner not found'
      });
    }

    // Check if learner is enrolled in the course
    const isEnrolled = learner.enrolledCourses.some(
      enrollment => enrollment.course.equals(courseId)
    );

    if (!isEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Learner is not enrolled in this course'
      });
    }

    // Add performance points and check for badge upgrade
    const oldBadge = `${learner.badge_level} ${learner.badge_tier}`;
    await learner.addPerformancePoints(points);
    const newBadge = `${learner.badge_level} ${learner.badge_tier}`;
    const badgeUpgraded = oldBadge !== newBadge;

    // Create bonus transaction for points
    await Transaction.createBonusTransaction(
      learnerId,
      points,
      reason,
      {
        courseId: courseId,
        awardedBy: req.user._id,
        badgeUpgraded: badgeUpgraded,
        oldBadge: oldBadge,
        newBadge: newBadge
      }
    );

    res.json({
      success: true,
      message: 'Performance points awarded successfully',
      data: {
        learner: {
          id: learner._id,
          username: learner.username,
          performancePoints: learner.performance_points,
          badge: learner.badgeDisplayName,
          badgeUpgraded
        },
        pointsAwarded: points,
        reason
      }
    });
  } catch (error) {
    console.error('Award points error:', error);
    res.status(500).json({
      success: false,
      message: 'Error awarding points',
      error: error.message
    });
  }
});

// @desc    Get user's credit balance and transactions
// @route   GET /api/credits/balance
// @access  Private
router.get('/balance', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('credits performance_points badge_level badge_tier badgeDiscount badgeDisplayName');

    const transactions = await Transaction.find({ user: req.user._id })
      .populate('relatedCourse', 'title')
      .populate('relatedUser', 'username')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        credits: user.credits,
        performancePoints: user.performance_points,
        badge: {
          level: user.badge_level,
          tier: user.badge_tier,
          displayName: user.badgeDisplayName,
          discount: user.badgeDiscount
        },
        recentTransactions: transactions
      }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching balance',
      error: error.message
    });
  }
});

// @desc    Get user's transaction history
// @route   GET /api/credits/transactions
// @access  Private
router.get('/transactions', [
  protect,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('type')
    .optional()
    .isIn(['enroll', 'purchase', 'cashout', 'onboarding', 'bonus', 'refund', 'earn'])
    .withMessage('Invalid transaction type'),
  handleValidationErrors
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };
    if (req.query.type) {
      filter.type = req.query.type;
    }

    const transactions = await Transaction.find(filter)
      .populate('relatedCourse', 'title')
      .populate('relatedUser', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
});

// @desc    Request cashout
// @route   POST /api/credits/cashout
// @access  Private (instructor or admin)
router.post('/cashout', [
  protect,
  authorize('instructor', 'admin'),
  sanitizeInput,
  body('amount')
    .isInt({ min: creditsConfig.minCashoutCredits })
    .withMessage(`Amount must be at least ${creditsConfig.minCashoutCredits} credits`),
  body('paymentMethod')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Payment method cannot exceed 100 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { amount, paymentMethod = 'Bank Transfer' } = req.body;
    const user = await User.findById(req.user._id);

    if (user.credits < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient credits for cashout'
      });
    }

    // Calculate fees
    const cashoutFee = Math.floor(amount * (creditsConfig.cashoutFeePercent / 100));
    const netAmount = amount - cashoutFee;
    const fiatAmount = netAmount * creditsConfig.creditToFiatRate;

    // Deduct credits
    await user.deductCredits(amount);

    // Create cashout transaction
    const transaction = await Transaction.createCashoutTransaction(
      user._id,
      amount,
      cashoutFee,
      {
        paymentMethod,
        fiatAmount,
        creditToFiatRate: creditsConfig.creditToFiatRate
      }
    );

    res.json({
      success: true,
      message: 'Cashout request submitted successfully',
      data: {
        transactionId: transaction._id,
        requestedAmount: amount,
        cashoutFee,
        netAmount,
        fiatAmount: fiatAmount.toFixed(2),
        paymentMethod,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Cashout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing cashout request',
      error: error.message
    });
  }
});

// @desc    Get leaderboard
// @route   GET /api/credits/leaderboard
// @access  Public
router.get('/leaderboard', [
  query('type')
    .optional()
    .isIn(['weekly', 'monthly', 'alltime'])
    .withMessage('Type must be weekly, monthly, or alltime'),
  handleValidationErrors
], async (req, res) => {
  try {
    const type = req.query.type || 'alltime';
    const limit = creditsConfig.leaderboard[`${type}TopCount`] || 10;

    let dateFilter = {};
    if (type === 'weekly') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      dateFilter = { lastActivity: { $gte: oneWeekAgo } };
    } else if (type === 'monthly') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      dateFilter = { lastActivity: { $gte: oneMonthAgo } };
    }

    const users = await User.find({
      ...dateFilter,
      isActive: true
    })
      .select('username avatar performance_points badge_level badge_tier badgeDisplayName enrolledCourses')
      .sort({ performance_points: -1 })
      .limit(limit);

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      id: user._id,
      username: user.username,
      avatar: user.avatar,
      performancePoints: user.performance_points,
      badge: user.badgeDisplayName,
      coursesCompleted: user.enrolledCourses.filter(course => course.completed).length
    }));

    res.json({
      success: true,
      data: {
        type,
        leaderboard,
        total: leaderboard.length
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: error.message
    });
  }
});

module.exports = router;
