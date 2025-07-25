// API service for notes
import { NoteFilters, CreateNoteData, UpdateNoteData } from '@/types/note';

const API_BASE_URL = 'http://localhost:3001/api';

class NoteService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  private getFormDataHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData, let browser set it
    };
  }

  async getAllNotes(filters?: NoteFilters) {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
    }

    const url = `${API_BASE_URL}/notes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Temporarily remove auth requirement for testing
          ...this.getAuthHeaders()
        }
      });

      if (!response.ok) {
        console.error('Response not ok:', response.status, response.statusText);
        throw new Error(`Failed to fetch notes: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }

  async getNoteById(id: string) {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch note: ${response.statusText}`);
    }

    return response.json();
  }

  async createNote(noteData: CreateNoteData) {
    const formData = new FormData();
    
    // Add text fields with proper formatting
    Object.entries(noteData).forEach(([key, value]) => {
      if (key !== 'attachments' && value !== undefined) {
        if (key === 'tags' && Array.isArray(value)) {
          // Send tags as JSON string for backend parsing
          formData.append('tags', JSON.stringify(value));
        } else if (key === 'is_public' && typeof value === 'boolean') {
          // Send boolean as string
          formData.append('is_public', value.toString());
        } else if (!Array.isArray(value)) {
          formData.append(key, String(value));
        }
      }
    });

    // Add files if present
    if (noteData.attachments && noteData.attachments.length > 0) {
      noteData.attachments.forEach((file: File) => {
        formData.append('attachments', file);
      });
    }

    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: this.getFormDataHeaders(),
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to create note: ${response.statusText}`);
    }

    return response.json();
  }

  async updateNote(id: string, noteData: UpdateNoteData) {
    const formData = new FormData();
    
    Object.entries(noteData).forEach(([key, value]) => {
      if (key !== 'newAttachments' && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(item => formData.append(`${key}[]`, item));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    if (noteData.newAttachments && noteData.newAttachments.length > 0) {
      noteData.newAttachments.forEach((file: File) => {
        formData.append('newAttachments', file);
      });
    }

    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'PUT',
      headers: this.getFormDataHeaders(),
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update note: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteNote(id: string) {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to delete note: ${response.statusText}`);
    }

    return response.json();
  }

  async likeNote(id: string) {
    const response = await fetch(`${API_BASE_URL}/notes/${id}/like`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to like note: ${response.statusText}`);
    }

    return response.json();
  }

  async shareNote(id: string) {
    const response = await fetch(`${API_BASE_URL}/notes/${id}/share`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to share note: ${response.statusText}`);
    }

    return response.json();
  }

  async addCollaborator(noteId: string, userId: string, permission: 'read' | 'edit' | 'admin') {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/collaborators`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ userId, permission })
    });

    if (!response.ok) {
      throw new Error(`Failed to add collaborator: ${response.statusText}`);
    }

    return response.json();
  }

  async removeCollaborator(noteId: string, userId: string) {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/collaborators/${userId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to remove collaborator: ${response.statusText}`);
    }

    return response.json();
  }
}

export const noteService = new NoteService();
