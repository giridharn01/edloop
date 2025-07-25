import { useState } from "react";
import { useParams } from "react-router-dom";
import AppHeader from "@/components/app/AppHeader";
import PostCard from "@/components/feed/PostCard";
import CreatePostDialog from "@/components/dialogs/CreatePostDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Flame,
  Plus,
  Settings,
  Bell,
  Code,
  Calculator,
  University
} from "lucide-react";
import { useAppContext } from "@/hooks/useAppContext";

const Community = () => {
  const { communityId } = useParams();
  const { communities, posts, voteOnPost, joinCommunity, leaveCommunity } = useAppContext();
  const [isJoined, setIsJoined] = useState(false);
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');

  // Find the community by ID
  const community = communities.find(c => c.id === communityId);

  // Filter posts for this community
  const communityPosts = posts.filter(post => post.community.id === communityId);

  // Extract unique tags from community posts
  const communityTags = Array.from(
    new Set(
      communityPosts
        .flatMap(post => post.tags || [])
        .filter(tag => tag && tag.trim() !== '')
    )
  ).slice(0, 10); // Limit to 10 most common tags

  const handleVote = (postId: string, voteType: 'up' | 'down') => {
    voteOnPost(postId, voteType);
  };

  const handleComment = (postId: string) => {
    console.log(`Opening comments for post ${postId}`);
  };

  const handleJoinToggle = () => {
    if (isJoined) {
      leaveCommunity(communityId!);
    } else {
      joinCommunity(communityId!);
    }
    setIsJoined(!isJoined);
  };

  const getSubjectIcon = () => {
    if (!community) return University;
    switch (community.subject) {
      case "Computer Science": return Code;
      case "Mathematics": return Calculator;
      default: return University;
    }
  };

  const SubjectIcon = getSubjectIcon();

  if (!community) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Community not found</div>
        </div>
      </div>
    );
  }

  const sortPosts = (posts: typeof communityPosts, sortBy: string) => {
    switch (sortBy) {
      case 'new':
        return [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'top':
        return [...posts].sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
      case 'hot':
      default:
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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Community Header */}
        <div className="relative">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-primary rounded-lg"></div>
          
          {/* Community Info */}
          <div className="relative -mt-16 ml-6">
            <div className="flex items-end gap-6">
              {/* Community Avatar */}
              <div className="w-24 h-24 bg-card rounded-full border-4 border-background flex items-center justify-center shadow-soft">
                <SubjectIcon className="w-12 h-12 text-primary" />
              </div>
              
              {/* Community Details */}
              <div className="pb-4 space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold font-space">{community.displayName}</h1>
                  <Badge variant="secondary" className="px-3 py-1">
                    Academic
                  </Badge>
                </div>
                <p className="text-muted-foreground text-lg">{community.name}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{(community.members / 1000).toFixed(0)}k members</span>
                  </div>
                  <span>•</span>
                  <span>Academic Community</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="ml-auto pb-4 flex items-center gap-3">
                <Button 
                  variant={isJoined ? "outline" : "primary"}
                  onClick={handleJoinToggle}
                >
                  {isJoined ? "Joined" : "Join"}
                </Button>
                <Button variant="outline" size="icon">
                  <Bell className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Create Post */}
            <Card className="gradient-card border-0 shadow-soft">
              <CardContent className="p-4">
                <CreatePostDialog 
                  communityId={communityId}
                  trigger={
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="w-4 h-4 mr-2" />
                      Create a post in r/{community.displayName}
                    </Button>
                  }
                />
              </CardContent>
            </Card>

            {/* Sort Options */}
            <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as 'hot' | 'new' | 'top')}>
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="hot" className="flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  Hot
                </TabsTrigger>
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
                {sortPosts(communityPosts, 'hot').map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onVote={handleVote}
                    onComment={handleComment}
                  />
                ))}
              </TabsContent>

              <TabsContent value="new" className="space-y-4">
                {sortPosts(communityPosts, 'new').map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onVote={handleVote}
                    onComment={handleComment}
                  />
                ))}
              </TabsContent>

              <TabsContent value="top" className="space-y-4">
                {sortPosts(communityPosts, 'top').map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onVote={handleVote}
                    onComment={handleComment}
                  />
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* About Community */}
            <Card className="gradient-card border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SubjectIcon className="w-5 h-5" />
                  About Community
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {community.description}
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Members</span>
                    <span className="font-medium">{community.members.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <Badge variant="secondary" className="text-xs">
                      {community.category}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">Jan 15, 2020</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  View Rules
                </Button>
              </CardContent>
            </Card>

            {/* Popular Tags */}
            <Card className="gradient-card border-0 shadow-soft">
              <CardHeader>
                <CardTitle>Popular Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {communityTags.length > 0 ? (
                    communityTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-white transition-smooth">
                        #{tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No tags yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Community Guidelines */}
            <Card className="gradient-secondary border-0 shadow-soft">
              <CardContent className="p-4 text-center space-y-3">
                <h3 className="font-semibold text-secondary-foreground">Community Guidelines</h3>
                <p className="text-sm text-secondary-foreground/80">
                  Be respectful, share knowledge, and help fellow students learn and grow.
                </p>
                <Button variant="outline" size="sm">
                  Read Full Guidelines
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;