import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  ArrowUp, 
  ArrowDown, 
  MessageSquare, 
  Share, 
  Bookmark,
  MoreHorizontal,
  FileText,
  ExternalLink,
  Image as ImageIcon,
  Edit2,
  Trash2
} from "lucide-react";
import { Post } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface PostCardProps {
  post: Post;
  onVote: (postId: string, voteType: 'up' | 'down') => void;
  onComment: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  showActions?: boolean;
  currentUserId?: string;
}

const PostCard = ({ post, onVote, onComment, onEdit, onDelete, showActions = true, currentUserId }: PostCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const getPostTypeIcon = () => {
    switch (post.type) {
      case 'note': return FileText;
      case 'link': return ExternalLink;
      case 'image': return ImageIcon;
      default: return MessageSquare;
    }
  };

  const PostTypeIcon = getPostTypeIcon();
  const isOwner = currentUserId && post.author?.id === currentUserId;

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete(post.id);
    }
    setShowDeleteDialog(false);
  };

  return (
    <Card className="gradient-card border-0 shadow-soft hover:shadow-glow transition-smooth">
      <CardContent className="p-0">
        <div className="flex">
          {/* Vote Section */}
          <div className="flex flex-col items-center p-3 bg-muted/30">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${post.userVote === 'up' ? 'text-orange-500 bg-orange-50' : 'text-muted-foreground'}`}
              onClick={() => onVote(post.id, 'up')}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold py-1">
              {post.upvotes - post.downvotes}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${post.userVote === 'down' ? 'text-blue-500 bg-blue-50' : 'text-muted-foreground'}`}
              onClick={() => onVote(post.id, 'down')}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                r/{post.community?.displayName || 'Unknown Community'}
              </span>
              <span>•</span>
              <span>Posted by</span>
              {post.author ? (
                <div className="flex items-center gap-1">
                  <Avatar className="w-4 h-4">
                    <AvatarImage src={post.author.avatar} />
                    <AvatarFallback className="bg-gradient-primary text-white text-xs">
                      {post.author.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">u/{post.author.username}</span>
                  {post.author.verified && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              ) : (
                <span className="font-medium text-foreground">u/[deleted]</span>
              )}
              <span>•</span>
              <span>
                {post.createdAt ? (
                  (() => {
                    try {
                      return formatDistanceToNow(new Date(post.createdAt)) + ' ago';
                    } catch (error) {
                      return 'Unknown time';
                    }
                  })()
                ) : (
                  'Unknown time'
                )}
              </span>
            </div>

            {/* Title */}
            <div className="flex items-start gap-2">
              <PostTypeIcon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <h2 className="text-lg font-semibold leading-tight cursor-pointer hover:text-primary transition-smooth">
                {post.title}
              </h2>
            </div>

            {/* Content Preview */}
            {post.content && (
              <p className="text-muted-foreground leading-relaxed line-clamp-3">
                {post.content}
              </p>
            )}

            {/* Note File */}
            {post.noteFile && (
              <div className="bg-gradient-secondary rounded-lg p-3 border border-secondary/20">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-secondary-foreground" />
                  <span className="font-medium text-secondary-foreground">{post.noteFile.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {post.noteFile.type}
                  </Badge>
                </div>
              </div>
            )}

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Actions */}
            {/* <div className="flex items-center gap-4 pt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onComment(post.id)}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                {post.commentCount} comments
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Share className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Bookmark className="w-4 h-4 mr-1" />
                Save
              </Button>
              
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-auto text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isOwner && onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(post.id)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Post
                      </DropdownMenuItem>
                    )}
                    {isOwner && onDelete && (
                      <DropdownMenuItem 
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Post
                      </DropdownMenuItem>
                    )}
                    {!isOwner && (
                      <DropdownMenuItem>
                        Report Post
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div> */}
          </div>
        </div>
      </CardContent>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default PostCard;