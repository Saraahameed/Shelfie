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
const multer = require('multer');

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

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/books')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

// Add this middleware before your routes
app.use('/uploads', express.static('public/uploads'));

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