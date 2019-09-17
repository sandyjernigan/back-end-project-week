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

