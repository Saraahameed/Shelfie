const express = require('express');
const router = express.Router();

const User = require('../models/user.js');

// INDEX - list all books for current user
router.get('/', async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const books = currentUser.books;
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
    const currentUser = await User.findById(req.session.user._id);
    currentUser.books.push(req.body);
    await currentUser.save();
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

module.exports = router;