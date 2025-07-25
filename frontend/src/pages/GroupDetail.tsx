import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  UserPlus,
  UserMinus,
  Settings,
  Lock,
  Globe,
  Calendar,
  Hash,
  Edit,
  Trash2,
  Shield,
  Crown
} from "lucide-react";
import { Group, Post, Note } from "@/types";
import { apiService } from "@/services/api";
import { useAppContext } from "@/hooks/useAppContext";
import PostCard from "@/components/feed/PostCard";

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAppContext();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [joinLoading, setJoinLoading] = useState(false);

  const fetchGroup = useCallback(async () => {
    try {
      const groupData = await apiService.getGroup(id!);
      setGroup(groupData);
    } catch (error) {
      console.error('Error fetching group:', error);
      navigate('/groups');
    }
  }, [id, navigate]);

  const fetchGroupContent = useCallback(async () => {
    try {
      setLoading(true);
      const [postsData, notesData] = await Promise.all([
        apiService.getGroupPosts(id!, { page: 1, limit: 10 }),
        apiService.getGroupNotes(id!, { page: 1, limit: 10 })
      ]);
      setPosts(postsData.posts);
      setNotes(notesData.notes);
    } catch (error) {
      console.error('Error fetching group content:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchGroup();
      fetchGroupContent();
    }
  }, [id, fetchGroup, fetchGroupContent]);

  const handleJoinGroup = async () => {
    if (!group) return;
    
    try {
      setJoinLoading(true);
      await apiService.joinGroup(group.id);
      await fetchGroup();
    } catch (error) {
      console.error('Error joining group:', error);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!group) return;
    
    try {
      setJoinLoading(true);
      await apiService.leaveGroup(group.id);
      await fetchGroup();
    } catch (error) {
      console.error('Error leaving group:', error);
    } finally {
      setJoinLoading(false);
    }
  };

  const isUserMember = () => {
    return currentUser && group && group.members.some(member => member.user.id === currentUser.id);
  };

  const getUserRole = () => {
    if (!currentUser || !group) return null;
    const member = group.members.find(member => member.user.id === currentUser.id);
    return member?.role || null;
  };

  const isCreator = () => {
    return currentUser && group && group.creator.id === currentUser.id;
  };

  const canManageGroup = () => {
    const role = getUserRole();
    return isCreator() || role === 'admin';
  };

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Group Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Group Info */}
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={group.avatar} />
                  <AvatarFallback className="bg-gradient-primary text-white text-xl">
                    {group.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold">{group.name}</h1>
                    {group.privacy === 'private' ? (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Globe className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  <p className="text-muted-foreground mb-3">{group.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {group.memberCount} members
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Created {new Date(group.createdAt).toLocaleDateString()}
                    </div>
                    <Badge variant="secondary">{group.category}</Badge>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {group.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {group.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Creator */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Created by:</span>
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={group.creator.avatar} />
                    <AvatarFallback>{group.creator.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{group.creator.displayName}</span>
                  <Crown className="w-4 h-4 text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 lg:min-w-[200px]">
              {currentUser && (
                <>
                  {isUserMember() ? (
                    <div className="space-y-2">
                      <Badge variant="default" className="w-full justify-center">
                        {getUserRole() === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                        {getUserRole() === 'admin' ? 'Admin' : 'Member'}
                      </Badge>
                      
                      {canManageGroup() && (
                        <Button variant="outline" size="sm" className="w-full">
                          <Settings className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                      )}
                      
                      {!isCreator() && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={handleLeaveGroup}
                          disabled={joinLoading}
                        >
                          <UserMinus className="w-4 h-4 mr-2" />
                          Leave Group
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button 
                      onClick={handleJoinGroup}
                      disabled={joinLoading}
                      className="w-full"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Join Group
                    </Button>
                  )}
                </>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-muted/50 rounded p-3">
                  <div className="text-lg font-semibold">{group.stats.totalPosts}</div>
                  <div className="text-xs text-muted-foreground">Posts</div>
                </div>
                <div className="bg-muted/50 rounded p-3">
                  <div className="text-lg font-semibold">{group.stats.totalNotes}</div>
                  <div className="text-xs text-muted-foreground">Notes</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules */}
      {group.rules.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Group Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {group.rules.map((rule, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground min-w-[20px]">
                    {index + 1}.
                  </span>
                  <span className="text-sm">{rule}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">Posts ({group.stats.totalPosts})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({group.stats.totalNotes})</TabsTrigger>
          <TabsTrigger value="members">Members ({group.memberCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-20 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-muted-foreground">
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p>Be the first to start a discussion in this group!</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onVote={() => {}} 
                  onComment={() => {}} 
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-16 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : notes.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-muted-foreground">
                <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
                <p>Share your study notes with the group!</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map(note => (
                <Card key={note.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{note.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{note.subject}</span>
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.members.map(member => (
              <Card key={member.user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.user.avatar} />
                      <AvatarFallback>{member.user.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.user.displayName}</span>
                        {member.role === 'admin' && <Shield className="w-4 h-4 text-blue-500" />}
                        {group.creator.id === member.user.id && <Crown className="w-4 h-4 text-yellow-500" />}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{member.user.username}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {member.role} • Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GroupDetail;
