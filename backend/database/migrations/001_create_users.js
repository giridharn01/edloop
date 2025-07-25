exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.string('id').primary();
    table.string('username').unique().notNullable();
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('display_name').notNullable();
    table.string('university');
    table.boolean('verified').defaultTo(false);
    table.string('avatar_url');
    table.integer('karma').defaultTo(0);
    table.timestamp('join_date').defaultTo(knex.fn.now());
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
