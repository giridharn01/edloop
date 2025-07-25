exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('communities').del();
  
  const communities = [
    // No seed communities - only user-created communities will appear
  ];

  // Don't insert anything - keep empty
  // await knex('communities').insert(communities);
};
