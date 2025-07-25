import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  Share2, 
  Eye, 
  Download,
  MoreHorizontal,
  BookOpen,
  Clock,
  Users,
  FileText,
  Edit3,
  Trash2,
  File,
  Image,
  Archive
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Note } from '@/types/note';
import { useAppContext } from '@/hooks/useAppContext';

interface NoteCardProps {
  note: Note;
  onLike?: (noteId: string) => void;
  onShare?: (noteId: string) => void;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  onView?: (noteId: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onLike,
  onShare,
  onEdit,
  onDelete,
  onView
}) => {
  const { currentUser } = useAppContext();
  const navigate = useNavigate();
  const isOwner = currentUser?.id === note.author?.id;

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lecture': return BookOpen;
      case 'homework': return Edit3;
      case 'exam-prep': return FileText;
      default: return BookOpen;
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(type)) {
      return Image;
    } else if (['zip', 'rar', '7z'].includes(type)) {
      return Archive;
    } else if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(type)) {
      return FileText;
    }
    return File;
  };

  const CategoryIcon = getCategoryIcon(note.category || 'other');

  const handleCardClick = () => {
    navigate(`/notes/${note.id}`);
    if (onView) {
      onView(note.id);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1" onClick={handleCardClick}>
            <div className="flex items-center gap-2 mb-2">
              <CategoryIcon className="w-4 h-4 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs capitalize">
                {note.category?.replace('-', ' ') || 'Other'}
              </Badge>
              {note.difficulty_level && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getDifficultyColor(note.difficulty_level)}`}
                >
                  {note.difficulty_level}
                </Badge>
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {note.title}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
              {note.content}
            </p>
          </div>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit && onEdit(note)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete && onDelete(note.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {note.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {note.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{note.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Author & Community Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src="" />
              <AvatarFallback className="text-xs">
                {note.author?.displayName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{note.author?.displayName || 'Unknown User'}</span>
            {note.author?.verified && (
              <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{new Date(note.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Community Info */}
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {note.community?.displayName || 'General'}
          </Badge>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{note.subject || 'No subject'}</span>
        </div>

        {/* Attachments */}
        {note.attachments && note.attachments.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-3 h-3" />
              <span>{note.attachments.length} attachment{note.attachments.length > 1 ? 's' : ''}</span>
            </div>
            {note.attachments.slice(0, 3).map((attachment, index) => {
              const FileIcon = getFileTypeIcon(attachment?.type || '');
              return (
                <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileIcon className="w-3 h-3" />
                  <span className="truncate flex-1">{attachment?.name || 'Unknown file'}</span>
                  <span>{attachment?.type?.toUpperCase() || 'FILE'}</span>
                </div>
              );
            })}
            {note.attachments.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{note.attachments.length - 3} more files
              </div>
            )}
          </div>
        )}
      </CardHeader>

      
    </Card>
  );
};

export default NoteCard;
