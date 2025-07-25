const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const Community = require('../models/Community');
const Vote = require('../models/Vote');
const algoliaService = require('../services/algoliaService');

const router = express.Router();

// Get all posts (for main feed)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'hot', search } = req.query;
    const skip = (page - 1) * limit;

    // If search query provided, use Algolia
    if (search && search.trim()) {
      try {
        const searchResults = await algoliaService.searchPosts(search.trim());
        
        // Check if Algolia search was successful
        if (searchResults && searchResults.hits) {
          // Get the post IDs from Algolia results
          const postIds = searchResults.hits.map(hit => hit.objectID);
          
          if (postIds.length === 0) {
            return res.json({ posts: [], total: 0, page: parseInt(page), totalPages: 0 });
          }
          
          // Fetch full post data from MongoDB
          const posts = await Post.find({ _id: { $in: postIds } })
            .populate('author', 'username display_name university verified karma join_date')
            .populate('community', 'name display_name description members category subject');
          
          // Sort posts according to Algolia relevance
          const sortedPosts = postIds.map(id => posts.find(post => post._id.toString() === id)).filter(Boolean);
          
          // Format posts for frontend
          const formattedPosts = sortedPosts.map(post => ({
            id: post._id,
            title: post.title,
            content: post.content,
            type: post.type,
            upvotes: post.upvotes,
            downvotes: post.downvotes,
            commentCount: post.comment_count,
            tags: post.tags,
            createdAt: post.createdAt,
            author: post.author ? {
              id: post.author._id,
            username: post.author.username,
            displayName: post.author.display_name,
            university: post.author.university,
            verified: post.author.verified
          } : null,
          community: post.community ? {
            id: post.community._id,
            name: post.community.name,
            displayName: post.community.display_name,
            description: post.community.description
          } : null,
          linkUrl: post.link_url,
          imageUrl: post.image_url,
          noteFile: post.note_file
        }));
        
        return res.json({ 
          posts: formattedPosts, 
          total: searchResults.nbHits, 
          page: parseInt(page), 
          totalPages: Math.ceil(searchResults.nbHits / limit) 
        });
        }
        
      } catch (algoliaError) {
        console.error('Algolia search error:', algoliaError);
        // Fall back to MongoDB text search if Algolia fails
        if (search && search.trim()) {
          try {
            const searchRegex = new RegExp(search.trim(), 'i');
            const posts = await Post.find({
              $or: [
                { title: { $regex: searchRegex } },
                { content: { $regex: searchRegex } },
                { tags: { $in: [searchRegex] } },
                { 'note_file.name': { $regex: searchRegex } },
                { 'note_file.type': { $regex: searchRegex } }
              ]
            })
              .populate('author', 'username display_name university verified karma join_date')
              .populate('community', 'name display_name description members category subject')
              .sort({ createdAt: -1 })
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
              tags: post.tags,
              createdAt: post.createdAt,
              author: post.author ? {
                id: post.author._id,
                username: post.author.username,
                displayName: post.author.display_name,
                university: post.author.university,
                verified: post.author.verified
              } : null,
              community: post.community ? {
                id: post.community._id,
                name: post.community.name,
                displayName: post.community.display_name,
                description: post.community.description
              } : null,
              linkUrl: post.link_url,
              imageUrl: post.image_url,
              noteFile: post.note_file
            }));

            return res.json({ 
              posts: formattedPosts, 
              total: formattedPosts.length, 
              page: parseInt(page), 
              totalPages: Math.ceil(formattedPosts.length / limit) 
            });
          } catch (mongoError) {
            console.error('MongoDB search error:', mongoError);
            return res.json({ posts: [], total: 0, page: parseInt(page), totalPages: 0 });
          }
        }
      }
    }

    // If search was provided but failed in both Algolia and MongoDB, return empty results
    if (search && search.trim()) {
      return res.json({ posts: [], total: 0, page: parseInt(page), totalPages: 0 });
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
      author: post.author ? {
        id: post.author._id,
        username: post.author.username,
        displayName: post.author.display_name,
        university: post.author.university,
        verified: post.author.verified,
        karma: post.author.karma,
        joinDate: post.author.join_date
      } : null,
      community: post.community ? {
        id: post.community._id,
        name: post.community.name,
        displayName: post.community.display_name,
        description: post.community.description,
        members: post.community.members,
        category: post.community.category,
        subject: post.community.subject
      } : null,
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
  body('tags').optional().isArray(),
  body('linkUrl').optional().isURL(),
  body('imageUrl').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, type, communityId, tags, linkUrl, imageUrl, noteFile } = req.body;

    // Validate required content based on post type
    if (type === 'text' && !content) {
      return res.status(400).json({ error: 'Content is required for text posts' });
    }
    if (type === 'link' && !linkUrl) {
      return res.status(400).json({ error: 'Link URL is required for link posts' });
    }
    if (type === 'image' && !imageUrl) {
      return res.status(400).json({ error: 'Image URL is required for image posts' });
    }
    if (type === 'note' && !noteFile) {
      return res.status(400).json({ error: 'Note file is required for note posts' });
    }

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

    // Save to Algolia if configured
    try {
      await algoliaService.savePost(post);
    } catch (algoliaError) {
      console.error('Failed to save post to Algolia:', algoliaError);
      // Don't fail the request if Algolia fails
    }

    // Populate the post with author and community data
    await post.populate('author', 'username display_name university verified karma join_date');
    await post.populate('community', 'name display_name description members category subject');

    // Format response
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
      author: post.author ? {
        id: post.author._id,
        username: post.author.username,
        displayName: post.author.display_name,
        university: post.author.university,
        verified: post.author.verified,
        karma: post.author.karma,
        joinDate: post.author.join_date
      } : null,
      community: post.community ? {
        id: post.community._id,
        name: post.community.name,
        displayName: post.community.display_name,
        description: post.community.description,
        members: post.community.members,
        category: post.community.category,
        subject: post.community.subject
      } : null,
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
      author: post.author ? {
        id: post.author._id,
        username: post.author.username,
        displayName: post.author.display_name,
        university: post.author.university,
        verified: post.author.verified,
        karma: post.author.karma,
        joinDate: post.author.join_date
      } : null,
      community: post.community ? {
        id: post.community._id,
        name: post.community.name,
        displayName: post.community.display_name,
        description: post.community.description,
        members: post.community.members,
        category: post.community.category,
        subject: post.community.subject
      } : null,
      userVote: null
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error('Error fetching community posts:', error);
    res.status(500).json({ error: 'Failed to fetch community posts' });
  }
});

// Update a post
router.put('/:id', authenticateToken, [
  body('title').optional().isLength({ min: 1, max: 300 }).withMessage('Title must be between 1 and 300 characters'),
  body('content').optional().isLength({ min: 1, max: 40000 }).withMessage('Content must be between 1 and 40000 characters'),
  body('type').optional().isIn(['text', 'link', 'image', 'note']).withMessage('Invalid post type'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('linkUrl').optional().isURL().withMessage('Invalid URL format'),
  body('imageUrl').optional().isURL().withMessage('Invalid image URL format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, type, tags, linkUrl, imageUrl } = req.body;

    // Find the post
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is authorized to update
    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }

    // Update fields
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (content !== undefined) updateFields.content = content;
    if (type !== undefined) updateFields.type = type;
    if (tags !== undefined) updateFields.tags = tags;
    if (linkUrl !== undefined) updateFields.link_url = linkUrl;
    if (imageUrl !== undefined) updateFields.image_url = imageUrl;
    
    updateFields.updatedAt = new Date();

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).populate('author', 'username display_name university verified karma join_date')
     .populate('community', 'name display_name description members category subject');

    // Update in Algolia if configured
    try {
      await algoliaService.savePost(updatedPost);
    } catch (algoliaError) {
      console.error('Failed to update post in Algolia:', algoliaError);
      // Don't fail the request if Algolia fails
    }

    // Format response
    const formattedPost = {
      id: updatedPost._id,
      title: updatedPost.title,
      content: updatedPost.content,
      type: updatedPost.type,
      upvotes: updatedPost.upvotes,
      downvotes: updatedPost.downvotes,
      commentCount: updatedPost.comment_count,
      createdAt: updatedPost.createdAt,
      updatedAt: updatedPost.updatedAt,
      tags: updatedPost.tags,
      linkUrl: updatedPost.link_url,
      imageUrl: updatedPost.image_url,
      noteFile: updatedPost.note_file,
      author: updatedPost.author ? {
        id: updatedPost.author._id,
        username: updatedPost.author.username,
        displayName: updatedPost.author.display_name,
        university: updatedPost.author.university,
        verified: updatedPost.author.verified,
        karma: updatedPost.author.karma,
        joinDate: updatedPost.author.join_date
      } : null,
      community: updatedPost.community ? {
        id: updatedPost.community._id,
        name: updatedPost.community.name,
        displayName: updatedPost.community.display_name,
        description: updatedPost.community.description,
        members: updatedPost.community.members,
        category: updatedPost.community.category,
        subject: updatedPost.community.subject
      } : null,
      userVote: null
    };

    res.json(formattedPost);

  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete a post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is authorized to delete
    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);
    
    // Delete from Algolia if configured
    try {
      await algoliaService.deletePost(req.params.id);
    } catch (algoliaError) {
      console.error('Failed to delete post from Algolia:', algoliaError);
      // Don't fail the request if Algolia fails
    }
    
    res.json({ message: 'Post deleted successfully' });

  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

module.exports = router;
