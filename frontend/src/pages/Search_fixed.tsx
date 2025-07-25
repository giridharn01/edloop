import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search as SearchIcon, 
  Filter,
  BookOpen,
  TrendingUp,
  Clock,
  Users,
  MessageSquare,
  FileText
} from 'lucide-react';
import AppHeader from '@/components/app/AppHeader';
import Sidebar from '@/components/app/Sidebar';
import NoteCard from '@/components/notes/NoteCard';
import PostCard from '@/components/feed/PostCard';
import { Note, NoteFilters } from '@/types/note';
import { Post } from '@/types';
import { noteService } from '@/services/noteService';
import { postService } from '@/services/postService';
import { useAppContext } from '@/hooks/useAppContext';

const Search: React.FC = () => {
  const { currentUser, communities: userCommunities } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState<'all' | 'notes' | 'posts'>('all');
  const [filters, setFilters] = useState<NoteFilters>({});
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'views'>('recent');

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'lecture', label: 'Lecture Notes' },
    { value: 'study-guide', label: 'Study Guide' },
    { value: 'summary', label: 'Summary' },
    { value: 'homework', label: 'Homework' },
    { value: 'exam-prep', label: 'Exam Preparation' },
    { value: 'research', label: 'Research' },
    { value: 'other', label: 'Other' }
  ];

  const difficultyLevels = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const searchNotes = useCallback(async (query: string) => {
    if (!query.trim()) {
      setNotes([]);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 Searching notes with query:', query);
      
      const queryFilters = {
        ...filters,
        search: query.trim(),
        sort: sortBy
      };
      
      const response = await noteService.getAllNotes(queryFilters);
      console.log('📝 Notes API response:', response);
      
      const notesArray = response.notes || response;
      console.log('📝 Notes array length:', Array.isArray(notesArray) ? notesArray.length : 'Not an array');
      
      // Less restrictive client-side filtering - show all results from backend
      const filteredNotes = Array.isArray(notesArray) ? notesArray : [];
      
      console.log('📝 Setting filtered notes:', filteredNotes.length);
      setNotes(filteredNotes);
    } catch (error) {
      console.error('❌ Error searching notes:', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy]);

  const searchPosts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setPosts([]);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 Searching posts with query:', query);
      console.log('Sort by:', sortBy);
      
      const response = await postService.searchPosts(query, {
        sortBy: sortBy === 'recent' ? 'createdAt' : sortBy === 'popular' ? 'upvotes' : 'views',
        sortOrder: 'desc'
      });
      
      console.log('📄 Post search response:', response);
      
      if (response && response.posts) {
        console.log('📄 Setting posts from response.posts:', response.posts.length);
        // Show all results from backend - let backend handle filtering
        setPosts(response.posts);
      } else if (Array.isArray(response)) {
        console.log('📄 Response is array, setting posts:', response.length);
        // Show all results from backend
        setPosts(response);
      } else {
        console.log('📄 No posts found, setting empty array');
        setPosts([]);
      }
    } catch (error) {
      console.error('❌ Error searching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setNotes([]);
      setPosts([]);
      return;
    }

    console.log('Performing search with query:', searchQuery);
    console.log('Search type:', searchType);

    // Update URL with search query
    setSearchParams({ q: searchQuery, type: searchType });

    // Clear ALL results first, then only populate the selected type
    setNotes([]);
    setPosts([]);

    if (searchType === 'notes' || searchType === 'all') {
      console.log('Searching notes...');
      await searchNotes(searchQuery);
    }
    
    if (searchType === 'posts' || searchType === 'all') {
      console.log('Searching posts...');
      await searchPosts(searchQuery);
    }
  };

  // Search on component mount if query exists
  useEffect(() => {
    const query = searchParams.get('q');
    const type = searchParams.get('type') as 'all' | 'notes' | 'posts';
    
    console.log('URL params changed - query:', query, 'type:', type);
    
    // Update local state if different from URL
    if (query !== searchQuery) {
      console.log('Setting search query from URL:', query);
      setSearchQuery(query || '');
    }
    
    if (type && type !== searchType) {
      console.log('Setting search type from URL:', type);
      setSearchType(type);
    }
    
    // Perform search if query exists
    if (query && query.trim()) {
      console.log('Performing search for query:', query, 'type:', type || 'all');
      
      // Clear all results first
      setNotes([]);
      setPosts([]);
      
      const searchTypeToUse = type || 'all';
      if (searchTypeToUse === 'notes' || searchTypeToUse === 'all') {
        searchNotes(query);
      }
      if (searchTypeToUse === 'posts' || searchTypeToUse === 'all') {
        searchPosts(query);
      }
    } else if (!query) {
      // Clear results if no query
      setNotes([]);
      setPosts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only depend on searchParams to avoid infinite loops

  // Perform search when searchQuery or searchType changes (with debouncing)
  useEffect(() => {
    // Don't trigger if we're setting state from URL params
    const urlQuery = searchParams.get('q');
    if (searchQuery && searchQuery === urlQuery) {
      return; // Already handled by URL params effect
    }
    
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(async () => {
        console.log('Debounced search triggered for:', searchQuery);
        
        // Update URL with search query
        setSearchParams({ q: searchQuery, type: searchType });
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    } else {
      // Clear results when search query is empty
      setNotes([]);
      setPosts([]);
      // Clear URL params too
      setSearchParams({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchType]);

  const handleFilterChange = (key: keyof NoteFilters, value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value === 'all' ? undefined : value || undefined 
    }));
  };

  const handleLikeNote = async (noteId: string) => {
    try {
      await noteService.likeNote(noteId);
      setNotes(prev => prev.map(note => 
        note.id === noteId 
          ? { ...note, likes_count: note.likes_count + 1 }
          : note
      ));
    } catch (error) {
      console.error('Error liking note:', error);
    }
  };

  const handleShareNote = async (noteId: string) => {
    try {
      await noteService.shareNote(noteId);
      setNotes(prev => prev.map(note => 
        note.id === noteId 
          ? { ...note, shares_count: note.shares_count + 1 }
          : note
      ));
      
      const noteUrl = `${window.location.origin}/notes/${noteId}`;
      await navigator.clipboard.writeText(noteUrl);
      alert('Note link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing note:', error);
    }
  };

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    try {
      await postService.votePost(postId, voteType);
      // Update the post in the local state
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? {
              ...post,
              upvotes: voteType === 'up' ? post.upvotes + 1 : post.upvotes,
              downvotes: voteType === 'down' ? post.downvotes + 1 : post.downvotes,
              userVote: voteType
            }
          : post
      ));
    } catch (error) {
      console.error('Error voting on post:', error);
    }
  };

  const handleComment = (postId: string) => {
    // TODO: Navigate to post detail page when available
    console.log('Comment on post:', postId);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await noteService.deleteNote(noteId);
        setNotes(prev => prev.filter(note => note.id !== noteId));
      } catch (error) {
        console.error('Error deleting note:', error);
        alert('Failed to delete note');
      }
    }
  };

  const totalResults = notes.length + posts.length;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-[calc(100vh-3.5rem)]">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
                <SearchIcon className="w-8 h-8 text-primary" />
                Search
              </h1>
              <p className="text-muted-foreground">
                Find notes and posts across all communities
              </p>
            </div>

              {/* Search Bar */}
            <div className="bg-card rounded-lg border p-6 mb-6">
              <form onSubmit={(e) => { e.preventDefault(); performSearch(); }} className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search for notes and posts..."
                    value={searchQuery}
                    onChange={(e) => {
                      console.log('Search input changed to:', e.target.value);
                      setSearchQuery(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        console.log('Enter pressed, performing search for:', searchQuery);
                        performSearch();
                      }
                    }}
                    className="text-lg"
                    autoFocus
                  />
                </div>
                <Button type="submit" size="lg">
                  <SearchIcon className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </form>

              {/* Search Type Filter */}
              <div className="flex gap-4 mb-4">
                <Select value={searchType} onValueChange={(value) => {
                  const newType = value as 'all' | 'notes' | 'posts';
                  setSearchType(newType);
                  
                  // Immediately re-search with new type if there's a query
                  if (searchQuery.trim()) {
                    // Clear all results first
                    setNotes([]);
                    setPosts([]);
                    
                    // Update URL
                    setSearchParams({ q: searchQuery, type: newType });
                    
                    // Perform search based on new type
                    if (newType === 'notes' || newType === 'all') {
                      searchNotes(searchQuery);
                    }
                    if (newType === 'posts' || newType === 'all') {
                      searchPosts(searchQuery);
                    }
                  }
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        All Content
                      </div>
                    </SelectItem>
                    <SelectItem value="notes">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Notes Only
                      </div>
                    </SelectItem>
                    <SelectItem value="posts">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Posts Only
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Options */}
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'recent' | 'popular' | 'views')}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Most Recent
                      </div>
                    </SelectItem>
                    <SelectItem value="popular">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Most Popular
                      </div>
                    </SelectItem>
                    <SelectItem value="views">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Most Viewed
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Filters for Notes */}
              {(searchType === 'notes' || searchType === 'all') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Filter */}
                  <Select 
                    value={filters.category || 'all'} 
                    onValueChange={(value) => handleFilterChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Difficulty Filter */}
                  <Select 
                    value={filters.difficulty || 'all'} 
                    onValueChange={(value) => handleFilterChange('difficulty', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {difficultyLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Results */}
            {searchQuery && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  Search Results for "{searchQuery}" ({totalResults} results)
                </h2>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 rounded-lg h-64"></div>
                      </div>
                    ))}
                  </div>
                ) : totalResults > 0 ? (
                  <div className="space-y-8">
                    {/* Notes Results */}
                    {notes.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Notes ({notes.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {notes.map((note) => (
                            <NoteCard
                              key={note.id}
                              note={note}
                              onLike={handleLikeNote}
                              onShare={handleShareNote}
                              onDelete={handleDeleteNote}
                              onView={(noteId) => window.open(`/notes/${noteId}`, '_blank')}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Posts Results */}
                    {posts.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          Posts ({posts.length})
                        </h3>
                        <div className="space-y-4">
                          {posts.map((post, index) => (
                            <PostCard 
                              key={index} 
                              post={post} 
                              onVote={handleVote}
                              onComment={handleComment}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <SearchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No results found</h3>
                    <p className="text-gray-500 mb-4">
                      Try adjusting your search terms or filters
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* No Search Query */}
            {!searchQuery && (
              <div className="text-center py-12">
                <SearchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Search EdLoop</h3>
                <p className="text-gray-500 mb-4">
                  Find notes and posts from across all communities
                </p>
                <div className="flex justify-center gap-4 text-sm text-gray-500">
                  <span>• Search by keywords</span>
                  <span>• Filter by category</span>
                  <span>• Sort by relevance</span>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Search;
