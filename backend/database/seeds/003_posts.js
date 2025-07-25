exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('posts').del();
  
  const posts = [
    // No seed posts - only user-created posts will appear
  ];

  // Don't insert anything - keep empty
  // await knex('posts').insert(posts);
};
