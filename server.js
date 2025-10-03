const dotenv = require('dotenv');
dotenv.config();

require('./config/databse.js');
const express = require('express');
const app = express();
const methodOverride = require('method-override');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require("path");

// Import models
const Book = require('./models/Book.js');

// Import middleware
const isSignedIn = require('./middleware/is-signed-in.js');
const passUserToView = require('./middleware/pass-user-to-view.js');

// Import controllers
const authController = require('./controllers/auth.js');
const booksController = require('./controllers/book.js');

// Set the port
const PORT = process.env.PORT || '3000';

// MIDDLEWARE
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
  })
);

app.use(passUserToView);

// Routes
app.use('/auth', authController);
app.use('/books', isSignedIn, booksController);

// Home route
app.get('/', async (req, res) => {
  try {
    const books = await Book.find().populate('userId', 'username');
    res.render('index.ejs', { books });
  } catch (error) {
    console.log(error);
    res.render('index.ejs', { books: [] });
  }
});

app.get("/vip-lounge", isSignedIn, (req, res) => {
  res.send(`Welcome to the party ${req.session.user.username}.`);
});

app.listen(PORT, () => {
  console.log(`The express app is ready on port ${PORT}!`);
});