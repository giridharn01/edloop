const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Community = require('../models/Community');
const User = require('../models/User');
const Post = require('../models/Post');
const router = express.Router();

// Get all communities
router.get('/', async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;
    
    let query = {};
    
    // Add search functionality for communities
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query = {
        $or: [
          { name: { $regex: searchRegex } },
          { display_name: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
          { category: { $regex: searchRegex } },
          { subject: { $regex: searchRegex } }
        ]
      };
    }
    
    const communities = await Community.find(query)
      .populate('created_by', 'username display_name')
      .sort({ members: -1 })
      .limit(parseInt(limit));

    const formattedCommunities = communities.map(community => ({
      id: community._id,
      name: community.name,
      displayName: community.display_name,
      description: community.description,
      members: community.members,
      category: community.category,
      subject: community.subject,
      createdBy: community.created_by ? community.created_by._id : null,
      iconUrl: community.icon_url,
      isPrivate: community.is_private
    }));

    res.json(formattedCommunities);
  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

// Get community by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const community = await Community.findById(id)
      .populate('created_by', 'username display_name');

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    res.json({
      id: community._id,
      name: community.name,
      displayName: community.display_name,
      description: community.description,
      members: community.members,
      category: community.category,
      subject: community.subject,
      createdBy: community.created_by._id,
      iconUrl: community.icon_url,
      isPrivate: community.is_private
    });
  } catch (error) {
    console.error('Error fetching community:', error);
    res.status(500).json({ error: 'Failed to fetch community' });
  }
});

// Get community posts
router.get('/:id/posts', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, sort = 'hot' } = req.query;
    const skip = (page - 1) * limit;

    // Check if community exists
    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    let sortCriteria = {};
    
    // Apply sorting
    switch (sort) {
      case 'new':
        sortCriteria = { createdAt: -1 };
        break;
      case 'top':
        sortCriteria = { upvotes: -1, downvotes: 1 };
        break;
      case 'hot':
      default:
        // For hot sorting, use creation date for now (can be enhanced later)
        sortCriteria = { createdAt: -1 };
        break;
    }

    // Import Post model

    const posts = await Post.find({ community: id })
      .populate('author', 'username display_name university verified karma join_date')
      .populate('community', 'name display_name description members category subject')
      .sort(sortCriteria)
      .limit(parseInt(limit))
      .skip(skip);

    // Transform the data to match frontend expectations
    const transformedPosts = posts.map(post => ({
      id: post._id,
      title: post.title,
      content: post.content,
      type: post.type,
      author: {
        id: post.author._id,
        username: post.author.username,
        displayName: post.author.display_name,
        university: post.author.university,
        verified: post.author.verified,
        karma: post.author.karma,
        joinDate: post.author.join_date
      },
      community: {
        id: post.community._id,
        name: post.community.name,
        displayName: post.community.display_name,
        description: post.community.description,
        members: post.community.members,
        category: post.community.category,
        subject: post.community.subject
      },
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      userVote: null, // TODO: Get user's vote if authenticated
      commentCount: post.comment_count,
      createdAt: post.createdAt,
      tags: post.tags || [],
      ...(post.note_file && {
        noteFile: {
          name: post.note_file.name,
          url: post.note_file.url,
          type: post.note_file.type
        }
      }),
      ...(post.link_url && { linkUrl: post.link_url }),
      ...(post.image_url && { imageUrl: post.image_url })
    }));

    res.json(transformedPosts);
  } catch (error) {
    console.error('Error fetching community posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create a new community
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      displayName, 
      description, 
      category = 'general',
      subject,
      iconUrl 
    } = req.body;

    // Validate required fields
    if (!name || !displayName || !description) {
      return res.status(400).json({ 
        error: 'Name, display name, and description are required' 
      });
    }

    // Validate category
    const validCategories = ['academic', 'university', 'general'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: 'Category must be one of: academic, university, general' 
      });
    }

    // Check if community name already exists
    const existingCommunity = await Community.findOne({ name });

    if (existingCommunity) {
      return res.status(409).json({ 
        error: 'Community with this name already exists' 
      });
    }

    // Create new community
    const community = new Community({
      name,
      display_name: displayName,
      description,
      category,
      subject: subject || undefined,
      icon_url: iconUrl || '',
      members: 1, // Creator is the first member
      created_by: req.user.userId
    });

    await community.save();

    // Populate the created_by field for response
    await community.populate('created_by', 'username display_name');

    res.status(201).json({
      id: community._id,
      name: community.name,
      displayName: community.display_name,
      description: community.description,
      category: community.category,
      subject: community.subject,
      iconUrl: community.icon_url,
      members: community.members,
      createdBy: community.created_by._id,
      createdAt: community.createdAt
    });
  } catch (error) {
    console.error('Error creating community:', error);
    res.status(500).json({ error: 'Failed to create community' });
  }
});

module.exports = router;
