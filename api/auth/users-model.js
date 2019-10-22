const db = require('../../data/dbConfig.js');

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