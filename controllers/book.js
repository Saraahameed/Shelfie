const express = require('express');
const router = express.Router();
const Book = require('../models/Book.js');
const User = require('../models/user.js');

// INDEX - list all books
router.get('/', async (req, res) => {
  try {
    const books = await Book.find().populate('userId', 'username');
    res.render('books/index.ejs', { books });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

// NEW - form to add a new book
router.get('/new', (req, res) => {
  try {
    res.render('books/new.ejs');
  } catch (error) {
    console.log(error);
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
        error: 'This book already exists in our library!'
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

    res.redirect('/books');
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

// SHOW - display a specific book
router.get('/:bookId', async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const book = currentUser.books.id(req.params.bookId);
    res.render('books/show.ejs', { book });
  } catch (error) {
    console.log(error);
    res.redirect('/books');
  }
});

// DELETE - remove a book
router.delete('/:bookId', async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    currentUser.books.id(req.params.bookId).deleteOne();
    await currentUser.save();
    res.redirect('/books');
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

// EDIT - form to edit a book
router.get('/:bookId/edit', async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const book = currentUser.books.id(req.params.bookId);
    res.render('books/edit.ejs', { book });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

// UPDATE - update a book
router.put('/:bookId', async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const book = currentUser.books.id(req.params.bookId);
    book.set(req.body);
    await currentUser.save();
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

    book.reviews.push({
      userId: req.session.user._id,
      username: req.session.user.username,
      rating: req.body.rating,
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