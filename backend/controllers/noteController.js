const Note = require('../models/Note');

// POST /api/notes/upload
exports.uploadNote = async (req, res) => {
  try {
    const newNote = new Note(req.body);
    await newNote.save();
    res.status(201).json({ message: 'Note uploaded', note: newNote });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/notes
exports.getAllNotes = async (req, res) => {
  try {
    const notes = await Note.find().populate('author', 'name email').populate('community', 'name');
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/notes/:id
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate('author').populate('community');
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/notes/:id
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/notes/search?q=keyword
exports.searchNotes = async (req, res) => {
  const { q } = req.query;
  try {
    const results = await Note.find({ $text: { $search: q } });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
