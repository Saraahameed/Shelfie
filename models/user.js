const mongoose = require('mongoose');
const bookSchema = require('./Book.js');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  books: [bookSchema]
});

const User = mongoose.model('User', userSchema);

module.exports = User;