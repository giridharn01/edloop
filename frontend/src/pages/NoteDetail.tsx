import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  Share2, 
  Eye, 
  Download, 
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  FileText,
  Edit3,
  Trash2,
  File,
  Image,
  Archive,
  ExternalLink
} from 'lucide-react';
import AppHeader from '@/components/app/AppHeader';
import Sidebar from '@/components/app/Sidebar';
import { Note } from '@/types/note';
import { noteService } from '@/services/noteService';
import { useAppContext } from '@/hooks/useAppContext';

const NoteDetail: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAppContext();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (noteId) {
      fetchNote(noteId);
    }
  }, [noteId]);

  const fetchNote = async (id: string) => {
    try {
      setLoading(true);
      const noteData = await noteService.getNoteById(id);
      setNote(noteData);
    } catch (err) {
      console.error('Error fetching note:', err);
      setError('Failed to load note');
    } finally {
      setLoading(false);
    }
  };

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

  const handleDownloadAttachment = (attachment: { url: string; name: string }) => {
    // Create a download link for the attachment
    const link = document.createElement('a');
    link.href = `http://localhost:3001${attachment.url}`;
    link.download = attachment.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLike = async () => {
    if (!note) return;
    try {
      await noteService.likeNote(note.id);
      // Refresh note to get updated like count
      fetchNote(note.id);
    } catch (err) {
      console.error('Error liking note:', err);
    }
  };

  const handleShare = async () => {
    if (!note) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Note link copied to clipboard!');
    } catch (err) {
      console.error('Error sharing note:', err);
    }
  };

  const handleEdit = () => {
    if (!note) return;
    // Navigate to edit page - you can modify this path as needed
    navigate(`/notes/${note.id}/edit`);
  };

  const handleDelete = async () => {
    if (!note) return;
    
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this note? This action cannot be undone.'
    );
    
    if (!confirmDelete) return;
    
    try {
      await noteService.deleteNote(note.id);
      alert('Note deleted successfully!');
      navigate('/notes'); // Navigate back to notes list
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Note Not Found</h1>
              <p className="text-gray-600 mb-8">{error || 'The requested note could not be found.'}</p>
              <Button onClick={() => navigate('/notes')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Notes
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const CategoryIcon = getCategoryIcon(note.category || 'other');
  const isOwner = currentUser?.id === note.author?.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/notes')}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Notes
            </Button>

            {/* Note Content */}
            <Card className="mb-6">
              <CardHeader className="pb-4">
                {/* Category and Difficulty */}
                <div className="flex items-center gap-2 mb-4">
                  <CategoryIcon className="w-5 h-5 text-muted-foreground" />
                  <Badge variant="secondary" className="capitalize">
                    {note.category?.replace('-', ' ') || 'Other'}
                  </Badge>
                  {note.difficulty_level && (
                    <Badge 
                      variant="outline" 
                      className={getDifficultyColor(note.difficulty_level)}
                    >
                      {note.difficulty_level}
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-foreground mb-4">
                  {note.title || 'Untitled Note'}
                </h1>

                {/* Author and Community Info */}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {note.author?.displayName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {note.author?.displayName || 'Unknown User'}
                        </span>
                        {note.author?.verified && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Community and Subject */}
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {note.community?.displayName || 'General'}
                  </Badge>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{note.subject || 'No subject'}</span>
                </div>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {note.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <Separator />
              </CardHeader>

              <CardContent>
                {/* Content */}
                <div className="prose max-w-none mb-6">
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {note.content || 'No content available'}
                  </div>
                </div>

                {/* Attachments */}
                {note.attachments && note.attachments.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Attachments ({note.attachments.length})
                    </h3>
                    <div className="space-y-3">
                      {note.attachments.map((attachment, index) => {
                        const FileIcon = getFileTypeIcon(attachment?.type || '');
                        return (
                          <Card key={index} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileIcon className="w-6 h-6 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{attachment?.name || 'Unknown file'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {attachment?.type?.toUpperCase() || 'FILE'} • {
                                      attachment?.size ? 
                                        `${Math.round(attachment.size / 1024)} KB` : 
                                        'Unknown size'
                                    }
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {/* <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadAttachment(attachment)}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </Button> */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`http://localhost:3001${attachment.url}`, '_blank')}
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Separator className="my-6" />

                {/* Action Buttons */}
                {/* <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLike}
                      className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      {note.likes_count || 0} Likes
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      className="text-muted-foreground hover:text-blue-500 hover:bg-blue-50"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      {note.views_count || 0} Views
                    </div>
                  </div>

                  {/* Owner Actions */}
                  {/* {isOwner && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={handleDelete}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div> */} 

                {/* Collaborators */}
                {note.collaborators && note.collaborators.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Collaborators ({note.collaborators.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {note.collaborators.map((collaborator, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {collaborator.user?.displayName?.charAt(0) || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{collaborator.user?.displayName}</span>
                          <Badge variant="outline" className="text-xs">
                            {collaborator.permission}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NoteDetail;
