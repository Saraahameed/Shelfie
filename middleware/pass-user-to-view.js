const passUserToView = (req, res, next) => {
  // Make sure user data is available to all views
  res.locals.user = req.session.user || null;
  next();
};

module.exports = passUserToView;
