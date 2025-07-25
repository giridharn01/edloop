const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  
  const users = [
    
  ];

  await knex('users').insert(users);
};
