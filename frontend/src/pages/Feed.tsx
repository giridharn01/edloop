import { useState } from "react";
import AppHeader from "@/components/app/AppHeader";
import Sidebar from "@/components/app/Sidebar";
import PostCard from "@/components/feed/PostCard";
import CreatePost from "@/components/feed/CreatePost";
import EditPostDialog from "@/components/feed/EditPostDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Clock, Flame } from "lucide-react";
import { useAppContext } from "@/hooks/useAppContext";
import { postService, UpdatePostData } from "@/services/postService";
import { Post } from "@/types";

const Feed = () => {
  const { posts, voteOnPost, isLoading, currentUser, loadPosts } = useAppContext();
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleVote = (postId: string, voteType: 'up' | 'down') => {
    voteOnPost(postId, voteType);
  };

  const handleComment = (postId: string) => {
    console.log(`Opening comments for post ${postId}`);
    // Handle comment navigation
  };

  const handleEdit = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setEditingPost(post);
      setShowEditDialog(true);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await postService.deletePost(postId);
      // Refresh posts after deletion
      loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleSaveEdit = async (postId: string, data: UpdatePostData) => {
    try {
      await postService.updatePost(postId, data);
      // Refresh posts after update
      loadPosts();
      setShowEditDialog(false);
      setEditingPost(null);
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  };

  const sortPosts = (posts: Post[], sortBy: string) => {
    switch (sortBy) {
      case 'new':
        return [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'top':
        return [...posts].sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
      case 'hot':
      default:
        // Hot algorithm: combines score and recency
        return [...posts].sort((a, b) => {
          const scoreA = a.upvotes - a.downvotes;
          const scoreB = b.upvotes - b.downvotes;
          const timeA = new Date(a.createdAt).getTime();
          const timeB = new Date(b.createdAt).getTime();
          const hoursSinceA = (Date.now() - timeA) / (1000 * 60 * 60);
          const hoursSinceB = (Date.now() - timeB) / (1000 * 60 * 60);
          const hotScoreA = scoreA / Math.pow(hoursSinceA + 2, 1.8);
          const hotScoreB = scoreB / Math.pow(hoursSinceB + 2, 1.8);
          return hotScoreB - hotScoreA;
        });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-4 space-y-4">
          {/* Create Post Toggle */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Home Feed</h1>
            <Button 
              variant="primary" 
              onClick={() => setShowCreatePost(!showCreatePost)}
            >
              {showCreatePost ? 'Cancel' : 'Create Post'}
            </Button>
          </div>

          {/* Create Post Form */}
          {showCreatePost && (
            <CreatePost />
          )}

          {/* Sort Options */}
          <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as 'hot' | 'new' | 'top')}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              
              <TabsTrigger value="new" className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                New
              </TabsTrigger>
              <TabsTrigger value="top" className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Top
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hot" className="space-y-4">
              {posts.length > 0 ? (
                sortPosts(posts, 'hot').map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onVote={handleVote}
                    onComment={handleComment}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    currentUserId={currentUser?.id}
                  />
                ))
              ) : (
                <div className="text-center py-16 bg-card rounded-lg border border-border">
                  <div className="space-y-4">
                    <div className="text-muted-foreground">
                      <Flame className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <h3 className="text-lg font-medium">No posts yet</h3>
                      <p className="text-sm">Be the first to share something with the community!</p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => setShowCreatePost(true)}
                    >
                      Create First Post
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="new" className="space-y-4">
              {posts.length > 0 ? (
                sortPosts(posts, 'new').map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onVote={handleVote}
                    onComment={handleComment}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    currentUserId={currentUser?.id}
                  />
                ))
              ) : (
                <div className="text-center py-16 bg-card rounded-lg border border-border">
                  <div className="space-y-4">
                    <div className="text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <h3 className="text-lg font-medium">No posts yet</h3>
                      <p className="text-sm">Be the first to share something with the community!</p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => setShowCreatePost(true)}
                    >
                      Create First Post
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="top" className="space-y-4">
              {posts.length > 0 ? (
                sortPosts(posts, 'top').map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onVote={handleVote}
                    onComment={handleComment}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    currentUserId={currentUser?.id}
                  />
                ))
              ) : (
                <div className="text-center py-16 bg-card rounded-lg border border-border">
                  <div className="space-y-4">
                    <div className="text-muted-foreground">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <h3 className="text-lg font-medium">No posts yet</h3>
                      <p className="text-sm">Be the first to share something with the community!</p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => setShowCreatePost(true)}
                    >
                      Create First Post
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Load More */}
          {posts.length > 0 && (
            <div className="text-center py-8">
              <Button variant="outline">
                Load More Posts
              </Button>
            </div>
          )}
        </main>
      </div>
      
      {/* Edit Post Dialog */}
      <EditPostDialog
        post={editingPost}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default Feed;
