const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const Post = require('../models/Post');
const Vote = require('../models/Vote');

const router = express.Router();

// Vote on a post
router.post('/', authenticateToken, [
  body('postId').isLength({ min: 1 }),
  body('voteType').isIn(['up', 'down']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { postId, voteType } = req.body;
    const userId = req.user.userId;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user already voted
    const existingVote = await Vote.findOne({ 
      user: userId, 
      post: postId 
    });

    let newUpvotes = post.upvotes;
    let newDownvotes = post.downvotes;
    let userVote = voteType;

    if (existingVote) {
      // User is changing or removing vote
      if (existingVote.vote_type === voteType) {
        // Removing existing vote
        await Vote.findByIdAndDelete(existingVote._id);
        
        if (voteType === 'up') {
          newUpvotes--;
        } else {
          newDownvotes--;
        }
        userVote = null;
      } else {
        // Switching vote
        existingVote.vote_type = voteType;
        existingVote.updated_at = new Date();
        await existingVote.save();

        if (voteType === 'up') {
          newUpvotes++;
          newDownvotes--;
        } else {
          newUpvotes--;
          newDownvotes++;
        }
      }
    } else {
      // New vote
      const newVote = new Vote({
        user: userId,
        post: postId,
        vote_type: voteType
      });
      await newVote.save();

      if (voteType === 'up') {
        newUpvotes++;
      } else {
        newDownvotes++;
      }
    }

    // Update post vote counts
    post.upvotes = newUpvotes;
    post.downvotes = newDownvotes;
    post.updated_at = new Date();
    await post.save();

    res.json({
      postId,
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      userVote
    });
  } catch (error) {
    console.error('Error processing vote:', error);
    res.status(500).json({ error: 'Failed to process vote' });
  }
});

// Get user's vote for a specific post
router.get('/post/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const vote = await Vote.findOne({ 
      user: userId, 
      post: postId 
    });

    res.json({
      postId,
      userVote: vote ? vote.vote_type : null
    });
  } catch (error) {
    console.error('Error fetching vote:', error);
    res.status(500).json({ error: 'Failed to fetch vote' });
  }
});

module.exports = router;
