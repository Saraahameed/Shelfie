const express = require('express');
const router = express.Router();
const Book = require('../models/Book.js');
const User = require('../models/user.js');

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
router.post('/', async (req, res) => {
  try {
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
router.put('/:bookId', async (req, res) => {
  try {
    const book = await Book.findOneAndUpdate(
      {
        _id: req.params.bookId,
        userId: req.session.user._id
      },
      req.body,
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

// Add review to a book
router.post('/:bookId/reviews', async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);

    if (!book) {
      return res.redirect('/books');
    }

    // Check if user already reviewed this book
    const existingReview = book.reviews.find(
      review => review.userId.toString() === req.session.user._id.toString()
    );

    if (existingReview) {
      return res.redirect(`/books/${req.params.bookId}?error=You have already reviewed this book`);
    }

    book.reviews.push({
      userId: req.session.user._id,
      username: req.session.user.username,
      rating: parseInt(req.body.rating),
      comment: req.body.comment
    });

    // Calculate new average rating
    const totalRatings = book.reviews.reduce((sum, review) => sum + review.rating, 0);
    book.averageRating = totalRatings / book.reviews.length;

    await book.save();
    res.redirect(`/books/${req.params.bookId}`);
  } catch (error) {
    console.log(error);
    res.redirect('/books');
  }
});

module.exports = router;