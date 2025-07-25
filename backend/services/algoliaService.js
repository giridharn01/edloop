const algoliasearch = require('algoliasearch');

class AlgoliaService {
  constructor() {
    // Initialize Algolia client
    this.client = null;
    this.notesIndex = null;
    this.postsIndex = null;
    this.groupsIndex = null;
    this.usersIndex = null;
    this.communitiesIndex = null;
    
    // Check if Algolia credentials are provided
    if (process.env.ALGOLIA_APP_ID && process.env.ALGOLIA_API_KEY) {
      this.client = algoliasearch(
        process.env.ALGOLIA_APP_ID,
        process.env.ALGOLIA_API_KEY
      );
      this.notesIndex = this.client.initIndex(process.env.ALGOLIA_INDEX_NAME || 'notes');
      this.postsIndex = this.client.initIndex(process.env.ALGOLIA_POSTS_INDEX_NAME || 'posts');
      this.groupsIndex = this.client.initIndex(process.env.ALGOLIA_GROUPS_INDEX_NAME || 'groups');
      this.usersIndex = this.client.initIndex(process.env.ALGOLIA_USERS_INDEX_NAME || 'users');
      this.communitiesIndex = this.client.initIndex(process.env.ALGOLIA_COMMUNITIES_INDEX_NAME || 'communities');
    } else {
      console.log('Algolia credentials not found. Search will use MongoDB text search.');
    }
  }

  // Check if Algolia is configured
  isConfigured() {
    return this.client !== null;
  }

  // Add or update a note in Algolia
  async saveNote(note) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const algoliaObject = {
        objectID: note._id.toString(),
        title: note.title,
        content: note.content,
        subject: note.subject,
        tags: note.tags || [],
        category: note.category,
        difficulty_level: note.difficulty_level,
        author: {
          id: note.author?._id?.toString() || note.author?.toString() || note.author,
          displayName: note.author?.displayName || note.author?.display_name || 'Unknown User'
        },
        community: {
          id: note.community?._id?.toString() || note.community?.toString() || note.community,
          displayName: note.community?.displayName || note.community?.display_name || 'Unknown Community'
        },
        attachments: note.attachments ? note.attachments.map(att => ({
          name: att.name,
          type: att.type,
          size: att.size
        })) : [],
        attachmentNames: note.attachments ? note.attachments.map(att => att.name).join(' ') : '',
        attachmentTypes: note.attachments ? note.attachments.map(att => att.type).join(' ') : '',
        createdAt: note.createdAt,
        likes_count: note.likes_count || 0,
        views_count: note.views_count || 0,
        is_public: note.is_public
      };

      const result = await this.notesIndex.saveObject(algoliaObject);
      console.log('Note saved to Algolia:', result.objectID);
      return result;
    } catch (error) {
      console.error('Error saving note to Algolia:', error);
      return null;
    }
  }

  // Delete a note from Algolia
  async deleteNote(noteId) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const result = await this.notesIndex.deleteObject(noteId);
      console.log('Note deleted from Algolia:', noteId);
      return result;
    } catch (error) {
      console.error('Error deleting note from Algolia:', error);
      return null;
    }
  }

  // Search notes using Algolia
  async searchNotes(query, filters = {}) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const searchParams = {
        hitsPerPage: filters.limit || 20,
        page: (filters.page || 1) - 1,
        filters: this.buildAlgoliaFilters(filters),
        // More restrictive search parameters for exact matching
        optionalWords: [],
        removeWordsIfNoResults: 'none',
        minWordSizefor1Typo: 10, // Increase typo tolerance threshold
        minWordSizefor2Typos: 20, // Increase typo tolerance threshold
        typoTolerance: 'min', // Minimize typo tolerance for more exact matches
        exactOnSingleWordQuery: 'word', // Use 'word' instead of true
        removeStopWords: false // Don't remove stop words to maintain exact search intent
      };

      const result = await this.notesIndex.search(query, searchParams);
      
      // Additional filtering on the frontend to ensure results actually contain the search query
      const filteredHits = result.hits.filter(hit => {
        const searchLower = query.toLowerCase();
        const titleMatch = hit.title && hit.title.toLowerCase().includes(searchLower);
        const contentMatch = hit.content && hit.content.toLowerCase().includes(searchLower);
        const subjectMatch = hit.subject && hit.subject.toLowerCase().includes(searchLower);
        const tagsMatch = hit.tags && hit.tags.some(tag => tag.toLowerCase().includes(searchLower));
        const attachmentNameMatch = hit.attachmentNames && hit.attachmentNames.toLowerCase().includes(searchLower);
        const attachmentTypeMatch = hit.attachmentTypes && hit.attachmentTypes.toLowerCase().includes(searchLower);
        
        return titleMatch || contentMatch || subjectMatch || tagsMatch || attachmentNameMatch || attachmentTypeMatch;
      });
      
      return {
        hits: filteredHits,
        totalHits: filteredHits.length,
        totalPages: Math.ceil(filteredHits.length / (filters.limit || 20)),
        currentPage: result.page + 1
      };
    } catch (error) {
      console.error('Error searching with Algolia:', error);
      return null;
    }
  }

  // Build Algolia filters from query parameters
  buildAlgoliaFilters(filters) {
    const algoliaFilters = [];

    // Note: Removed is_public filter since we only sync public notes anyway
    
    if (filters.community) {
      algoliaFilters.push(`community.id:${filters.community}`);
    }

    if (filters.category) {
      algoliaFilters.push(`category:${filters.category}`);
    }

    if (filters.difficulty) {
      algoliaFilters.push(`difficulty_level:${filters.difficulty}`);
    }

    if (filters.author) {
      algoliaFilters.push(`author.id:${filters.author}`);
    }

    return algoliaFilters.length > 0 ? algoliaFilters.join(' AND ') : '';
  }

  // Bulk update multiple notes
  async bulkUpdateNotes(notes) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const algoliaObjects = notes.map(note => ({
        objectID: note._id.toString(),
        title: note.title,
        content: note.content,
        subject: note.subject,
        tags: note.tags || [],
        category: note.category,
        difficulty_level: note.difficulty_level,
        author: {
          id: note.author?._id?.toString() || note.author?.toString() || note.author,
          displayName: note.author?.displayName || note.author?.display_name || 'Unknown User'
        },
        community: {
          id: note.community?._id?.toString() || note.community?.toString() || note.community,
          displayName: note.community?.displayName || note.community?.display_name || 'Unknown Community'
        },
        createdAt: note.createdAt,
        likes_count: note.likes_count || 0,
        views_count: note.views_count || 0,
        is_public: note.is_public
      }));

      const result = await this.notesIndex.saveObjects(algoliaObjects);
      console.log(`Bulk updated ${algoliaObjects.length} notes in Algolia`);
      return result;
    } catch (error) {
      console.error('Error bulk updating notes in Algolia:', error);
      return null;
    }
  }

  // Add or update a post in Algolia
  async savePost(post) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const algoliaObject = {
        objectID: post._id.toString(),
        title: post.title,
        content: post.content,
        type: post.type,
        tags: post.tags || [],
        author: {
          id: post.author?._id?.toString() || post.author?.toString() || post.author,
          displayName: post.author?.displayName || post.author?.display_name || 'Unknown User'
        },
        community: {
          id: post.community?._id?.toString() || post.community?.toString() || post.community,
          displayName: post.community?.displayName || post.community?.display_name || 'Unknown Community'
        },
        noteFile: post.note_file ? {
          name: post.note_file.name,
          type: post.note_file.type
        } : null,
        noteFileName: post.note_file ? post.note_file.name : '',
        noteFileType: post.note_file ? post.note_file.type : '',
        createdAt: post.createdAt,
        upvotes: post.upvotes || 0,
        downvotes: post.downvotes || 0,
        commentCount: post.commentCount || 0
      };

      const result = await this.postsIndex.saveObject(algoliaObject);
      console.log('Post saved to Algolia:', result.objectID);
      return result;
    } catch (error) {
      console.error('Error saving post to Algolia:', error);
      return null;
    }
  }

  // Delete a post from Algolia
  async deletePost(postId) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const result = await this.postsIndex.deleteObject(postId);
      console.log('Post deleted from Algolia:', postId);
      return result;
    } catch (error) {
      console.error('Error deleting post from Algolia:', error);
      return null;
    }
  }

  // Search posts using Algolia
  async searchPosts(query, filters = {}) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const searchParams = {
        hitsPerPage: filters.limit || 20,
        page: (filters.page || 1) - 1,
        filters: this.buildPostAlgoliaFilters(filters),
        // More restrictive search parameters for exact matching
        optionalWords: [],
        removeWordsIfNoResults: 'none',
        minWordSizefor1Typo: 10, // Increase typo tolerance threshold
        minWordSizefor2Typos: 20, // Increase typo tolerance threshold
        typoTolerance: 'min', // Minimize typo tolerance for more exact matches
        exactOnSingleWordQuery: 'word', // Use 'word' instead of true
        removeStopWords: false // Don't remove stop words to maintain exact search intent
      };

      const result = await this.postsIndex.search(query, searchParams);
      
      // Additional filtering on the frontend to ensure results actually contain the search query
      const filteredHits = result.hits.filter(hit => {
        const searchLower = query.toLowerCase();
        const titleMatch = hit.title && hit.title.toLowerCase().includes(searchLower);
        const contentMatch = hit.content && hit.content.toLowerCase().includes(searchLower);
        const tagsMatch = hit.tags && hit.tags.some(tag => tag.toLowerCase().includes(searchLower));
        const noteFileNameMatch = hit.noteFileName && hit.noteFileName.toLowerCase().includes(searchLower);
        const noteFileTypeMatch = hit.noteFileType && hit.noteFileType.toLowerCase().includes(searchLower);
        
        return titleMatch || contentMatch || tagsMatch || noteFileNameMatch || noteFileTypeMatch;
      });
      
      return {
        hits: filteredHits,
        totalHits: filteredHits.length,
        totalPages: Math.ceil(filteredHits.length / (filters.limit || 20)),
        currentPage: result.page + 1
      };
    } catch (error) {
      console.error('Error searching posts with Algolia:', error);
      return null;
    }
  }

  // Build Algolia filters for posts
  buildPostAlgoliaFilters(filters) {
    const algoliaFilters = [];

    if (filters.community) {
      algoliaFilters.push(`community.id:${filters.community}`);
    }

    if (filters.type) {
      algoliaFilters.push(`type:${filters.type}`);
    }

    if (filters.author) {
      algoliaFilters.push(`author.id:${filters.author}`);
    }

    return algoliaFilters.join(' AND ');
  }

  // Bulk update multiple posts
  async bulkUpdatePosts(posts) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const algoliaObjects = posts.map(post => ({
        objectID: post._id.toString(),
        title: post.title,
        content: post.content,
        type: post.type,
        tags: post.tags || [],
        author: {
          id: post.author?._id?.toString() || post.author?.toString() || post.author,
          displayName: post.author?.displayName || post.author?.display_name || 'Unknown User'
        },
        community: {
          id: post.community?._id?.toString() || post.community?.toString() || post.community,
          displayName: post.community?.displayName || post.community?.display_name || 'Unknown Community'
        },
        createdAt: post.createdAt,
        upvotes: post.upvotes || 0,
        downvotes: post.downvotes || 0,
        commentCount: post.commentCount || 0
      }));

      const result = await this.postsIndex.saveObjects(algoliaObjects);
      console.log(`Bulk updated ${algoliaObjects.length} posts in Algolia`);
      return result;
    } catch (error) {
      console.error('Error bulk updating posts in Algolia:', error);
      return null;
    }
  }

  // Search both notes and posts
  async searchAll(query, filters = {}) {
    if (!this.isConfigured()) {
      return { notes: null, posts: null, groups: null, users: null, communities: null };
    }

    try {
      const [notesResult, postsResult, groupsResult, usersResult, communitiesResult] = await Promise.all([
        this.searchNotes(query, filters),
        this.searchPosts(query, filters),
        this.searchGroups(query, filters),
        this.searchUsers(query, filters),
        this.searchCommunities(query, filters)
      ]);

      return {
        notes: notesResult,
        posts: postsResult,
        groups: groupsResult,
        users: usersResult,
        communities: communitiesResult
      };
    } catch (error) {
      console.error('Error searching all content with Algolia:', error);
      return { notes: null, posts: null, groups: null, users: null, communities: null };
    }
  }

  // Add or update a group in Algolia
  async saveGroup(group) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const algoliaObject = {
        objectID: group._id.toString(),
        name: group.name,
        description: group.description,
        category: group.category,
        tags: group.tags || [],
        privacy: group.privacy,
        memberCount: group.members ? group.members.length : 0,
        creator: {
          id: group.creator?._id?.toString() || group.creator?.toString() || group.creator,
          displayName: group.creator?.displayName || group.creator?.display_name || 'Unknown User'
        },
        stats: {
          totalPosts: group.stats?.totalPosts || 0,
          totalNotes: group.stats?.totalNotes || 0
        },
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      };

      const result = await this.groupsIndex.saveObject(algoliaObject);
      console.log('Group saved to Algolia:', result.objectID);
      return result;
    } catch (error) {
      console.error('Error saving group to Algolia:', error);
      return null;
    }
  }

  // Delete a group from Algolia
  async deleteGroup(groupId) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const result = await this.groupsIndex.deleteObject(groupId);
      console.log('Group deleted from Algolia:', groupId);
      return result;
    } catch (error) {
      console.error('Error deleting group from Algolia:', error);
      return null;
    }
  }

  // Search groups using Algolia
  async searchGroups(query, filters = {}) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const searchParams = {
        hitsPerPage: filters.limit || 20,
        page: (filters.page || 1) - 1,
        filters: this.buildAlgoliaFilters(filters)
      };

      if (query) {
        searchParams.query = query;
      }

      const result = await this.groupsIndex.search(query || '', searchParams);
      return result;
    } catch (error) {
      console.error('Error searching groups with Algolia:', error);
      return null;
    }
  }

  // Add or update a user in Algolia
  async saveUser(user) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const algoliaObject = {
        objectID: user._id.toString(),
        username: user.username,
        displayName: user.displayName || user.display_name,
        university: user.university,
        domain: user.domain,
        interests: user.interests || [],
        verified: user.verified || false,
        karma: user.karma || 0,
        createdAt: user.createdAt || user.joinDate
      };

      const result = await this.usersIndex.saveObject(algoliaObject);
      console.log('User saved to Algolia:', result.objectID);
      return result;
    } catch (error) {
      console.error('Error saving user to Algolia:', error);
      return null;
    }
  }

  // Delete a user from Algolia
  async deleteUser(userId) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const result = await this.usersIndex.deleteObject(userId);
      console.log('User deleted from Algolia:', userId);
      return result;
    } catch (error) {
      console.error('Error deleting user from Algolia:', error);
      return null;
    }
  }

  // Search users using Algolia
  async searchUsers(query, filters = {}) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const searchParams = {
        hitsPerPage: filters.limit || 20,
        page: (filters.page || 1) - 1,
        filters: this.buildAlgoliaFilters(filters)
      };

      if (query) {
        searchParams.query = query;
      }

      const result = await this.usersIndex.search(query || '', searchParams);
      return result;
    } catch (error) {
      console.error('Error searching users with Algolia:', error);
      return null;
    }
  }

  // Add or update a community in Algolia
  async saveCommunity(community) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const algoliaObject = {
        objectID: community._id.toString(),
        name: community.name,
        displayName: community.displayName || community.display_name,
        description: community.description,
        category: community.category,
        subject: community.subject,
        members: community.members || 0,
        createdAt: community.createdAt
      };

      const result = await this.communitiesIndex.saveObject(algoliaObject);
      console.log('Community saved to Algolia:', result.objectID);
      return result;
    } catch (error) {
      console.error('Error saving community to Algolia:', error);
      return null;
    }
  }

  // Delete a community from Algolia
  async deleteCommunity(communityId) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const result = await this.communitiesIndex.deleteObject(communityId);
      console.log('Community deleted from Algolia:', communityId);
      return result;
    } catch (error) {
      console.error('Error deleting community from Algolia:', error);
      return null;
    }
  }

  // Search communities using Algolia
  async searchCommunities(query, filters = {}) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const searchParams = {
        hitsPerPage: filters.limit || 20,
        page: (filters.page || 1) - 1,
        filters: this.buildAlgoliaFilters(filters)
      };

      if (query) {
        searchParams.query = query;
      }

      const result = await this.communitiesIndex.search(query || '', searchParams);
      return result;
    } catch (error) {
      console.error('Error searching communities with Algolia:', error);
      return null;
    }
  }

  // Bulk update methods
  async bulkUpdateGroups(groups) {
    if (!this.isConfigured() || !groups || groups.length === 0) {
      return null;
    }

    try {
      const algoliaObjects = groups.map(group => ({
        objectID: group._id.toString(),
        name: group.name,
        description: group.description,
        category: group.category,
        tags: group.tags || [],
        privacy: group.privacy,
        memberCount: group.members ? group.members.length : 0,
        creator: {
          id: group.creator?._id?.toString() || group.creator?.toString() || group.creator,
          displayName: group.creator?.displayName || group.creator?.display_name || 'Unknown User'
        },
        stats: {
          totalPosts: group.stats?.totalPosts || 0,
          totalNotes: group.stats?.totalNotes || 0
        },
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      }));

      const result = await this.groupsIndex.saveObjects(algoliaObjects);
      console.log(`Bulk updated ${algoliaObjects.length} groups in Algolia`);
      return result;
    } catch (error) {
      console.error('Error bulk updating groups in Algolia:', error);
      return null;
    }
  }

  async bulkUpdateUsers(users) {
    if (!this.isConfigured() || !users || users.length === 0) {
      return null;
    }

    try {
      const algoliaObjects = users.map(user => ({
        objectID: user._id.toString(),
        username: user.username,
        displayName: user.displayName || user.display_name,
        university: user.university,
        domain: user.domain,
        interests: user.interests || [],
        verified: user.verified || false,
        karma: user.karma || 0,
        createdAt: user.createdAt || user.joinDate
      }));

      const result = await this.usersIndex.saveObjects(algoliaObjects);
      console.log(`Bulk updated ${algoliaObjects.length} users in Algolia`);
      return result;
    } catch (error) {
      console.error('Error bulk updating users in Algolia:', error);
      return null;
    }
  }

  async bulkUpdateCommunities(communities) {
    if (!this.isConfigured() || !communities || communities.length === 0) {
      return null;
    }

    try {
      const algoliaObjects = communities.map(community => ({
        objectID: community._id.toString(),
        name: community.name,
        displayName: community.displayName || community.display_name,
        description: community.description,
        category: community.category,
        subject: community.subject,
        members: community.members || 0,
        createdAt: community.createdAt
      }));

      const result = await this.communitiesIndex.saveObjects(algoliaObjects);
      console.log(`Bulk updated ${algoliaObjects.length} communities in Algolia`);
      return result;
    } catch (error) {
      console.error('Error bulk updating communities in Algolia:', error);
      return null;
    }
  }
}

// Export singleton instance
module.exports = new AlgoliaService();
