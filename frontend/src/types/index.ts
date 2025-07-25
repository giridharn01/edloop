export interface User {
  id: string;
  username: string;
  displayName: string;
  university: string;
  verified: boolean;
  avatar?: string;
  karma: number;
  joinDate: string;
  bio?: string;
  interests?: string[];
  domain?: string;
}

export interface Community {
  id: string;
  name: string;
  displayName: string;
  description: string;
  members: number;
  icon?: string;
  category: 'academic' | 'university' | 'general';
  subject?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  creator: User;
  members: Array<{
    user: User;
    role: 'member' | 'moderator' | 'admin';
    joinedAt: string;
  }>;
  memberCount: number;
  category: string;
  tags: string[];
  privacy: 'public' | 'private';
  inviteCode?: string;
  maxMembers: number;
  rules: string[];
  avatar?: string;
  banner?: string;
  settings: {
    allowMemberPosts: boolean;
    requireApproval: boolean;
    allowFileSharing: boolean;
  };
  stats: {
    totalPosts: number;
    totalNotes: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'link' | 'image' | 'note';
  author: User;
  community?: Community;
  group?: Group;
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
  commentCount: number;
  createdAt: string;
  tags: string[];
  noteFile?: {
    name: string;
    url: string;
    type: string;
  };
}

export interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  category: 'lecture' | 'study-guide' | 'summary' | 'homework' | 'exam-prep' | 'research' | 'other';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  author: User;
  community?: Community;
  group?: Group;
  views_count: number;
  likes_count: number;
  shares_count: number;
  version: number;
  is_public: boolean;
  is_template: boolean;
  createdAt: string;
  updatedAt: string;
  edited_at?: string;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploaded_at: string;
  }>;
  images: Array<{
    url: string;
    caption?: string;
    alt_text?: string;
  }>;
  collaborators: Array<{
    user: {
      id: string;
      username: string;
      displayName: string;
    };
    permission: 'read' | 'edit' | 'admin';
  }>;
}

export interface NotePreview {
  id: string;
  title: string;
  content: string; // Truncated preview
  subject: string;
  category: string;
  difficulty_level: string;
  tags: string[];
  views_count: number;
  likes_count: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    university: string;
    verified: boolean;
  } | null;
  community: {
    id: string;
    name: string;
    displayName: string;
    subject: string;
  } | null;
  group: {
    id: string;
    name: string;
    category: string;
  } | null;
  attachments: Array<{
    name: string;
    type: string;
    size: number;
  }>;
  hasImages: boolean;
}

export interface ContentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    wordCount: number;
    imageCount: number;
    linkCount: number;
    estimatedReadTime: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
  createdAt: string;
  replies: Comment[];
  parentId?: string;
}