const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const Community = require('../models/Community');
const Vote = require('../models/Vote');

const router = express.Router();

// Get all posts (for main feed)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'hot' } = req.query;
    const skip = (page - 1) * limit;

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
        // For hot sorting, we'll calculate it in JavaScript for simplicity
        // In production, you might want to use MongoDB aggregation pipeline
        sortCriteria = { createdAt: -1 };
        break;
    }

    const posts = await Post.find()
      .populate('author', 'username display_name university verified karma join_date')
      .populate('community', 'name display_name description members category subject')
      .sort(sortCriteria)
      .limit(parseInt(limit))
      .skip(skip);

    // Format posts for frontend
    const formattedPosts = posts.map(post => ({
      id: post._id,
      title: post.title,
      content: post.content,
      type: post.type,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      commentCount: post.comment_count,
      createdAt: post.createdAt,
      tags: post.tags,
      linkUrl: post.link_url,
      imageUrl: post.image_url,
      noteFile: post.note_file,
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
      userVote: null // This would be populated based on authenticated user
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create a new post
router.post('/', authenticateToken, [
  body('title').isLength({ min: 1, max: 300 }).trim(),
  body('content').optional().isLength({ max: 10000 }),
  body('type').isIn(['text', 'link', 'image', 'note']),
  body('communityId').isLength({ min: 1 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, type, communityId, tags, linkUrl, imageUrl, noteFile } = req.body;

    // Verify community exists
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Create new post
    const post = new Post({
      title,
      content,
      type,
      author: req.user.userId,
      community: communityId,
      tags: tags || [],
      link_url: linkUrl,
      image_url: imageUrl,
      note_file: noteFile
    });

    await post.save();

    // Populate the post with author and community data
    await post.populate('author', 'username display_name university verified karma join_date');
    await post.populate('community', 'name display_name description members category subject');

    // Format response
    const formattedPost = {
      id: post._id,
      title: post.title,
      content: post.content,
      type: post.type,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      commentCount: post.comment_count,
      createdAt: post.createdAt,
      tags: post.tags,
      linkUrl: post.link_url,
      imageUrl: post.image_url,
      noteFile: post.note_file,
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
      userVote: null
    };

    res.status(201).json(formattedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get posts by community
router.get('/community/:communityId', async (req, res) => {
  try {
    const { communityId } = req.params;
    const { page = 1, limit = 20, sort = 'hot' } = req.query;
    const skip = (page - 1) * limit;

    let sortCriteria = {};
    
    switch (sort) {
      case 'new':
        sortCriteria = { createdAt: -1 };
        break;
      case 'top':
        sortCriteria = { upvotes: -1, downvotes: 1 };
        break;
      case 'hot':
      default:
        sortCriteria = { createdAt: -1 };
        break;
    }

    const posts = await Post.find({ community: communityId })
      .populate('author', 'username display_name university verified karma join_date')
      .populate('community', 'name display_name description members category subject')
      .sort(sortCriteria)
      .limit(parseInt(limit))
      .skip(skip);

    const formattedPosts = posts.map(post => ({
      id: post._id,
      title: post.title,
      content: post.content,
      type: post.type,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      commentCount: post.comment_count,
      createdAt: post.createdAt,
      tags: post.tags,
      linkUrl: post.link_url,
      imageUrl: post.image_url,
      noteFile: post.note_file,
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
      userVote: null
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error('Error fetching community posts:', error);
    res.status(500).json({ error: 'Failed to fetch community posts' });
  }
});

module.exports = router;
