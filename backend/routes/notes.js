const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const Note = require('../models/Note');
const User = require('../models/User');
const Community = require('../models/Community');
const algoliaService = require('../services/algoliaService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/notes');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit (increased for larger files)
    files: 10 // Maximum 10 files (increased)
  },
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, documents, and more file types
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|md|rtf|odt|ods|odp|csv|zip|rar|7z/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    // Define allowed MIME types for better validation
    const allowedMimeTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/markdown',
      'application/rtf',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.presentation',
      'text/csv',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed'
    ];
    
    const mimetypeValid = allowedMimeTypes.includes(file.mimetype);
    
    if (mimetypeValid && extname) {
      return cb(null, true);
    } else {
      cb(new Error(`File type not supported. Allowed types: images, PDFs, documents, spreadsheets, presentations, text files, and archives`));
    }
  }
});

// Get all notes with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      community, 
      subject, 
      category, 
      author, 
      search,
      difficulty,
      sort = 'recent'
    } = req.query;
    
    const skip = (page - 1) * limit;

    // Try Algolia search first if search query is provided and Algolia is configured
    if (search && algoliaService.isConfigured()) {
      try {
        const algoliaResult = await algoliaService.searchNotes(search, {
          page: parseInt(page),
          limit: parseInt(limit),
          community,
          category,
          difficulty,
          author
        });

        if (algoliaResult) {
          return res.json({
            notes: algoliaResult.hits.map(hit => ({
              id: hit.objectID,
              title: hit.title,
              content: hit.content.substring(0, 200) + (hit.content.length > 200 ? '...' : ''),
              subject: hit.subject,
              category: hit.category,
              difficulty_level: hit.difficulty_level,
              tags: hit.tags,
              views_count: hit.views_count,
              likes_count: hit.likes_count,
              shares_count: hit.shares_count || 0,
              author: hit.author,
              community: hit.community,
              attachments: [],
              createdAt: hit.createdAt,
              is_public: hit.is_public
            })),
            totalNotes: algoliaResult.totalHits,
            currentPage: algoliaResult.currentPage,
            totalPages: algoliaResult.totalPages,
            hasNextPage: algoliaResult.currentPage < algoliaResult.totalPages,
            hasPrevPage: algoliaResult.currentPage > 1
          });
        }
      } catch (algoliaError) {
        console.error('Algolia search failed, falling back to MongoDB:', algoliaError);
      }
    }
    
    // Build filter query for MongoDB fallback
    let filter = { is_public: true };
    
    if (community) filter.community = community;
    if (subject) filter.subject = new RegExp(subject, 'i');
    if (category) filter.category = category;
    if (author) filter.author = author;
    if (difficulty) filter.difficulty_level = difficulty;
    
    // Build search query for MongoDB - comprehensive search across multiple fields
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: { $regex: searchRegex } },
        { content: { $regex: searchRegex } },
        { subject: { $regex: searchRegex } },
        { tags: { $in: [searchRegex] } },
        { 'attachments.name': { $regex: searchRegex } },
        { 'attachments.type': { $regex: searchRegex } }
      ];
    }
    
    // Build sort criteria
    let sortCriteria = {};
    switch (sort) {
      case 'recent':
        sortCriteria = { createdAt: -1 };
        break;
      case 'popular':
        sortCriteria = { likes_count: -1, views_count: -1 };
        break;
      case 'views':
        sortCriteria = { views_count: -1 };
        break;
      case 'alphabetical':
        sortCriteria = { title: 1 };
        break;
      default:
        sortCriteria = { createdAt: -1 };
    }
    
    const notes = await Note.find(filter)
      .populate('author', 'username displayName display_name university verified karma')
      .populate('community', 'name displayName display_name description subject')
      .sort(sortCriteria)
      .limit(parseInt(limit))
      .skip(skip);
    
    const totalNotes = await Note.countDocuments(filter);
    
    // Format notes for frontend
    const formattedNotes = notes.map(note => ({
      id: note._id,
      title: note.title,
      content: note.content.substring(0, 200) + (note.content.length > 200 ? '...' : ''),
      subject: note.subject,
      category: note.category,
      difficulty_level: note.difficulty_level,
      tags: note.tags,
      views_count: note.views_count,
      likes_count: note.likes_count,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      author: note.author ? {
        id: note.author._id,
        username: note.author.username,
        displayName: note.author.displayName || note.author.display_name,
        university: note.author.university,
        verified: note.author.verified
      } : null,
      community: note.community ? {
        id: note.community._id,
        name: note.community.name,
        displayName: note.community.displayName || note.community.display_name,
        subject: note.community.subject
      } : null,
      attachments: note.attachments.map(att => ({
        name: att.name,
        type: att.type,
        size: att.size
      })),
      hasImages: note.images.length > 0
    }));
    
    res.json({
      notes: formattedNotes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalNotes / limit),
        totalItems: totalNotes,
        itemsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Get a single note by ID
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('author', 'username display_name university verified karma join_date')
      .populate('community', 'name display_name description subject category')
      .populate('collaborators.user', 'username display_name');
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Increment view count
    note.views_count += 1;
    note.last_accessed = new Date();
    await note.save();
    
    // Format full note for frontend
    const formattedNote = {
      id: note._id,
      title: note.title,
      content: note.content,
      subject: note.subject,
      category: note.category,
      difficulty_level: note.difficulty_level,
      tags: note.tags,
      views_count: note.views_count,
      likes_count: note.likes_count,
      shares_count: note.shares_count,
      version: note.version,
      is_public: note.is_public,
      is_template: note.is_template,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      edited_at: note.edited_at,
      author: note.author ? {
        id: note.author._id,
        username: note.author.username,
        displayName: note.author.display_name,
        university: note.author.university,
        verified: note.author.verified,
        karma: note.author.karma,
        joinDate: note.author.join_date
      } : null,
      community: note.community ? {
        id: note.community._id,
        name: note.community.name,
        displayName: note.community.display_name,
        description: note.community.description,
        subject: note.community.subject,
        category: note.community.category
      } : null,
      attachments: note.attachments,
      images: note.images,
      collaborators: note.collaborators.map(collab => ({
        user: {
          id: collab.user._id,
          username: collab.user.username,
          displayName: collab.user.display_name
        },
        permission: collab.permission
      }))
    };
    
    res.json(formattedNote);
    
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// Create a new note
router.post('/', authenticateToken, (req, res, next) => {
  upload.array('attachments', 10)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ error: 'Too many files. Maximum is 10 files.' });
        }
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, [
  body('title').isLength({ min: 1, max: 300 }).trim(),
  body('content').isLength({ min: 1, max: 50000 }),
  body('subject').isLength({ min: 1, max: 100 }).trim(),
  body('communityId').isLength({ min: 1 }),
  body('category').isIn(['lecture', 'study-guide', 'summary', 'homework', 'exam-prep', 'research', 'other']),
  body('difficulty_level').optional().isIn(['beginner', 'intermediate', 'advanced'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      title, 
      content, 
      subject, 
      communityId, 
      category, 
      difficulty_level = 'intermediate',
      images = []
    } = req.body;

    // Parse tags from JSON string if present
    let tags = [];
    if (req.body.tags) {
      try {
        tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
        if (!Array.isArray(tags)) tags = [];
      } catch (e) {
        tags = [];
      }
    }

    // Parse is_public boolean
    let is_public = true;
    if (req.body.is_public !== undefined) {
      is_public = req.body.is_public === 'true' || req.body.is_public === true;
    }

    // Verify user exists
    const user = await User.findById(req.user.userId || req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify community exists
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Process uploaded files
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push({
          name: file.originalname,
          url: `/uploads/notes/${file.filename}`,
          type: path.extname(file.originalname).substring(1).toLowerCase(),
          size: file.size,
          uploaded_at: new Date()
        });
      });
    }

    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('req.files:', req.files);
    console.log('Number of files:', req.files ? req.files.length : 0);
    console.log('Processed attachments:', JSON.stringify(attachments, null, 2));
    console.log('Attachments type:', typeof attachments);
    console.log('Is attachments array:', Array.isArray(attachments));
    console.log('=========================');

    // Create new note
    const noteData = {
      title,
      content,
      subject,
      author: req.user.userId || req.user.id,
      community: communityId,
      category,
      difficulty_level,
      tags: Array.isArray(tags) ? tags : [],
      is_public,
      attachments,
      images: Array.isArray(images) ? images : []
    };

    console.log('=== NOTE CREATION DEBUG ===');
    console.log('noteData.attachments:', JSON.stringify(noteData.attachments, null, 2));
    console.log('noteData.attachments type:', typeof noteData.attachments);
    console.log('Is noteData.attachments array:', Array.isArray(noteData.attachments));
    console.log('============================');

    let note;
    try {
      note = new Note(noteData);
      console.log('Note created successfully, now saving...');
      await note.save();
      console.log('Note saved successfully!');
    } catch (saveError) {
      console.error('Error creating/saving note:', saveError);
      console.error('Save error details:', saveError.message);
      if (saveError.errors) {
        Object.keys(saveError.errors).forEach(key => {
          console.error(`Field error [${key}]:`, saveError.errors[key].message);
          console.error(`Field value [${key}]:`, saveError.errors[key].value);
          console.error(`Field value type [${key}]:`, typeof saveError.errors[key].value);
        });
      }
      return res.status(400).json({ 
        error: 'Note validation failed', 
        details: saveError.message,
        fields: saveError.errors ? Object.keys(saveError.errors) : []
      });
    }

    // Populate the note with author and community data
    await note.populate('author', 'username displayName display_name university verified karma');
    await note.populate('community', 'name displayName display_name description subject');

    // Save to Algolia if configured
    try {
      await algoliaService.saveNote(note);
    } catch (algoliaError) {
      console.error('Failed to save note to Algolia:', algoliaError);
      // Don't fail the request if Algolia fails
    }

    // Format response
    const formattedNote = {
      id: note._id,
      title: note.title,
      content: note.content,
      subject: note.subject,
      category: note.category,
      difficulty_level: note.difficulty_level,
      tags: note.tags,
      views_count: note.views_count,
      likes_count: note.likes_count,
      is_public: note.is_public,
      createdAt: note.createdAt,
      author: note.author ? {
        id: note.author._id,
        username: note.author.username,
        displayName: note.author.display_name,
        university: note.author.university,
        verified: note.author.verified
      } : null,
      community: note.community ? {
        id: note.community._id,
        name: note.community.name,
        displayName: note.community.display_name,
        subject: note.community.subject
      } : null,
      attachments: note.attachments,
      images: note.images
    };

    res.status(201).json(formattedNote);

  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update a note
router.put('/:id', authenticateToken, (req, res, next) => {
  upload.array('newAttachments', 10)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ error: 'Too many files. Maximum is 10 files.' });
        }
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, [
  body('title').optional().isLength({ min: 1, max: 300 }).trim(),
  body('content').optional().isLength({ min: 1, max: 50000 }),
  body('subject').optional().isLength({ min: 1, max: 100 }).trim(),
  body('category').optional().isIn(['lecture', 'study-guide', 'summary', 'homework', 'exam-prep', 'research', 'other']),
  body('difficulty_level').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('tags').optional().isArray(),
  body('is_public').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if user is authorized to edit
    if (note.author.toString() !== req.user.userId) {
      const collaborator = note.collaborators.find(
        collab => collab.user.toString() === req.user.userId && 
        ['edit', 'admin'].includes(collab.permission)
      );
      if (!collaborator) {
        return res.status(403).json({ error: 'Not authorized to edit this note' });
      }
    }

    // Update fields
    const updateFields = {};
    const allowedFields = ['title', 'content', 'subject', 'category', 'difficulty_level', 'tags', 'is_public', 'images'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    // Process new attachments
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        name: file.originalname,
        url: `/uploads/notes/${file.filename}`,
        type: path.extname(file.originalname).substring(1),
        size: file.size,
        uploaded_at: new Date()
      }));
      updateFields.attachments = [...note.attachments, ...newAttachments];
    }

    // Update version and edited timestamp
    updateFields.version = note.version + 1;
    updateFields.edited_at = new Date();

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).populate('author', 'username display_name university verified')
     .populate('community', 'name display_name subject');

    // Update in Algolia if configured
    try {
      await algoliaService.saveNote(updatedNote);
    } catch (algoliaError) {
      console.error('Failed to update note in Algolia:', algoliaError);
      // Don't fail the request if Algolia fails
    }

    res.json({
      id: updatedNote._id,
      title: updatedNote.title,
      content: updatedNote.content,
      subject: updatedNote.subject,
      category: updatedNote.category,
      difficulty_level: updatedNote.difficulty_level,
      tags: updatedNote.tags,
      version: updatedNote.version,
      is_public: updatedNote.is_public,
      updatedAt: updatedNote.updatedAt,
      edited_at: updatedNote.edited_at,
      attachments: updatedNote.attachments,
      images: updatedNote.images
    });

  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete a note
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if user is authorized to delete
    if (note.author.toString() !== req.user.userId) {
      const collaborator = note.collaborators.find(
        collab => collab.user.toString() === req.user.userId && 
        collab.permission === 'admin'
      );
      if (!collaborator) {
        return res.status(403).json({ error: 'Not authorized to delete this note' });
      }
    }

    // Delete associated files
    note.attachments.forEach(attachment => {
      const filePath = path.join(__dirname, '..', attachment.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await Note.findByIdAndDelete(req.params.id);
    
    // Delete from Algolia if configured
    try {
      await algoliaService.deleteNote(req.params.id);
    } catch (algoliaError) {
      console.error('Failed to delete note from Algolia:', algoliaError);
      // Don't fail the request if Algolia fails
    }
    
    res.json({ message: 'Note deleted successfully' });

  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Like/Unlike a note
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // For simplicity, we'll just increment/decrement the likes count
    // In a real app, you'd want to track which users liked which notes
    note.likes_count += 1;
    await note.save();

    res.json({ likes_count: note.likes_count });

  } catch (error) {
    console.error('Error liking note:', error);
    res.status(500).json({ error: 'Failed to like note' });
  }
});

// Add collaborator to a note
router.post('/:id/collaborators', authenticateToken, [
  body('username').isLength({ min: 1 }),
  body('permission').isIn(['read', 'edit', 'admin'])
], async (req, res) => {
  try {
    const { username, permission } = req.body;

    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if user is authorized to add collaborators
    if (note.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Only the author can add collaborators' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a collaborator
    const existingCollaborator = note.collaborators.find(
      collab => collab.user.toString() === user._id.toString()
    );
    
    if (existingCollaborator) {
      existingCollaborator.permission = permission;
    } else {
      note.collaborators.push({ user: user._id, permission });
    }

    await note.save();
    res.json({ message: 'Collaborator added successfully' });

  } catch (error) {
    console.error('Error adding collaborator:', error);
    res.status(500).json({ error: 'Failed to add collaborator' });
  }
});

module.exports = router;
