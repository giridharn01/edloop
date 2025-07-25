exports.up = function(knex) {
  return knex.schema.createTable('posts', function(table) {
    table.string('id').primary();
    table.string('title').notNullable();
    table.text('content');
    table.enum('type', ['text', 'link', 'image', 'note']).notNullable();
    table.string('author_id').references('id').inTable('users').notNullable();
    table.string('community_id').references('id').inTable('communities').notNullable();
    table.integer('upvotes').defaultTo(0);
    table.integer('downvotes').defaultTo(0);
    table.integer('comment_count').defaultTo(0);
    table.json('tags');
    table.string('note_file_name');
    table.string('note_file_url');
    table.string('note_file_type');
    table.string('link_url');
    table.string('image_url');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('posts');
};
