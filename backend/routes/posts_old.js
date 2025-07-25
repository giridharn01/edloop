const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get all posts (for main feed)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'hot' } = req.query;
    const offset = (page - 1) * limit;

    let query = req.db('posts')
      .join('users', 'posts.author_id', 'users.id')
      .join('communities', 'posts.community_id', 'communities.id')
      .select(
        'posts.*',
        'users.username',
        'users.display_name as author_display_name',
        'users.university as author_university',
        'users.verified as author_verified',
        'users.karma as author_karma',
        'users.join_date as author_join_date',
        'communities.name as community_name',
        'communities.display_name as community_display_name',
        'communities.description as community_description',
        'communities.members as community_members',
        'communities.category as community_category',
        'communities.subject as community_subject'
      )
      .limit(limit)
      .offset(offset);

    // Apply sorting
    switch (sort) {
      case 'new':
        query = query.orderBy('posts.created_at', 'desc');
        break;
      case 'top':
        query = query.orderByRaw('(posts.upvotes - posts.downvotes) DESC');
        break;
      case 'hot':
      default:
        // Hot algorithm: score / (age in hours + 2)^1.8
        query = query.orderByRaw(`
          (posts.upvotes - posts.downvotes) / 
          POW((julianday('now') - julianday(posts.created_at)) * 24 + 2, 1.8) DESC
        `);
        break;
    }

    const posts = await query;

    // Transform the data to match frontend expectations
    const transformedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      type: post.type,
      author: {
        id: post.author_id,
        username: post.username,
        displayName: post.author_display_name,
        university: post.author_university,
        verified: post.author_verified,
        karma: post.author_karma,
        joinDate: post.author_join_date
      },
      community: {
        id: post.community_id,
        name: post.community_name,
        displayName: post.community_display_name,
        description: post.community_description,
        members: post.community_members,
        category: post.community_category,
        subject: post.community_subject
      },
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      userVote: null, // TODO: Get user's vote if authenticated
      commentCount: post.comment_count,
      createdAt: post.created_at,
      tags: post.tags ? JSON.parse(post.tags) : [],
      ...(post.note_file_name && {
        noteFile: {
          name: post.note_file_name,
          url: post.note_file_url,
          type: post.note_file_type
        }
      }),
      ...(post.link_url && { linkUrl: post.link_url }),
      ...(post.image_url && { imageUrl: post.image_url })
    }));

    res.json(transformedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create a new post
router.post('/', [
  body('title').isLength({ min: 1 }).trim().escape(),
  body('type').isIn(['text', 'link', 'image', 'note']),
  body('communityId').isLength({ min: 1 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      title, 
      content, 
      type, 
      communityId, 
      authorId, 
      tags = [], 
      noteFile,
      linkUrl,
      imageUrl 
    } = req.body;

    // Verify community exists
    const community = await req.db('communities').where('id', communityId).first();
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Create post
    const postId = uuidv4();
    const postData = {
      id: postId,
      title,
      content: content || null,
      type,
      author_id: authorId,
      community_id: communityId,
      upvotes: 1, // Author automatically upvotes
      downvotes: 0,
      comment_count: 0,
      tags: JSON.stringify(tags),
      created_at: new Date(),
      updated_at: new Date()
    };

    // Add type-specific fields
    if (type === 'note' && noteFile) {
      postData.note_file_name = noteFile.name;
      postData.note_file_url = noteFile.url;
      postData.note_file_type = noteFile.type;
    } else if (type === 'link' && linkUrl) {
      postData.link_url = linkUrl;
    } else if (type === 'image' && imageUrl) {
      postData.image_url = imageUrl;
    }

    await req.db('posts').insert(postData);

    // Add author's upvote
    await req.db('votes').insert({
      user_id: authorId,
      post_id: postId,
      vote_type: 'up',
      created_at: new Date(),
      updated_at: new Date()
    });

    // Get the full post with author and community info
    const fullPost = await req.db('posts')
      .join('users', 'posts.author_id', 'users.id')
      .join('communities', 'posts.community_id', 'communities.id')
      .select(
        'posts.*',
        'users.username',
        'users.display_name as author_display_name',
        'users.university as author_university',
        'users.verified as author_verified',
        'users.karma as author_karma',
        'users.join_date as author_join_date',
        'communities.name as community_name',
        'communities.display_name as community_display_name',
        'communities.description as community_description',
        'communities.members as community_members',
        'communities.category as community_category',
        'communities.subject as community_subject'
      )
      .where('posts.id', postId)
      .first();

    // Transform the response
    const transformedPost = {
      id: fullPost.id,
      title: fullPost.title,
      content: fullPost.content,
      type: fullPost.type,
      author: {
        id: fullPost.author_id,
        username: fullPost.username,
        displayName: fullPost.author_display_name,
        university: fullPost.author_university,
        verified: fullPost.author_verified,
        karma: fullPost.author_karma,
        joinDate: fullPost.author_join_date
      },
      community: {
        id: fullPost.community_id,
        name: fullPost.community_name,
        displayName: fullPost.community_display_name,
        description: fullPost.community_description,
        members: fullPost.community_members,
        category: fullPost.community_category,
        subject: fullPost.community_subject
      },
      upvotes: fullPost.upvotes,
      downvotes: fullPost.downvotes,
      userVote: 'up',
      commentCount: fullPost.comment_count,
      createdAt: fullPost.created_at,
      tags: fullPost.tags ? JSON.parse(fullPost.tags) : [],
      ...(fullPost.note_file_name && {
        noteFile: {
          name: fullPost.note_file_name,
          url: fullPost.note_file_url,
          type: fullPost.note_file_type
        }
      }),
      ...(fullPost.link_url && { linkUrl: fullPost.link_url }),
      ...(fullPost.image_url && { imageUrl: fullPost.image_url })
    };

    res.status(201).json(transformedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

module.exports = router;
