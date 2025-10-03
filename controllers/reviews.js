const express = require('express');
const router = express.Router({ mergeParams: true }); // Enable access to bookId
const Book = require('../models/Book.js');
const mongoose = require('mongoose');

// Add review to a book
router.post('/', async (req, res) => {
    try {
        const book = await Book.findById(req.params.bookId);

        if (!book) {
            return res.redirect('/books');
        }

        // Check if user already reviewed this book
        const existingReview = book.reviews.find(
            review => review.userId && review.userId.equals(req.session.user._id)
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

// Route to display the edit form for a specific review
router.get('/:reviewId/edit', async (req, res) => {
    try {
        const book = await Book.findById(req.params.bookId);
        if (!book) {
            return res.redirect('/books');
        }

        const review = book.reviews.id(req.params.reviewId);
        if (!review) {
            return res.redirect(`/books/${req.params.bookId}`);
        }

        if (!review.userId.equals(req.session.user._id)) {
            return res.redirect(`/books/${req.params.bookId}`);
        }

        res.render('partials/edit.ejs', { bookId: req.params.bookId, review: review });
    } catch (error) {
        console.error("Error displaying edit form:", error);
        res.redirect('/books');
    }
});

// Route to handle updating a specific review
router.put('/:reviewId', async (req, res) => {
    try {
        const book = await Book.findById(req.params.bookId);
        if (!book) {
            return res.redirect('/books');
        }

        const review = book.reviews.id(req.params.reviewId);
        if (!review) {
            return res.redirect(`/books/${req.params.bookId}`);
        }

        if (!review.userId.equals(req.session.user._id)) {
            return res.redirect(`/books/${req.params.bookId}`);
        }

        review.rating = parseInt(req.body.rating);
        review.comment = req.body.comment;
        await book.save();

        res.redirect(`/books/${req.params.bookId}`);
    } catch (error) {
        console.error("Error updating review:", error);
        res.redirect('/books');
    }
});

// Route to handle deleting a specific review
router.delete('/:reviewId', async (req, res) => {
    try {
        const { bookId, reviewId } = req.params;
        const userId = req.session.user._id;

        // Find the book and pull the review if the user is the owner of the review.
        // This is an atomic operation.
        const updatedBook = await Book.findOneAndUpdate(
            { _id: bookId, 'reviews._id': reviewId, 'reviews.userId': userId },
            { $pull: { reviews: { _id: reviewId } } },
            { new: true }
        );

        if (!updatedBook) {
            // This will happen if the book doesn't exist, or if the review doesn't exist,
            // or if the user trying to delete it is not the author of the review.
            return res.redirect(`/books/${bookId}?error=Could not delete review.`);
        }

        // Recalculate average rating after deletion
        if (updatedBook.reviews.length > 0) {
            const totalRatings = updatedBook.reviews.reduce((sum, review) => sum + review.rating, 0);
            updatedBook.averageRating = totalRatings / updatedBook.reviews.length;
        } else {
            updatedBook.averageRating = 0;
        }
        await updatedBook.save();

        res.redirect(`/books/${bookId}`);
    } catch (error) {
        console.error("Error deleting review:", error);
        res.redirect('/books');
    }
});

module.exports = router;