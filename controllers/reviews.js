const express = require('express');
const router = express.Router({ mergeParams: true }); // Enable access to bookId
const Book = require('../models/Book.js');

// Add review to a book
router.post('/', async (req, res) => {
    try {
        const book = await Book.findById(req.params.bookId);

        if (!book) {
            return res.redirect('/books');
        }

        // Check if user already reviewed this book
        const existingReview = book.reviews.find(
            review => review.userId && review.userId.toString() === req.session.user._id.toString()
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