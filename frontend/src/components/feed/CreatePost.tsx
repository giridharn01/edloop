import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, 
  FileText, 
  Image as ImageIcon, 
  Link as LinkIcon,
  Upload,
  X,
  Plus
} from "lucide-react";
import { useAppContext } from "@/hooks/useAppContext";
import { Post } from "@/types";

const CreatePost = () => {
  const { communities, currentUser, createNewPost } = useAppContext();
  const [postType, setPostType] = useState<'text' | 'note' | 'image' | 'link'>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !selectedCommunity || !currentUser) return;

    setIsSubmitting(true);
    setError(null);
    
    try {
      await createNewPost({
        title: title.trim(),
        content: content.trim() || undefined,
        type: postType,
        communityId: selectedCommunity,
        tags: tags.length > 0 ? tags : undefined
      });

      // Reset form
      setTitle('');
      setContent('');
      setTags([]);
      setSelectedCommunity('');
      setPostType('text');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="gradient-card border-0 shadow-soft">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={currentUser?.avatar} />
            <AvatarFallback className="bg-gradient-primary text-white text-sm">
              {currentUser?.displayName.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-lg">Create a post</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
            {error}
          </div>
        )}

        {/* Community Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Choose a community</label>
          <Select value={selectedCommunity} onValueChange={setSelectedCommunity}>
            <SelectTrigger>
              <SelectValue placeholder="Select community" />
            </SelectTrigger>
            <SelectContent>
              {communities.map((community) => (
                <SelectItem key={community.id} value={community.id}>
                  r/{community.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Post Type Tabs */}
        <Tabs value={postType} onValueChange={(value) => setPostType(value as 'text' | 'note' | 'image' | 'link')}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="text" className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="note" className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Note
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-1">
              <ImageIcon className="w-4 h-4" />
              Image
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-1">
              <LinkIcon className="w-4 h-4" />
              Link
            </TabsTrigger>
          </TabsList>

          {/* Title */}
          <div className="space-y-2 mt-4">
            <Input
              placeholder="An interesting title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg"
            />
          </div>

          <TabsContent value="text" className="space-y-4">
            <Textarea
              placeholder="What would you like to discuss? Share your thoughts, ask questions, or start a study discussion..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </TabsContent>

          <TabsContent value="note" className="space-y-4">
            <Textarea
              placeholder="Describe your notes and what subjects they cover..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center space-y-2">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
              <div>
                <p className="font-medium">Upload your study notes</p>
                <p className="text-sm text-muted-foreground">PDF, DOC, or image files</p>
              </div>
              <Button variant="outline" size="sm">
                Choose Files
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center space-y-2">
              <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto" />
              <div>
                <p className="font-medium">Upload an image</p>
                <p className="text-sm text-muted-foreground">PNG, JPG, or GIF</p>
              </div>
              <Button variant="outline" size="sm">
                Choose Image
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <Input
              placeholder="https://example.com"
              className="font-mono"
            />
            <Textarea
              placeholder="Describe the link and why it's relevant..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </TabsContent>
        </Tabs>

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="gap-1">
                #{tag}
                <button onClick={() => removeTag(tag)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={addTag}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="ghost" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={!title.trim() || !selectedCommunity || isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatePost;