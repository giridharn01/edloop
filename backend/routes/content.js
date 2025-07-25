const express = require('express');
const { body, validationResult } = require('express-validator');
const contentService = require('../services/contentService');

const router = express.Router();

// Validate content
router.post('/validate', [
  body('content').isLength({ min: 1 }),
  body('type').isIn(['post', 'note'])
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, type } = req.body;

    // Validate content
    const validation = contentService.validateContent(content, type);
    
    // Extract metadata
    const metadata = contentService.extractMetadata(content);

    res.json({
      ...validation,
      metadata
    });

  } catch (error) {
    console.error('Error validating content:', error);
    res.status(500).json({ error: 'Failed to validate content' });
  }
});

// Generate content preview
router.post('/preview', [
  body('content').isLength({ min: 1 }),
  body('maxLength').optional().isInt({ min: 50, max: 500 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, maxLength = 200 } = req.body;

    const preview = contentService.generatePreview(content, maxLength);
    const metadata = contentService.extractMetadata(content);

    res.json({
      preview,
      metadata
    });

  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

// Sanitize content
router.post('/sanitize', [
  body('content').isLength({ min: 1 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;

    const sanitizedContent = contentService.sanitizeContent(content);

    res.json({
      sanitizedContent,
      changes: content !== sanitizedContent
    });

  } catch (error) {
    console.error('Error sanitizing content:', error);
    res.status(500).json({ error: 'Failed to sanitize content' });
  }
});

module.exports = router;
