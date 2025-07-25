import { User, Community, Group, Post, Note, NotePreview, ContentValidation } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface VoteResponse {
  postId: string;
  upvotes: number;
  downvotes: number;
  userVote: 'up' | 'down' | null;
}

export interface ApiError {
  error: string;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth methods
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    this.setToken(response.token);
    return response;
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    university?: string;
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    this.setToken(response.token);
    return response;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/users/me');
  }

  // Communities
  async getCommunities(): Promise<Community[]> {
    return this.request<Community[]>('/communities');
  }

  async getCommunity(id: string): Promise<Community> {
    return this.request<Community>(`/communities/${id}`);
  }

  async getCommunityPosts(id: string, params?: { page?: number; limit?: number; sort?: string }): Promise<Post[]> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sort) searchParams.append('sort', params.sort);

    const query = searchParams.toString();
    return this.request<Post[]>(`/communities/${id}/posts${query ? `?${query}` : ''}`);
  }

  async createCommunity(communityData: {
    name: string;
    displayName: string;
    description: string;
    category?: 'academic' | 'university' | 'general';
    subject?: string;
    iconUrl?: string;
  }): Promise<Community> {
    return this.request<Community>('/communities', {
      method: 'POST',
      body: JSON.stringify(communityData),
    });
  }

  // Posts
  async getPosts(params?: { page?: number; limit?: number; sort?: string }): Promise<Post[]> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sort) searchParams.append('sort', params.sort);

    const query = searchParams.toString();
    return this.request<Post[]>(`/posts${query ? `?${query}` : ''}`);
  }

  async createPost(postData: {
    title: string;
    content?: string;
    type: 'text' | 'link' | 'image' | 'note';
    communityId: string;
    authorId: string;
    tags?: string[];
    noteFile?: { name: string; url: string; type: string };
    linkUrl?: string;
    imageUrl?: string;
  }): Promise<Post> {
    return this.request<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  // Votes
  async voteOnPost(postId: string, userId: string, voteType: 'up' | 'down'): Promise<VoteResponse> {
    return this.request<VoteResponse>('/votes', {
      method: 'POST',
      body: JSON.stringify({ postId, userId, voteType }),
    });
  }

  // Users
  async getUser(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async updateUser(userData: {
    bio?: string;
    domain?: string;
    university?: string;
    interests?: string[];
  }): Promise<User> {
    return this.request<User>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getUserPosts(): Promise<Post[]> {
    return this.request<Post[]>('/users/me/posts');
  }

  async getUserNotes(): Promise<Note[]> {
    return this.request<Note[]>('/users/me/notes');
  }

  // Notes API
  async getNotes(params?: {
    page?: number;
    limit?: number;
    community?: string;
    subject?: string;
    category?: string;
    author?: string;
    search?: string;
    sort?: 'recent' | 'popular' | 'views' | 'alphabetical';
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/notes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<{
      notes: NotePreview[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }>(endpoint);
  }

  async getNote(id: string): Promise<Note> {
    return this.request<Note>(`/notes/${id}`);
  }

  async createNote(noteData: {
    title: string;
    content: string;
    subject: string;
    communityId: string;
    category: 'lecture' | 'study-guide' | 'summary' | 'homework' | 'exam-prep' | 'research' | 'other';
    difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
    tags?: string[];
    is_public?: boolean;
    images?: Array<{ url: string; caption?: string; alt_text?: string }>;
  }, attachments?: File[]): Promise<Note> {
    if (attachments && attachments.length > 0) {
      // Use FormData for file uploads
      const formData = new FormData();
      
      // Add text fields
      Object.entries(noteData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      });

      // Add files
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      return this.request<Note>('/notes', {
        method: 'POST',
        body: formData,
        headers: {} // Don't set Content-Type for FormData
      });
    } else {
      return this.request<Note>('/notes', {
        method: 'POST',
        body: JSON.stringify(noteData),
      });
    }
  }

  async updateNote(id: string, noteData: Partial<{
    title: string;
    content: string;
    subject: string;
    category: string;
    difficulty_level: string;
    tags: string[];
    is_public: boolean;
    images: Array<{ url: string; caption?: string; alt_text?: string }>;
  }>, newAttachments?: File[]): Promise<Partial<Note>> {
    if (newAttachments && newAttachments.length > 0) {
      const formData = new FormData();
      
      Object.entries(noteData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      newAttachments.forEach(file => {
        formData.append('newAttachments', file);
      });

      return this.request<Partial<Note>>(`/notes/${id}`, {
        method: 'PUT',
        body: formData,
        headers: {}
      });
    } else {
      return this.request<Partial<Note>>(`/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(noteData),
      });
    }
  }

  async deleteNote(id: string) {
    return this.request<{ message: string }>(`/notes/${id}`, {
      method: 'DELETE',
    });
  }

  async likeNote(id: string) {
    return this.request<{ likes_count: number }>(`/notes/${id}/like`, {
      method: 'POST',
    });
  }

  async addNoteCollaborator(id: string, username: string, permission: 'read' | 'edit' | 'admin') {
    return this.request<{ message: string }>(`/notes/${id}/collaborators`, {
      method: 'POST',
      body: JSON.stringify({ username, permission }),
    });
  }

  // Enhanced Post Creation with Rich Content
  async createRichPost(postData: {
    title: string;
    content?: string;
    type: 'text' | 'link' | 'image' | 'note';
    communityId: string;
    authorId: string;
    tags?: string[];
    linkUrl?: string;
    imageUrl?: string;
    richContent?: string; // HTML content with embedded images
  }, attachments?: File[]) {
    if (attachments && attachments.length > 0) {
      const formData = new FormData();
      
      Object.entries(postData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      return this.request<Post>('/posts', {
        method: 'POST',
        body: formData,
        headers: {}
      });
    } else {
      return this.request<Post>('/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      });
    }
  }

  // Upload image and get URL (for rich text editor)
  async uploadImage(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('image', file);

    return this.request<{ url: string; filename: string }>('/upload/image', {
      method: 'POST',
      body: formData,
      headers: {}
    });
  }

  // Content validation
  async validateContent(content: string, type: 'post' | 'note' = 'post'): Promise<ContentValidation> {
    return this.request<ContentValidation>('/content/validate', {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    });
  }

  // Groups API
  async getGroups(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    privacy?: 'public' | 'private';
    sort?: 'newest' | 'popular' | 'active' | 'oldest';
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<{
      groups: Group[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalGroups: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(`/groups?${queryParams.toString()}`);
  }

  async getGroup(id: string): Promise<Group> {
    return this.request<Group>(`/groups/${id}`);
  }

  async createGroup(groupData: {
    name: string;
    description: string;
    category: string;
    privacy?: 'public' | 'private';
    maxMembers?: number;
    tags?: string[];
    rules?: string[];
  }): Promise<Group> {
    return this.request<Group>('/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  }

  async updateGroup(id: string, groupData: Partial<{
    name: string;
    description: string;
    category: string;
    tags: string[];
    rules: string[];
    maxMembers: number;
  }>): Promise<Group> {
    return this.request<Group>(`/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(groupData),
    });
  }

  async joinGroup(id: string, inviteCode?: string): Promise<Group> {
    return this.request<Group>(`/groups/${id}/join`, {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    });
  }

  async leaveGroup(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/groups/${id}/leave`, {
      method: 'POST',
    });
  }

  async deleteGroup(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/groups/${id}`, {
      method: 'DELETE',
    });
  }

  async getGroupPosts(id: string, params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<{
      posts: Post[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalPosts: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(`/groups/${id}/posts?${queryParams.toString()}`);
  }

  async getGroupNotes(id: string, params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<{
      notes: Note[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalNotes: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(`/groups/${id}/notes?${queryParams.toString()}`);
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

export const apiService = new ApiService();
export default ApiService;
