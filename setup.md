# Setup for Web API

## npm setup
- npm install express knex sqlite3 knex-cleaner bcryptjs cors helmet jsonwebtoken dotenv cross-env express-session connect-session-knex
- npm install jest supertest

### update package.json

```javascript
  "scripts": {
    "start": "node index.js",
    "server": "nodemon index.js",
    "test": "cross-env DB_ENV=testing jest --verbose --watch"
  },
  "jest": {
    "testEnvironment": "node"
  }

 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  
  "devDependencies": {
    "jest": "^24.9.0",
    "nodemon": "^1.19.1",
    "supertest": "^4.0.2"
  }
```

## Knex setup

[Knex](https://knexjs.org/)

### create knexfile.js

#### npx knex init

```javascript
module.exports = {
  development: {
    client: 'sqlite3',
    connection: { filename: './data/db.db3' },
    useNullAsDefault: true,
    migrations: { directory: './data/migrations' },
    seeds: { directory: './data/seeds' },
  },
  testing: {
    client: 'sqlite3',
    connection: { filename: './data/test.db3' },
    useNullAsDefault: true,
    migrations: { directory: './data/migrations' },
    seeds: { directory: './data/seeds' },
  },
};
```

### Setup migrations

#### npx knex migrate:make `migration-name`

Sample of a users database migration

```javascript
exports.up = function(knex) {
  return knex.schema.createTable('users', users => {
    users.increments();
    users.string('username').notNullable().unique();
    users.string('password').notNullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('users');
};
```

#### npx knex migrate:latest

run `npx knex migrate:latest` to setup database table

#### npx knex migrate:latest --env=testing

run `npx knex migrate:latest --env=testing` to setup testing database table

### Setup seeds

#### npx knex seed:make 00-cleanup

```javascript
const cleaner = require('knex-cleaner');

exports.seed = function(knex) {
  return cleaner.clean(knex);
};
```

#### npx knex seed:make 01-user -- This is just an example. Do not use in production

```javascript
exports.seed = function(knex, Promise) {
  return knex('users').insert([
    {
      username: 'baseUser',
      password: 'thiswillnotwork'
    },
  ]);
};
```

#### npx knex seed:run

After seeds are setup run `npx knex seed:run`
Testing Database run `npx knex seed:run --env=testing`

# Create Files for Server

## .env

```javascript
JWT_SECRET='Cookie Monster wants a cookie.'
PORT=3000
```

## index.js

```javascript
require('dotenv').config();

const server = require('./api/server.js');

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n=== Server listening on port ${PORT} ===\n`);
});
```

## ./data/dbConfiq.js

```javascript
const knex = require('knex');

const knexConfig = require('../knexfile.js');

const environment = process.env.DB_ENV || 'development';

module.exports = knex(knexConfig[environment]);
```

## Server

### ./api/server.js

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// require router files
const authenticate = require('../auth/authenticate-middleware.js');
const authRouter = require('../auth/auth-router.js');

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
```

### ./api/server.test.js

```javascript
// Testing for server.js
const request = require('supertest');

// Server file
const server = require('./server.js');

describe('Server', () => {

  describe('GET /', () => {
    it('should run the testing env', () => {
      expect(process.env.DB_ENV).toBe('testing');
    })
    
    it('should return status 200', async () => {
      const res = await request(server)
        .get('/');
      expect(res.status).toBe(200);
    })
  });

});
```

## Auth Router

### ./auth/auth-router.js

```javascript
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'secret should be set in env';

// User Models
const Users = require('./users-model.js');

router.post('/register', (req, res) => {
  // implement registration
  let user = req.body;
  const hash = bcrypt.hashSync(user.password, 12);
  user.password = hash;

  Users.add(user)
    .then(saved => {
      // use function to generate token
      const token = generateToken(saved);
      res.status(201).json({user: saved, token});
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

router.post('/login', (req, res) => {
  // implement login
  let { username, password } = req.body;

  Users.findBy({ username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        // jwt should be generated
        const token = generateToken(user);
        res.status(200).json({
          message: `Welcome ${user.username}!`,
          token
        });
      } else {
        res.status(401).json({ message: 'Invalid Request. Please check the username and password submitted.' });
      }
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

function generateToken(user) {
  const payload = {
    sub: 'user token',
    id: user.id,
    username: user.username
  };

  const options = {
    expiresIn: '1d', // expires in 1 day
  };

  // extract the secret away so it can be required and used where needed
  return jwt.sign(payload, jwtSecret, options);
}

module.exports = router;
```

### ./auth/auth-router.test.js

```javascript
const request = require('supertest');
const db = require('../database/dbConfig.js');

const router = require('./auth-router.js');

// test setup
const testUser = {
  username: 'user',
  password: 'pass'
};

describe('Auth Router', () => {

  beforeEach(async () => {
    // wipe the database
    await db('users').truncate();
  })

  // Add Testing for POST /api/auth/register
  describe('test register', () => {
        
    it('should add user and return status 201', () => {
      request(router)
        .post('/api/auth/register')
        .send(testUser)        
        .set('Accept', 'application/json')
        .expect(201);
    })
  });

  // Add Testing for POST /api/auth/login
  describe('test login', () => {
        
    it('should return user and return status 200', async () => {

      // test setup first add user
      await db('users').insert(testUser);

      // test if user can login
      const res = request(router)
        .post('/api/auth/login')
        .send(testUser)
        .set('Accept', 'application/json')
        .expect(200, testUser);
    })
  });
});
```

## authenticate-middleware
### ./auth/authenticate-middleware.js

```javascript
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
```

## Header 
### ./route

```javascript
// 
```