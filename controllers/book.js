const express = require('express');
const router = express.Router();
const Book = require('../models/Book.js');
const User = require('../models/user.js');
const multer = require('multer');

// Configure multer for memory storage instead of disk
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// INDEX - list all books
router.get('/', async (req, res) => {
  try {
    const books = await Book.find({ userId: req.session.user._id })
      .populate('userId', 'username');
    res.render('books/index.ejs', { books });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

// NEW - display form to create new book (Move this BEFORE :bookId routes)
router.get('/new', (req, res) => {
  res.render('books/new.ejs');
});

// DISCOVER - show all books
router.get('/discover', async (req, res) => {
  try {
    const books = await Book.find()
      .populate('userId', 'username')
      .populate('reviews.userId', 'username');
    res.render('books/discover.ejs', { books });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

// CREATE - add new book
router.post('/', upload.single('imageFile'), async (req, res) => {
  try {
    let imageData = '';

    // If a file was uploaded, convert to base64
    if (req.file) {
      imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    // If no file but URL provided, use the URL
    else if (req.body.imageUrl) {
      imageData = req.body.imageUrl;
    }

    // Check if book already exists
    const existingBook = await Book.findOne({
      title: req.body.title,
      author: req.body.author
    });

    if (existingBook) {
      return res.render('books/new.ejs', {
        error: 'This book already exists in the library!'
      });
    }

    // Create new book
    const book = await Book.create({
      ...req.body,
      imageUrl: imageData,
      userId: req.session.user._id
    });

    // Add book reference to user
    await User.findByIdAndUpdate(
      req.session.user._id,
      { $push: { books: book._id } }
    );

    res.redirect('/books?msg=Book added successfully!');
  } catch (error) {
    console.log(error);
    res.render('books/new.ejs', {
      error: 'Error creating book. Please try again.'
    });
  }
});

// All routes with :bookId parameter come AFTER specific routes
router.get('/:bookId', async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId)
      .populate('userId', 'username')
      .populate('reviews.userId', 'username');

    if (!book) {
      return res.redirect('/books');
    }

    res.render('books/show.ejs', {
      book,
      isOwner: book.userId.toString() === req.session.user._id.toString()
    });
  } catch (error) {
    console.log(error);
    res.redirect('/books');
  }
});

// EDIT - form to edit a book
router.get('/:bookId/edit', async (req, res) => {
  try {
    const book = await Book.findOne({
      _id: req.params.bookId,
      userId: req.session.user._id
    });

    if (!book) {
      return res.redirect('/books');
    }

    res.render('books/edit.ejs', { book });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});


// UPDATE - update a book
router.put('/:bookId', upload.single('imageFile'), async (req, res) => {
  try {
    let imageData = req.body.imageUrl; // Keep existing URL if no new file

    // If a file was uploaded, convert to base64
    if (req.file) {
      imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const book = await Book.findOneAndUpdate(
      {
        _id: req.params.bookId,
        userId: req.session.user._id
      },
      {
        ...req.body,
        imageUrl: imageData || req.body.imageUrl // Use new image data or keep existing URL
      },
      { new: true }
    );

    if (!book) {
      return res.redirect('/books');
    }

    res.redirect('/books');
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

// DELETE - remove a book
router.delete('/:bookId', async (req, res) => {
  try {
    const book = await Book.findOne({
      _id: req.params.bookId,
      userId: req.session.user._id
    });

    if (!book) {
      return res.redirect('/books');
    }

    await Book.findByIdAndDelete(req.params.bookId);

    // Remove book reference from user
    await User.findByIdAndUpdate(
      req.session.user._id,
      { $pull: { books: req.params.bookId } }
    );

    res.redirect('/books');
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

const reviewsController = require('./reviews.js');

// Use the reviews controller for review-related routes
router.use('/:bookId/reviews', reviewsController);

module.exports = router;