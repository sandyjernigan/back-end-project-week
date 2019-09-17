// middleware to check if the user is logged in

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'secret should be set in env';

module.exports = (req, res, next) => {
  const token = req.headers.authorization;
  
  // see if there is a token
  if (token) { 
    //  rehash the header + payload + secret and see if it matches our verify signature
    jwt.verify(token, jwtSecret, (err, decodedToken) => {
      // check if it is valid, error if not
      if (err) {
        console.log(err.message)
        res.status(401).json({ message: 'You shall not pass!' });
      } else { 
        // token is valid
        req.decodedToken = decodedToken;
        next();
      }
    });
  } else {
    res.status(401).json({ message: 'Those without tokens shall not pass!' });
  }

};
