const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ContentService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../uploads');
    this.ensureUploadDirectories();
  }

  ensureUploadDirectories() {
    const directories = ['posts', 'notes', 'images', 'documents'];
    directories.forEach(dir => {
      const fullPath = path.join(this.uploadDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  // Save rich text content with embedded images
  async saveRichContent(content, type = 'post') {
    try {
      // Extract base64 images from content
      const imageRegex = /data:image\/([a-zA-Z]*);base64,([^"]*)/g;
      let processedContent = content;
      const savedImages = [];

      let match;
      while ((match = imageRegex.exec(content)) !== null) {
        const [fullMatch, imageType, base64Data] = match;
        
        // Generate unique filename
        const filename = `${uuidv4()}.${imageType}`;
        const imagePath = path.join(this.uploadDir, 'images', filename);
        
        // Save base64 image to file
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(imagePath, buffer);
        
        // Replace base64 with URL in content
        const imageUrl = `/uploads/images/${filename}`;
        processedContent = processedContent.replace(fullMatch, imageUrl);
        
        savedImages.push({
          originalBase64: fullMatch,
          url: imageUrl,
          filename: filename,
          type: imageType,
          size: buffer.length
        });
      }

      return {
        content: processedContent,
        images: savedImages
      };

    } catch (error) {
      console.error('Error saving rich content:', error);
      throw new Error('Failed to process rich content');
    }
  }

  // Save file attachment
  async saveAttachment(file, type = 'document') {
    try {
      const filename = `${uuidv4()}_${file.originalname}`;
      const filePath = path.join(this.uploadDir, 'documents', filename);
      
      // Move uploaded file to permanent location
      fs.renameSync(file.path, filePath);
      
      return {
        name: file.originalname,
        filename: filename,
        url: `/uploads/documents/${filename}`,
        type: path.extname(file.originalname).substring(1),
        size: file.size,
        mimetype: file.mimetype
      };

    } catch (error) {
      console.error('Error saving attachment:', error);
      throw new Error('Failed to save attachment');
    }
  }

  // Delete content files
  async deleteContentFiles(content, attachments = []) {
    try {
      // Extract image URLs from content
      const imageUrlRegex = /\/uploads\/images\/([^"'\s]+)/g;
      let match;
      
      while ((match = imageUrlRegex.exec(content)) !== null) {
        const filename = match[1];
        const imagePath = path.join(this.uploadDir, 'images', filename);
        
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      // Delete attachment files
      attachments.forEach(attachment => {
        if (attachment.filename) {
          const filePath = path.join(this.uploadDir, 'documents', attachment.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });

    } catch (error) {
      console.error('Error deleting content files:', error);
      // Don't throw error - file cleanup is not critical
    }
  }

  // Validate content
  validateContent(content, type = 'post') {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check content length
    if (type === 'post' && content.length > 10000) {
      validation.isValid = false;
      validation.errors.push('Post content exceeds maximum length of 10,000 characters');
    }

    if (type === 'note' && content.length > 50000) {
      validation.isValid = false;
      validation.errors.push('Note content exceeds maximum length of 50,000 characters');
    }

    // Check for potentially harmful content
    const scriptRegex = /<script[^>]*>.*?<\/script>/gi;
    if (scriptRegex.test(content)) {
      validation.isValid = false;
      validation.errors.push('Script tags are not allowed in content');
    }

    // Count embedded images
    const imageRegex = /data:image\/[^"]+/g;
    const imageMatches = content.match(imageRegex);
    if (imageMatches && imageMatches.length > 10) {
      validation.warnings.push('Content contains many images which may affect performance');
    }

    return validation;
  }

  // Extract content metadata
  extractMetadata(content) {
    const metadata = {
      wordCount: 0,
      imageCount: 0,
      linkCount: 0,
      estimatedReadTime: 0
    };

    // Word count (approximate)
    const textOnly = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    metadata.wordCount = textOnly.split(' ').filter(word => word.length > 0).length;

    // Image count
    const imageRegex = /<img[^>]+>|data:image\/[^"]+/g;
    const imageMatches = content.match(imageRegex);
    metadata.imageCount = imageMatches ? imageMatches.length : 0;

    // Link count
    const linkRegex = /<a[^>]+>|https?:\/\/[^\s<>"]+/g;
    const linkMatches = content.match(linkRegex);
    metadata.linkCount = linkMatches ? linkMatches.length : 0;

    // Estimated read time (assuming 200 words per minute)
    metadata.estimatedReadTime = Math.ceil(metadata.wordCount / 200);

    return metadata;
  }

  // Sanitize content for display
  sanitizeContent(content) {
    // Remove potentially harmful tags and attributes
    let sanitized = content
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      .replace(/javascript:/gi, ''); // Remove javascript: URLs

    return sanitized;
  }

  // Generate content preview
  generatePreview(content, maxLength = 200) {
    // Strip HTML tags and get plain text
    const plainText = content
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (plainText.length <= maxLength) {
      return plainText;
    }

    // Find the last complete word within the limit
    const truncated = plainText.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > maxLength * 0.8) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }

    return truncated + '...';
  }
}

module.exports = new ContentService();
