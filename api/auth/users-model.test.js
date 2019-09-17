// Testing for users model
const request = require('supertest');
const db = require('../../data/dbConfig.js');

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

      users = await db('users');
      
      expect(users[0]).toEqual({ 
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

      const user = await Users.remove(1);

      expect(user.id).toBe(1);
    });
  })

});