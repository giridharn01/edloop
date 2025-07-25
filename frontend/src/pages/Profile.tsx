import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Edit, 
  Save, 
  X, 
  Calendar,
  MapPin,
  BookOpen,
  MessageSquare,
  FileText,
  TrendingUp,
  Plus,
  Trash2
} from 'lucide-react';
import AppHeader from '@/components/app/AppHeader';
import Sidebar from '@/components/app/Sidebar';
import PostCard from '@/components/feed/PostCard';
import NoteCard from '@/components/notes/NoteCard';
import { useAppContext } from '@/hooks/useAppContext';
import { apiService } from '@/services/api';
import { Post } from '@/types';
import { Note } from '@/types/note';

const Profile: React.FC = () => {
  const { currentUser, setCurrentUser } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userNotes, setUserNotes] = useState<Note[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  
  // Form state for editing
  const [formData, setFormData] = useState({
    bio: currentUser?.bio || '',
    domain: currentUser?.domain || '',
    university: currentUser?.university || '',
    interests: currentUser?.interests || []
  });
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFormData({
        bio: currentUser.bio || '',
        domain: currentUser.domain || '',
        university: currentUser.university || '',
        interests: currentUser.interests || []
      });
      
      // Fetch user's posts and notes
      fetchUserPosts();
      fetchUserNotes();
    }
  }, [currentUser]);

  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true);
      const posts = await apiService.getUserPosts();
      setUserPosts(posts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchUserNotes = async () => {
    try {
      setNotesLoading(true);
      const notes = await apiService.getUserNotes();
      // Add missing fields to match the Note type from @/types/note
      const formattedNotes = notes.map(note => ({
        ...note,
        last_accessed: note.createdAt || new Date().toISOString(),
        community: note.community || {
          id: '',
          name: '',
          displayName: 'General',
          subject: '',
          category: 'general'
        }
      }));
      setUserNotes(formattedNotes as Note[]);
    } catch (error) {
      console.error('Error fetching user notes:', error);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const response = await apiService.updateUser(formData);
      
      // Update the current user in context
      setCurrentUser(response);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      bio: currentUser?.bio || '',
      domain: currentUser?.domain || '',
      university: currentUser?.university || '',
      interests: currentUser?.interests || []
    });
    setIsEditing(false);
  };

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(interest => interest !== interestToRemove)
    }));
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Please log in to view your profile</h2>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-[calc(100vh-3.5rem)]">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Profile Header */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-6">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={currentUser.avatar} />
                      <AvatarFallback className="text-2xl">
                        {currentUser.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-3xl font-bold">{currentUser.displayName}</h1>
                        {currentUser.verified && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-muted-foreground text-lg">u/{currentUser.username}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {/* <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {currentUser.karma} karma
                        </span> */}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Joined {new Date(currentUser.joinDate).toLocaleDateString()}
                        </span>
                        {currentUser.university && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {currentUser.university}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    variant={isEditing ? "outline" : "default"}
                  >
                    {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-6">
                    {/* Bio */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Bio</label>
                      <Textarea
                        placeholder="Tell us about yourself..."
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        className="max-h-32"
                      />
                    </div>

                    {/* University */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">University</label>
                      <Input
                        placeholder="Your university..."
                        value={formData.university}
                        onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                      />
                    </div>

                    {/* Domain */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Academic Domain</label>
                      <Input
                        placeholder="e.g., Computer Science, Biology, etc..."
                        value={formData.domain}
                        onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                      />
                    </div>

                    {/* Interests */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Interests</label>
                      <div className="flex gap-2 mb-3">
                        <Input
                          placeholder="Add an interest..."
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                        />
                        <Button onClick={addInterest} size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.interests.map((interest, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {interest}
                            <button onClick={() => removeInterest(interest)}>
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Save/Cancel Buttons */}
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} disabled={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Bio */}
                    {currentUser.bio && (
                      <div>
                        <h3 className="font-medium mb-2">About</h3>
                        <p className="text-muted-foreground">{currentUser.bio}</p>
                      </div>
                    )}

                    {/* Domain */}
                    {currentUser.domain && (
                      <div>
                        <h3 className="font-medium mb-2">Academic Domain</h3>
                        <Badge variant="outline">{currentUser.domain}</Badge>
                      </div>
                    )}

                    {/* Interests */}
                    {currentUser.interests && currentUser.interests.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-2">Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {currentUser.interests.map((interest, index) => (
                            <Badge key={index} variant="secondary">{interest}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{userPosts.length}</div>
                      <p className="text-xs text-muted-foreground">
                        +0 from last month
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{userNotes.length}</div>
                      <p className="text-xs text-muted-foreground">
                        +0 from last month
                      </p>
                    </CardContent>
                  </Card>
                  
                  {/* <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Karma Points</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{currentUser.karma}</div>
                      <p className="text-xs text-muted-foreground">
                        Community contribution score
                      </p>
                    </CardContent>
                  </Card> */}
                </div>
              </TabsContent>
              
              <TabsContent value="posts" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Your Posts</h3>
                  <Badge variant="outline">{userPosts.length} total</Badge>
                </div>
                {postsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 rounded-lg h-32"></div>
                      </div>
                    ))}
                  </div>
                ) : userPosts.length > 0 ? (
                  <div className="space-y-4">
                    {userPosts.map((post, index) => (
                      <PostCard 
                        key={post.id || index} 
                        post={post} 
                        onVote={() => {}}
                        onComment={() => {}}
                        currentUserId={currentUser?.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No posts yet</h3>
                    <p className="text-gray-500">Start sharing your thoughts with the community!</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="notes" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Your Notes</h3>
                  <Badge variant="outline">{userNotes.length} total</Badge>
                </div>
                {notesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 rounded-lg h-64"></div>
                      </div>
                    ))}
                  </div>
                ) : userNotes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onLike={() => {}}
                        onShare={() => {}}
                        onDelete={() => {}}
                        onView={() => {}}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No notes yet</h3>
                    <p className="text-gray-500">Upload and share your study materials!</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
