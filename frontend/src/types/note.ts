// Types for Note functionality
export interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  category: 'lecture' | 'study-guide' | 'summary' | 'homework' | 'exam-prep' | 'research' | 'other';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  views_count: number;
  likes_count: number;
  shares_count: number;
  is_public: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    university?: string;
    verified: boolean;
  };
  community: {
    id: string;
    name: string;
    displayName: string;
    description?: string;
    subject: string;
    category: string;
  };
  attachments: Attachment[];
  images: NoteImage[];
  collaborators: Collaborator[];
  parent_note?: string;
  version: number;
  edited_at?: string;
  last_accessed: string;
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

export interface NoteImage {
  url: string;
  caption?: string;
  alt_text?: string;
}

export interface Collaborator {
  user: {
    id: string;
    username: string;
    displayName: string;
  };
  permission: 'read' | 'edit' | 'admin';
}

export interface CreateNoteData {
  title: string;
  content: string;
  subject: string;
  communityId: string;
  category: Note['category'];
  difficulty_level?: Note['difficulty_level'];
  tags?: string[];
  is_public?: boolean;
  attachments?: File[];
}

export interface UpdateNoteData extends Partial<CreateNoteData> {
  id: string;
  newAttachments?: File[];
}

export interface NoteFilters {
  community?: string;
  subject?: string;
  category?: string;
  difficulty?: string;
  author?: string;
  tags?: string[];
  search?: string;
}
