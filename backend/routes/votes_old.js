const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Vote on a post
router.post('/', [
  body('postId').isLength({ min: 1 }),
  body('userId').isLength({ min: 1 }),
  body('voteType').isIn(['up', 'down']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { postId, userId, voteType } = req.body;

    // Check if post exists
    const post = await req.db('posts').where('id', postId).first();
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user already voted
    const existingVote = await req.db('votes')
      .where({ user_id: userId, post_id: postId })
      .first();

    let newUpvotes = post.upvotes;
    let newDownvotes = post.downvotes;
    let userVote = voteType;

    if (existingVote) {
      // User is changing or removing vote
      if (existingVote.vote_type === voteType) {
        // Removing existing vote
        await req.db('votes')
          .where({ user_id: userId, post_id: postId })
          .del();
        
        if (voteType === 'up') {
          newUpvotes--;
        } else {
          newDownvotes--;
        }
        userVote = null;
      } else {
        // Switching vote
        await req.db('votes')
          .where({ user_id: userId, post_id: postId })
          .update({ 
            vote_type: voteType,
            updated_at: new Date()
          });

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
      await req.db('votes').insert({
        user_id: userId,
        post_id: postId,
        vote_type: voteType,
        created_at: new Date(),
        updated_at: new Date()
      });

      if (voteType === 'up') {
        newUpvotes++;
      } else {
        newDownvotes++;
      }
    }

    // Update post vote counts
    await req.db('posts')
      .where('id', postId)
      .update({
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        updated_at: new Date()
      });

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

module.exports = router;
