const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// require router files
const authenticate = require('./auth/authenticate-middleware.js');
const authRouter = require('./auth/auth-router.js');

const server = express();

server.use(helmet());
server.use(cors());
server.use(express.json());

// Base Route
server.get('/', (req, res) => {
  res.send("<div align=\'center\'>" + 
    "<p>Hello World!</p>" + 
    "<p>This is the Starting Page.</p>" +
    "</div>");
});

// Routes
server.use('/api/auth', authRouter);

module.exports = server;