import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Community, Post } from '@/types';
import { apiService } from '@/services/api';

interface AppContextType {
  // User state
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  
  // Authentication
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    university?: string;
  }) => Promise<void>;
  
  // Communities state
  communities: Community[];
  setCommunities: (communities: Community[]) => void;
  
  // Posts state
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Error state
  error: string | null;
  setError: (error: string | null) => void;
  
  // Actions
  addPost: (post: Post) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  deletePost: (postId: string) => void;
  voteOnPost: (postId: string, voteType: 'up' | 'down') => void;
  joinCommunity: (communityId: string) => void;
  leaveCommunity: (communityId: string) => void;
  
  // API actions
  loadCommunities: () => Promise<void>;
  loadPosts: () => Promise<void>;
  createNewPost: (postData: {
    title: string;
    content?: string;
    type: 'text' | 'link' | 'image' | 'note';
    communityId: string;
    tags?: string[];
    noteFile?: { name: string; url: string; type: string };
    linkUrl?: string;
    imageUrl?: string;
  }) => Promise<void>;
  createCommunity: (communityData: {
    name: string;
    displayName: string;
    description: string;
    category?: 'academic' | 'university' | 'general';
    subject?: string;
    iconUrl?: string;
  }) => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize data on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Check for existing auth token and validate session
        const token = localStorage.getItem('authToken');
        if (token) {
          apiService.setToken(token);
          try {
            // Try to get current user data to validate the token
            const userData = await apiService.getCurrentUser();
            setCurrentUser(userData);
          } catch (err) {
            // Token is invalid or user not found, clear session
            console.warn('Session validation failed, clearing session:', err);
            localStorage.removeItem('authToken');
            apiService.clearToken();
            setCurrentUser(null);
          }
        }

        // Load data from API
        await Promise.all([
          loadCommunities(),
          loadPosts()
        ]);
      } catch (err) {
        console.error('Failed to initialize data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, []);

  const initializeData = async () => {
    // This method is kept for external calls if needed
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadCommunities(),
        loadPosts()
      ]);
    } catch (err) {
      console.error('Failed to initialize data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCommunities = async () => {
    try {
      const communitiesData = await apiService.getCommunities();
      setCommunities(communitiesData);
    } catch (err) {
      console.error('Failed to load communities:', err);
      // Set empty array instead of keeping any fallback data
      setCommunities([]);
      throw err;
    }
  };

  const loadPosts = async () => {
    try {
      const postsData = await apiService.getPosts({ sort: 'recent', limit: 50 });
      setPosts(postsData);
    } catch (err) {
      console.error('Failed to load posts:', err);
      // Set empty array instead of keeping any fallback data
      setPosts([]);
      throw err;
    }
  };

  const createNewPost = async (postData: {
    title: string;
    content?: string;
    type: 'text' | 'link' | 'image' | 'note';
    communityId: string;
    tags?: string[];
    noteFile?: { name: string; url: string; type: string };
    linkUrl?: string;
    imageUrl?: string;
  }) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    try {
      const newPost = await apiService.createPost({
        ...postData,
        authorId: currentUser.id
      });
      setPosts(prev => [newPost, ...prev]);
    } catch (err) {
      console.error('Failed to create post:', err);
      throw err;
    }
  };

  const createCommunity = async (communityData: {
    name: string;
    displayName: string;
    description: string;
    category?: 'academic' | 'university' | 'general';
    subject?: string;
    iconUrl?: string;
  }) => {
    try {
      const newCommunity = await apiService.createCommunity(communityData);
      setCommunities(prev => [...prev, newCommunity]);
    } catch (err) {
      console.error('Failed to create community:', err);
      throw err;
    }
  };

  // Actions
  const addPost = (post: Post) => {
    setPosts(prevPosts => [post, ...prevPosts]);
  };

  const updatePost = (postId: string, updates: Partial<Post>) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId ? { ...post, ...updates } : post
      )
    );
  };

  const deletePost = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  const voteOnPost = async (postId: string, voteType: 'up' | 'down') => {
    if (!currentUser) return;
    
    try {
      const response = await apiService.voteOnPost(postId, currentUser.id, voteType);
      
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              upvotes: response.upvotes,
              downvotes: response.downvotes,
              userVote: response.userVote
            };
          }
          return post;
        })
      );
    } catch (err) {
      console.error('Failed to vote on post:', err);
    }
  };

  const joinCommunity = (communityId: string) => {
    setCommunities(prevCommunities =>
      prevCommunities.map(community =>
        community.id === communityId
          ? { ...community, members: community.members + 1 }
          : community
      )
    );
  };

  const leaveCommunity = (communityId: string) => {
    setCommunities(prevCommunities =>
      prevCommunities.map(community =>
        community.id === communityId
          ? { ...community, members: Math.max(0, community.members - 1) }
          : community
      )
    );
  };

  // Authentication functions
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.login(username, password);
      setCurrentUser(response.user);
      // Reload data after login
      await Promise.all([
        loadCommunities(),
        loadPosts()
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiService.clearToken();
    setCurrentUser(null);
    setCommunities([]);
    setPosts([]);
    setError(null);
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    university?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.register(userData);
      setCurrentUser(response.user);
      // Reload data after registration
      await Promise.all([
        loadCommunities(),
        loadPosts()
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AppContextType = {
    currentUser,
    setCurrentUser,
    login,
    logout,
    register,
    communities,
    setCommunities,
    posts,
    setPosts,
    isLoading,
    setIsLoading,
    error,
    setError,
    addPost,
    updatePost,
    deletePost,
    voteOnPost,
    joinCommunity,
    leaveCommunity,
    loadCommunities,
    loadPosts,
    createNewPost,
    createCommunity,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
