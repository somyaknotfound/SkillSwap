const express = require('express');
const { body, query } = require('express-validator');
const Skill = require('../models/Skill');
const User = require('../models/User');
const { protect, checkOwnership } = require('../middleware/auth');
const { handleValidationErrors, sanitizeInput } = require('../middleware/validation');

const router = express.Router();

// @desc    Get user's skills
// @route   GET /api/skills/my
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const skills = await Skill.find({ user: req.user._id })
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: skills.length,
      skills
    });
  } catch (error) {
    console.error('Get user skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user skills',
      error: error.message
    });
  }
});

// @desc    Get all skills (with pagination and filtering)
// @route   GET /api/skills
// @access  Public
router.get('/', [
  sanitizeInput,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('category')
    .optional()
    .isIn(['programming', 'design', 'music', 'business', 'languages', 'photography', 'writing', 'marketing', 'cooking', 'fitness', 'art', 'other'])
    .withMessage('Invalid category'),
  query('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Invalid level'),
  query('status')
    .optional()
    .isIn(['learning', 'completed', 'paused', 'abandoned'])
    .withMessage('Invalid status'),
  query('isTeaching')
    .optional()
    .isBoolean()
    .withMessage('isTeaching must be a boolean'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters'),
  query('sortBy')
    .optional()
    .isIn(['title', 'level', 'progress', 'rating', 'createdAt', 'lastUpdated'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  handleValidationErrors
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isPublic: true };
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.level) {
      filter.level = req.query.level;
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.isTeaching !== undefined) {
      filter.isTeaching = req.query.isTeaching === 'true';
    }

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Build sort object
    const sortBy = req.query.sortBy || 'lastUpdated';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const skills = await Skill.find(filter)
      .populate('user', 'username firstName lastName avatar rating')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Skill.countDocuments(filter);

    res.json({
      success: true,
      count: skills.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      skills
    });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching skills',
      error: error.message
    });
  }
});

// @desc    Get skill by ID
// @route   GET /api/skills/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
      .populate('user', 'username firstName lastName avatar bio rating')
      .populate('prerequisites', 'title level category')
      .populate('relatedSkills', 'title level category progress');

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    // Increment view count
    skill.analytics.views += 1;
    await skill.save();

    res.json({
      success: true,
      skill
    });
  } catch (error) {
    console.error('Get skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching skill',
      error: error.message
    });
  }
});

// @desc    Create new skill
// @route   POST /api/skills
// @access  Private
router.post('/', [
  protect,
  sanitizeInput,
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('category')
    .isIn(['programming', 'design', 'music', 'business', 'languages', 'photography', 'writing', 'marketing', 'cooking', 'fitness', 'art', 'other'])
    .withMessage('Invalid category'),
  body('level')
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Invalid level'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard', 'expert'])
    .withMessage('Invalid difficulty'),
  body('estimatedCompletionTime')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated completion time must be a positive number'),
  handleValidationErrors
], async (req, res) => {
  try {
    const skillData = {
      ...req.body,
      user: req.user._id
    };

    const skill = await Skill.create(skillData);

    // Add skill to user's skills
    await User.findByIdAndUpdate(req.user._id, {
      $push: { skills: skill._id }
    });

    res.status(201).json({
      success: true,
      message: 'Skill created successfully',
      skill
    });
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating skill',
      error: error.message
    });
  }
});

// @desc    Update skill
// @route   PUT /api/skills/:id
// @access  Private
router.put('/:id', [
  protect,
  checkOwnership(Skill),
  sanitizeInput,
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('category')
    .optional()
    .isIn(['programming', 'design', 'music', 'business', 'languages', 'photography', 'writing', 'marketing', 'cooking', 'fitness', 'art', 'other'])
    .withMessage('Invalid category'),
  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Invalid level'),
  body('status')
    .optional()
    .isIn(['learning', 'completed', 'paused', 'abandoned'])
    .withMessage('Invalid status'),
  handleValidationErrors
], async (req, res) => {
  try {
    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'username firstName lastName avatar');

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    res.json({
      success: true,
      message: 'Skill updated successfully',
      skill
    });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating skill',
      error: error.message
    });
  }
});

// @desc    Update skill progress
// @route   PATCH /api/skills/:id/progress
// @access  Private
router.patch('/:id/progress', [
  protect,
  checkOwnership(Skill),
  sanitizeInput,
  body('progress')
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be between 0 and 100'),
  handleValidationErrors
], async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    await skill.updateProgress(req.body.progress);

    res.json({
      success: true,
      message: 'Progress updated successfully',
      skill: {
        id: skill._id,
        title: skill.title,
        progress: skill.progress,
        status: skill.status
      }
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating progress',
      error: error.message
    });
  }
});

// @desc    Add milestone to skill
// @route   POST /api/skills/:id/milestones
// @access  Private
router.post('/:id/milestones', [
  protect,
  checkOwnership(Skill),
  sanitizeInput,
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Milestone title is required and cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Description cannot exceed 300 characters'),
  body('targetDate')
    .optional()
    .isISO8601()
    .withMessage('Target date must be a valid date'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  handleValidationErrors
], async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    await skill.addMilestone(
      req.body.title,
      req.body.description,
      req.body.targetDate,
      req.body.order || 0
    );

    res.json({
      success: true,
      message: 'Milestone added successfully'
    });
  } catch (error) {
    console.error('Add milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding milestone',
      error: error.message
    });
  }
});

// @desc    Complete milestone
// @route   PATCH /api/skills/:id/milestones/:milestoneId/complete
// @access  Private
router.patch('/:id/milestones/:milestoneId/complete', [
  protect,
  checkOwnership(Skill)
], async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    await skill.completeMilestone(req.params.milestoneId);

    res.json({
      success: true,
      message: 'Milestone completed successfully'
    });
  } catch (error) {
    console.error('Complete milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing milestone',
      error: error.message
    });
  }
});

// @desc    Add note to skill
// @route   POST /api/skills/:id/notes
// @access  Private
router.post('/:id/notes', [
  protect,
  checkOwnership(Skill),
  sanitizeInput,
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Note content is required and cannot exceed 1000 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    await skill.addNote(req.body.content);

    res.json({
      success: true,
      message: 'Note added successfully'
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding note',
      error: error.message
    });
  }
});

// @desc    Add resource to skill
// @route   POST /api/skills/:id/resources
// @access  Private
router.post('/:id/resources', [
  protect,
  checkOwnership(Skill),
  sanitizeInput,
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Resource title is required and cannot exceed 100 characters'),
  body('url')
    .isURL()
    .withMessage('Resource URL must be valid'),
  body('type')
    .optional()
    .isIn(['course', 'tutorial', 'book', 'article', 'video', 'practice', 'other'])
    .withMessage('Invalid resource type'),
  handleValidationErrors
], async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    skill.resources.push({
      title: req.body.title,
      url: req.body.url,
      type: req.body.type || 'other'
    });

    await skill.save();

    res.json({
      success: true,
      message: 'Resource added successfully'
    });
  } catch (error) {
    console.error('Add resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding resource',
      error: error.message
    });
  }
});

// @desc    Enroll in skill (for teaching)
// @route   POST /api/skills/:id/enroll
// @access  Private
router.post('/:id/enroll', protect, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    if (!skill.isTeaching) {
      return res.status(400).json({
        success: false,
        message: 'This skill is not available for teaching'
      });
    }

    await skill.enrollStudent(req.user._id);

    res.json({
      success: true,
      message: 'Successfully enrolled in skill',
      skill: {
        id: skill._id,
        title: skill.title,
        instructor: skill.user
      }
    });
  } catch (error) {
    console.error('Enroll skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in skill',
      error: error.message
    });
  }
});

// @desc    Add skill review
// @route   POST /api/skills/:id/reviews
// @access  Private
router.post('/:id/reviews', [
  protect,
  sanitizeInput,
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    // Check if user is enrolled (for teaching skills)
    if (skill.isTeaching) {
      const isEnrolled = skill.students.some(
        student => student.user.equals(req.user._id)
      );

      if (!isEnrolled) {
        return res.status(400).json({
          success: false,
          message: 'Must be enrolled to review this skill'
        });
      }
    }

    await skill.addReview(req.user._id, req.body.rating, req.body.comment);

    res.json({
      success: true,
      message: 'Review added successfully'
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding review',
      error: error.message
    });
  }
});

// @desc    Delete skill
// @route   DELETE /api/skills/:id
// @access  Private
router.delete('/:id', [
  protect,
  checkOwnership(Skill)
], async (req, res) => {
  try {
    const skill = await Skill.findByIdAndDelete(req.params.id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    // Remove skill from user's skills
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { skills: skill._id }
    });

    res.json({
      success: true,
      message: 'Skill deleted successfully'
    });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting skill',
      error: error.message
    });
  }
});

module.exports = router;
