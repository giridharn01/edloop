exports.up = function(knex) {
  return knex.schema.createTable('communities', function(table) {
    table.string('id').primary();
    table.string('name').unique().notNullable();
    table.string('display_name').notNullable();
    table.text('description');
    table.integer('members').defaultTo(0);
    table.string('icon_url');
    table.enum('category', ['academic', 'university', 'general']).notNullable();
    table.string('subject');
    table.string('created_by').references('id').inTable('users');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('communities');
};
