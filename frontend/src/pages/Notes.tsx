import React, { useState, useEffect } from 'react';
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
  Plus, 
  Search, 
  Filter,
  BookOpen,
  TrendingUp,
  Clock,
  Users
} from 'lucide-react';
import AppHeader from '@/components/app/AppHeader';
import Sidebar from '@/components/app/Sidebar';
import NoteCard from '@/components/notes/NoteCard';
import CreateNoteDialog from '@/components/dialogs/CreateNoteDialog';
import EditNoteDialog from '@/components/dialogs/EditNoteDialog';
import { Note, NoteFilters } from '@/types/note';
import { noteService } from '@/services/noteService';
import { useAppContext } from '@/hooks/useAppContext';

const Notes: React.FC = () => {
  const { currentUser, communities } = useAppContext();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [filters, setFilters] = useState<NoteFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'views'>('recent');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const fetchNotes = React.useCallback(async () => {
    try {
      setLoading(true);
      const queryFilters = {
        ...filters,
        search: debouncedSearchQuery.trim() || undefined,
        sort: sortBy
      };
      
      console.log('Searching with filters:', queryFilters); // Debug log
      
      const response = await noteService.getAllNotes(queryFilters);
      setNotes(response.notes || response);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, debouncedSearchQuery]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSearch = () => {
    // Force immediate search by setting debounced query
    setDebouncedSearchQuery(searchQuery.trim());
  };

  const handleFilterChange = (key: keyof NoteFilters, value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value === 'all' ? undefined : value || undefined 
    }));
  };

  const handleLikeNote = async (noteId: string) => {
    try {
      await noteService.likeNote(noteId);
      // Update the note in the local state
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
      // Update the note in the local state
      setNotes(prev => prev.map(note => 
        note.id === noteId 
          ? { ...note, shares_count: note.shares_count + 1 }
          : note
      ));
      
      // Copy link to clipboard
      const noteUrl = `${window.location.origin}/notes/${noteId}`;
      await navigator.clipboard.writeText(noteUrl);
      alert('Note link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing note:', error);
    }
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

  const handleNoteCreated = () => {
    fetchNotes();
  };

  const getSortIcon = (sort: string) => {
    switch (sort) {
      case 'popular': return TrendingUp;
      case 'views': return Users;
      default: return Clock;
    }
  };

  const SortIcon = getSortIcon(sortBy);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-[calc(100vh-3.5rem)]">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <BookOpen className="w-8 h-8 text-primary" />
                  Study Notes
                </h1>
                <p className="text-muted-foreground mt-1">
                  Share and discover study materials from your community
                </p>
              </div>
              
              {currentUser && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Note
                </Button>
              )}
            </div>

            {/* Filters and Search */}
            <div className="bg-card rounded-lg border p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Search notes by title, content, tags, or subject..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="pr-8"
                      />
                      {debouncedSearchQuery !== searchQuery && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        </div>
                      )}
                    </div>
                    <Button onClick={handleSearch} variant="outline">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Community Filter */}
                <Select 
                  value={filters.community || 'all'} 
                  onValueChange={(value) => handleFilterChange('community', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Communities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Communities</SelectItem>
                    {communities?.map((community) => (
                      <SelectItem key={community.id} value={community.id}>
                        {community.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'recent' | 'popular' | 'views')}>
                  <SelectTrigger>
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

              {/* Additional Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                {/* Subject Filter */}
                <Input
                  placeholder="Filter by subject..."
                  value={filters.subject || ''}
                  onChange={(e) => handleFilterChange('subject', e.target.value)}
                />
              </div>

              {/* Active Filters */}
              {Object.entries(filters).some(([_, value]) => value) && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {Object.entries(filters).map(([key, value]) => 
                    value ? (
                      <Badge key={key} variant="secondary" className="flex items-center gap-1">
                        {key}: {value}
                        <button 
                          onClick={() => handleFilterChange(key as keyof NoteFilters, '')}
                          className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setFilters({});
                      setSearchQuery('');
                      setDebouncedSearchQuery('');
                    }}
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>

            {/* Notes Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-lg h-64"></div>
                  </div>
                ))}
              </div>
            ) : notes.length > 0 ? (
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
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No notes found</h3>
                <p className="text-gray-500 mb-4">
                  {Object.keys(filters).length > 0 
                    ? "Try adjusting your filters or search terms"
                    : "Be the first to share your study notes!"
                  }
                </p>
                {currentUser && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Note
                  </Button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Note Dialog */}
      <CreateNoteDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onNoteCreated={handleNoteCreated}
      />
    </div>
  );
};

export default Notes;
