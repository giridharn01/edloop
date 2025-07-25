import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Lock,
  Globe,
  UserPlus,
  Settings
} from "lucide-react";
import { Group } from "@/types";
import { apiService } from "@/services/api";
import { useAppContext } from "@/hooks/useAppContext";
import CreateGroupDialog from "@/components/groups/CreateGroupDialog";

const Groups = () => {
  const { currentUser } = useAppContext();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalGroups: 0,
    hasNext: false,
    hasPrev: false
  });

  const categories = [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Engineering',
    'Business',
    'Literature',
    'History',
    'Psychology',
    'Economics',
    'Art',
    'Music',
    'Philosophy',
    'Medicine',
    'Law',
    'Other'
  ];

  const fetchGroups = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        ...(selectedCategory !== "all" && { category: selectedCategory }),
        ...(searchQuery && { search: searchQuery }),
        sort: sortBy as "newest" | "popular" | "active" | "oldest"
      };
      
      const response = await apiService.getGroups(params);
      setGroups(response.groups);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, sortBy]);

  useEffect(() => {
    fetchGroups();
  }, [selectedCategory, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery || searchQuery === "") {
        fetchGroups();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleGroupClick = (groupId: string) => {
    navigate(`/groups/${groupId}`);
  };

  const handleJoinGroup = async (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiService.joinGroup(groupId);
      fetchGroups(pagination.currentPage);
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const isUserMember = (group: Group) => {
    return currentUser && group.members.some(member => member.user.id === currentUser.id);
  };

  const getUserRole = (group: Group) => {
    if (!currentUser) return null;
    const member = group.members.find(member => member.user.id === currentUser.id);
    return member?.role || null;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Study Groups</h1>
          <p className="text-muted-foreground">
            Join or create study groups to collaborate with fellow students
          </p>
        </div>
        
        {/* Show Create Group button for debugging - should be visible */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Group {currentUser ? '(Logged In)' : '(Not Logged In)'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <CreateGroupDialog 
              onSuccess={() => {
                setShowCreateDialog(false);
                fetchGroups();
              }}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="active">Most Active</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card className="text-center p-12">
          <div className="flex flex-col items-center gap-4">
            <Users className="w-16 h-16 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No groups found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory !== "all" 
                  ? "Try adjusting your search or filters"
                  : "Be the first to create a study group!"}
              </p>
            </div>
            {currentUser && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {groups.map((group) => (
              <Card 
                key={group.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleGroupClick(group.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={group.avatar} />
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {group.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {group.name}
                          {group.privacy === 'private' ? (
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          ) : (
                            <Globe className="w-3 h-3 text-muted-foreground" />
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {group.memberCount} members
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {group.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {group.category}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {new Date(group.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {group.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {group.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {group.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{group.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{group.stats.totalPosts} posts</span>
                      <span>{group.stats.totalNotes} notes</span>
                    </div>
                    
                    {currentUser && (
                      isUserMember(group) ? (
                        <div className="flex items-center gap-2">
                          {getUserRole(group) === 'admin' && (
                            <Settings className="w-4 h-4 text-muted-foreground" />
                          )}
                          <Badge variant="default" className="text-xs">
                            {getUserRole(group) === 'admin' ? 'Admin' : 'Member'}
                          </Badge>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleJoinGroup(group.id, e)}
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Join
                        </Button>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrev}
                onClick={() => fetchGroups(pagination.currentPage - 1)}
              >
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNext}
                onClick={() => fetchGroups(pagination.currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Groups;
