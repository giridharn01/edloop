exports.up = function(knex) {
  return knex.schema.createTable('user_communities', function(table) {
    table.increments('id').primary();
    table.string('user_id').references('id').inTable('users').notNullable();
    table.string('community_id').references('id').inTable('communities').notNullable();
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'community_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_communities');
};
