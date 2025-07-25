import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Plus } from "lucide-react";
import { apiService } from "@/services/api";

interface CreateGroupDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateGroupDialog = ({ onSuccess, onCancel }: CreateGroupDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    privacy: "public" as "public" | "private",
    maxMembers: 100,
    tags: [] as string[],
    rules: [] as string[]
  });
  
  const [newTag, setNewTag] = useState("");
  const [newRule, setNewRule] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

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

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim()) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addRule = () => {
    if (newRule.trim() && formData.rules.length < 10) {
      setFormData(prev => ({
        ...prev,
        rules: [...prev.rules, newRule.trim()]
      }));
      setNewRule("");
    }
  };

  const removeRule = (ruleToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter(rule => rule !== ruleToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      await apiService.createGroup(formData);
      onSuccess();
    } catch (error) {
      console.error('Error creating group:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to create group']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Study Group</DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
        {errors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            {errors.map((error, index) => (
              <p key={index} className="text-sm text-destructive">{error}</p>
            ))}
          </div>
        )}

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter group name"
              maxLength={100}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what your group is about"
              maxLength={500}
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Privacy & Limits */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Privacy</Label>
              <p className="text-sm text-muted-foreground">
                {formData.privacy === 'private' ? 'Only members with invite code can join' : 'Anyone can join'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="privacy-toggle" className="text-sm">Private</Label>
              <Switch
                id="privacy-toggle"
                checked={formData.privacy === 'private'}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, privacy: checked ? 'private' : 'public' }))
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="maxMembers">Maximum Members</Label>
            <Input
              id="maxMembers"
              type="number"
              min={2}
              max={1000}
              value={formData.maxMembers}
              onChange={(e) => setFormData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) || 100 }))}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <Label>Tags (optional)</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag"
              maxLength={30}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" onClick={addTag} size="sm" disabled={!newTag.trim() || formData.tags.length >= 10}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {formData.tags.length}/10 tags
          </p>
        </div>

        {/* Rules */}
        <div>
          <Label>Group Rules (optional)</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              placeholder="Add a group rule"
              maxLength={200}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
            />
            <Button type="button" onClick={addRule} size="sm" disabled={!newRule.trim() || formData.rules.length >= 10}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {formData.rules.length > 0 && (
            <div className="space-y-1">
              {formData.rules.map((rule, index) => (
                <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                  <span className="text-sm">{index + 1}. {rule}</span>
                  <X 
                    className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground" 
                    onClick={() => removeRule(rule)}
                  />
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {formData.rules.length}/10 rules
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !formData.name || !formData.description || !formData.category}
          >
            {loading ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </form>
    </>
  );
};

export default CreateGroupDialog;
