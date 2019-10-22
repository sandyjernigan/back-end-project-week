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

### ./api/auth/auth-router.js

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

### ./api/auth/auth-router.test.js

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

### ./api/auth/authenticate-middleware.js

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

## User Models 
### ./api/auth/users-model.js

```javascript
const db = require('../data/dbConfig.js');

module.exports = {
  add,
  find,
  findBy,
  findById,
  update,
  remove
};

function find() {
  return db('users')
    .select('id', 'username');
}

function findById(id) {
  return db('users')
    .select('id', 'username')
    .where({ id })
    .first();
}

function findBy(filter) {
  return db('users')
    .where(filter);
}

async function add(user) {
  const [id] = await db('users').insert(user);
  return findById(id);
}

async function update(changes, id) {
  const results = await db('users').where({ id }).update(changes);
  return findById(id);
}

async function remove(id) {
  const results = await findById(id);
  const count = await db('users').where({ id }).del();
  return count >= 1 ? results : null;
}
```

### ./api/auth/users-model.test.js

```javascript
// Testing for users model
const request = require('supertest');
const db = require('../data/dbConfig.js');

// Server file
const Users = require('./users-model.js');

// test setup content
const insertData = { 
  username: 'user', 
  password: 'testpass'
};

describe('Users Model', () => {

  beforeEach(async () => {
    // wipe the database
    await db('users').truncate()
  })

  // test find users
  describe('function find', () => {
    it('find users should resolve to empty array', async () => {
      
      // find() -- all users
      const results = await Users.find()

      // users database should be empty
      expect(results).toEqual([])
    })
  })
  
  // test add user
  describe('function add', () => {
    it('add(user) should resolve to length 1 for database', async () => {
      
      // add(user) - insert user into database
      await Users.add(insertData)

      // assertion
      const results = await db('users');
      expect(results.length).toBe(1);
      expect(results[0].username).toBe('user');
    });

    it('should resolve to the newly created user', async () => {

      // add(user) - insert user into database
      const user = await Users.add(insertData);
      expect(user).toEqual({ id: 1, username: 'user'});
    });
  });
  
  // test findById(id) user
  describe('function findById(id)', () => {
    it('findById(id) should resolve to 1 user', async () => {
      await db('users').insert(insertData);

      // findById(id) -- search database where({ id })
      const user = await Users.findById(1)

      // assertion
      const results = await db('users');
      expect(results.length).toBe(1);
      expect(user.id).toEqual(1);
      expect(user.username).toEqual('user');
    });
  });
  
  // test findBy(filter)
  describe('function findBy(filter)', () => {
    it('findBy(filter) should resolve to 1 user when searching username', async () => {
      const user1 = await db('users').insert(insertData);
      const user2 = await db('users').insert({username: 'user2', password: 'testpass2'});
      const user3 = await db('users').insert({username: 'user3', password: 'testpass3'});

      username = { username: 'user' }

      // findBy(filter) -- search database where({ username })
      const results = await Users.findBy(username)

      // assertion
      expect(results.length).toBe(1);
      expect(results[0].username).toEqual('user');
    });
  });
  
  // test update(changes, id)
  describe('function update(changes, id)', () => {
    it('update(changes, id) should resolve to 1 user with new changes', async () => {
      // test setup
      const user = await db('users').insert(insertData);
      let users = await db('users');

      expect(users.length).toBe(1);
      expect(users[0].id).toBe(1);

      const changeData = { 
        username: 'updateduser', 
        password: 'testpass'
      };

      await Users.update(changeData, 1);
      
      expect(users[0].id).toEqual({ 
        id: 1, 
        username: 'updateduser', 
        password: 'testpass'
      });
    });
  });
  
  // test remove(id)
  describe('remove user', () => {
    it('should remove the entry from the database', async () => {
      // test setup
      const user = await db('users').insert(insertData);
      let users = await db('users');

      expect(users.length).toBe(1);
      expect(users[0].id).toBe(1);

      await Users.remove(1);

      users = await db('users');

      expect(users.length).toBe(0);
    });

    it('it should return a count of records removed', async () => {
      // test setup
      await db('users').insert(insertData);

      const count = await Users.remove(1);

      expect(count).toBe(1);
    });
  })

});
```

## Header 
### ./route

```javascript
// 
```