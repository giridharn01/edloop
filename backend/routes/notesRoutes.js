const express = require('express');
const router = express.Router();
const {
  uploadNote,
  getAllNotes,
  getNoteById,
  deleteNote,
  searchNotes
} = require('../controllers/noteController');

router.post('/upload', uploadNote);
router.get('/', getAllNotes);
router.get('/search', searchNotes);
router.get('/:id', getNoteById);
router.delete('/:id', deleteNote);

module.exports = router;
