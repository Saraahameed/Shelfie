const mongoose = require('mongoose');

// Book schema
const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Want to Read', 'Read'],
    default: 'Want to Read',
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
});

module.exports = bookSchema;