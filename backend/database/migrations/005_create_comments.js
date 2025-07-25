exports.up = function(knex) {
  return knex.schema.createTable('comments', function(table) {
    table.string('id').primary();
    table.text('content').notNullable();
    table.string('author_id').references('id').inTable('users').notNullable();
    table.string('post_id').references('id').inTable('posts').notNullable();
    table.string('parent_id').references('id').inTable('comments');
    table.integer('upvotes').defaultTo(0);
    table.integer('downvotes').defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('comments');
};
