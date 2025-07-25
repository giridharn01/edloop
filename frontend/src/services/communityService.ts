// API service for communities
const API_BASE_URL = 'http://localhost:3001/api';

interface Community {
  id: string;
  name: string;
  displayName: string;
  description: string;
  members: number;
  category: string;
  subject: string;
  createdBy: string;
  iconUrl?: string;
  isPrivate: boolean;
}

class CommunityService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getAllCommunities(search?: string) {
    const queryParams = new URLSearchParams();
    
    if (search && search.trim()) {
      queryParams.append('search', search);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/communities?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching communities:', error);
      throw error;
    }
  }

  async searchCommunities(query: string) {
    return this.getAllCommunities(query);
  }

  async getCommunityById(id: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/communities/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching community:', error);
      throw error;
    }
  }
}

export const communityService = new CommunityService();
export type { Community };
