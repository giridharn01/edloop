const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// Get current user (requires authentication)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password_hash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      displayName: user.display_name,
      university: user.university,
      verified: user.verified,
      karma: user.karma,
      joinDate: user.join_date,
      bio: user.bio,
      interests: user.interests || [],
      domain: user.domain || '',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password_hash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      displayName: user.display_name,
      university: user.university,
      verified: user.verified,
      karma: user.karma,
      joinDate: user.join_date,
      bio: user.bio,
      interests: user.interests || [],
      domain: user.domain || '',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile (requires authentication)
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { bio, interests, domain, university } = req.body;
    
    const updateData = {};
    if (bio !== undefined) updateData.bio = bio;
    if (interests !== undefined) updateData.interests = interests;
    if (domain !== undefined) updateData.domain = domain;
    if (university !== undefined) updateData.university = university;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true }
    ).select('-password_hash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      displayName: user.display_name,
      university: user.university,
      verified: user.verified,
      karma: user.karma,
      joinDate: user.join_date,
      bio: user.bio,
      interests: user.interests || [],
      domain: user.domain || '',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user's posts (requires authentication)
router.get('/me/posts', authenticateToken, async (req, res) => {
  try {
    const Post = require('../models/Post');
    
    const posts = await Post.find({ author: req.user.userId })
      .populate('author', 'username display_name university verified karma join_date')
      .populate('community', 'name display_name')
      .sort({ createdAt: -1 })
      .limit(50);

    const formattedPosts = posts.map(post => ({
      id: post._id,
      title: post.title,
      content: post.content,
      type: post.type,
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
        displayName: post.community.display_name
      } : null,
      upvotes: post.upvotes || 0,
      downvotes: post.downvotes || 0,
      commentCount: post.comment_count || 0,
      createdAt: post.createdAt,
      tags: post.tags || []
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get user's notes (requires authentication)
router.get('/me/notes', authenticateToken, async (req, res) => {
  try {
    const Note = require('../models/Note');
    
    const notes = await Note.find({ 'collaborators.user': req.user.userId })
      .populate('collaborators.user', 'username display_name university verified')
      .sort({ created_at: -1 })
      .limit(50);

    const formattedNotes = notes.map(note => ({
      id: note._id,
      title: note.title,
      content: note.content,
      subject: note.subject,
      category: note.category,
      difficulty_level: note.difficulty_level,
      tags: note.tags || [],
      author: note.collaborators && note.collaborators.length > 0 ? {
        id: note.collaborators[0].user._id,
        username: note.collaborators[0].user.username,
        displayName: note.collaborators[0].user.display_name,
        university: note.collaborators[0].user.university,
        verified: note.collaborators[0].user.verified
      } : null,
      likes_count: note.likes_count || 0,
      shares_count: note.shares_count || 0,
      views_count: note.views_count || 0,
      created_at: note.created_at,
      attachments: note.attachments || []
    }));

    res.json(formattedNotes);
  } catch (error) {
    console.error('Error fetching user notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

module.exports = router;
