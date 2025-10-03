const isSignedIn = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  // Optionally store the intended destination
  req.session.returnTo = req.originalUrl;
  res.redirect("/auth/sign-in");
};

module.exports = isSignedIn;