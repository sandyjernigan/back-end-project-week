const request = require('supertest');
const db = require('../../data/dbConfig.js');

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