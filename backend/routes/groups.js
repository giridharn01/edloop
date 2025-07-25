const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const Post = require('../models/Post');
const Note = require('../models/Note');
const { authenticateToken: auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all groups with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      search, 
      privacy = 'public',
      sort = 'newest' 
    } = req.query;

    const filter = { privacy };
    
    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    let sortOption = {};
    switch (sort) {
      case 'popular':
        sortOption = { memberCount: -1 };
        break;
      case 'active':
        sortOption = { updatedAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      default: // newest
        sortOption = { createdAt: -1 };
    }

    const groups = await Group.find(filter)
      .populate('creator', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Add member count and transform _id to id for each group
    const groupsWithCount = groups.map(group => ({
      ...group,
      id: group._id.toString(),
      memberCount: group.members.length
    }));

    const total = await Group.countDocuments(filter);

    res.json({
      groups: groupsWithCount,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalGroups: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get group by ID
router.get('/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar')
      .lean();

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Transform _id to id
    const groupWithId = {
      ...group,
      id: group._id.toString(),
      memberCount: group.members.length
    };

    res.json(groupWithId);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new group
router.post('/', auth, [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description must be 1-500 characters'),
  body('category').isIn([
    'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Engineering', 'Business', 'Literature', 'History', 'Psychology',
    'Economics', 'Art', 'Music', 'Philosophy', 'Medicine', 'Law', 'Other'
  ]).withMessage('Invalid category'),
  body('privacy').optional().isIn(['public', 'private']).withMessage('Privacy must be public or private'),
  body('maxMembers').optional().isInt({ min: 2, max: 1000 }).withMessage('Max members must be between 2-1000'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('rules').optional().isArray().withMessage('Rules must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      category,
      privacy = 'public',
      maxMembers = 100,
      tags = [],
      rules = []
    } = req.body;

    // Check if group name already exists
    const existingGroup = await Group.findOne({ 
      name: { $regex: new RegExp('^' + name + '$', 'i') } 
    });
    
    if (existingGroup) {
      return res.status(400).json({ message: 'A group with this name already exists' });
    }

    const group = new Group({
      name,
      description,
      category,
      privacy,
      maxMembers,
      tags: tags.slice(0, 10), // Limit to 10 tags
      rules: rules.slice(0, 10), // Limit to 10 rules
      creator: req.user.id
    });

    await group.save();

    // Populate the created group
    const populatedGroup = await Group.findById(group._id)
      .populate('creator', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar')
      .lean();

    // Transform _id to id and ensure members array exists
    const groupWithId = {
      ...populatedGroup,
      id: populatedGroup._id.toString(),
      memberCount: populatedGroup.members ? populatedGroup.members.length : 0,
      members: populatedGroup.members || []
    };

    res.status(201).json(groupWithId);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update group (only creator and admins)
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ min: 1, max: 500 }),
  body('category').optional().isIn([
    'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Engineering', 'Business', 'Literature', 'History', 'Psychology',
    'Economics', 'Art', 'Music', 'Philosophy', 'Medicine', 'Law', 'Other'
  ]),
  body('tags').optional().isArray(),
  body('rules').optional().isArray(),
  body('maxMembers').optional().isInt({ min: 2, max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is creator or admin
    const member = group.members.find(m => m.user.toString() === req.user.id);
    const isCreator = group.creator.toString() === req.user.id;
    const isAdmin = member && member.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to edit this group' });
    }

    // Update fields
    const updateFields = ['name', 'description', 'category', 'tags', 'rules', 'maxMembers'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'tags' || field === 'rules') {
          group[field] = req.body[field].slice(0, 10);
        } else {
          group[field] = req.body[field];
        }
      }
    });

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate('creator', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar')
      .lean();

    // Transform _id to id
    const groupWithId = {
      ...updatedGroup,
      id: updatedGroup._id.toString(),
      memberCount: updatedGroup.members.length
    };

    res.json(groupWithId);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join group
router.post('/:id/join', auth, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is already a member
    const existingMember = group.members.find(m => m.user.toString() === req.user.id);
    if (existingMember) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    // Check privacy and invite code
    if (group.privacy === 'private') {
      if (!inviteCode || inviteCode !== group.inviteCode) {
        return res.status(400).json({ message: 'Invalid invite code' });
      }
    }

    // Check if group is full
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ message: 'Group is full' });
    }

    // Add user to group
    group.members.push({
      user: req.user.id,
      role: 'member',
      joinedAt: new Date()
    });

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate('creator', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar')
      .lean();

    // Transform _id to id
    const groupWithId = {
      ...updatedGroup,
      id: updatedGroup._id.toString(),
      memberCount: updatedGroup.members.length
    };

    res.json(groupWithId);
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave group
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    const memberIndex = group.members.findIndex(m => m.user.toString() === req.user.id);
    if (memberIndex === -1) {
      return res.status(400).json({ message: 'You are not a member of this group' });
    }

    // Creator cannot leave their own group
    if (group.creator.toString() === req.user.id) {
      return res.status(400).json({ message: 'Group creator cannot leave the group. Transfer ownership or delete the group instead.' });
    }

    // Remove user from group
    group.members.splice(memberIndex, 1);
    await group.save();

    res.json({ message: 'Successfully left the group' });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete group (only creator)
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only creator can delete
    if (group.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the group creator can delete this group' });
    }

    await Group.findByIdAndDelete(req.params.id);
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get group posts
router.get('/:id/posts', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const posts = await Post.find({ group: req.params.id })
      .populate('author', 'username displayName avatar')
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments({ group: req.params.id });

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching group posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get group notes
router.get('/:id/notes', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const notes = await Note.find({ group: req.params.id })
      .populate('author', 'username displayName avatar')
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Note.countDocuments({ group: req.params.id });

    res.json({
      notes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalNotes: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching group notes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
