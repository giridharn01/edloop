exports.up = function(knex) {
  return knex.schema.createTable('votes', function(table) {
    table.increments('id').primary();
    table.string('user_id').references('id').inTable('users').notNullable();
    table.string('post_id').references('id').inTable('posts').notNullable();
    table.enum('vote_type', ['up', 'down']).notNullable();
    table.timestamps(true, true);
    table.unique(['user_id', 'post_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('votes');
};
