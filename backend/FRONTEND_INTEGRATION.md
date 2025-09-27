# Frontend Integration Guide

This guide explains how to integrate the SkillSwap backend with your React frontend.

## Quick Start

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Update your frontend API calls:**
   Replace any hardcoded data with API calls to `http://localhost:5000/api`

## API Integration Examples

### Authentication

```javascript
// Login
const login = async (identifier, password) => {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ identifier, password }),
  });
  return response.json();
};

// Register
const register = async (userData) => {
  const response = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  return response.json();
};

// Get current user
const getCurrentUser = async (token) => {
  const response = await fetch('http://localhost:5000/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
};
```

### Courses

```javascript
// Get all courses
const getCourses = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`http://localhost:5000/api/courses?${queryParams}`);
  return response.json();
};

// Get course by ID
const getCourse = async (id) => {
  const response = await fetch(`http://localhost:5000/api/courses/${id}`);
  return response.json();
};

// Enroll in course
const enrollInCourse = async (courseId, token) => {
  const response = await fetch(`http://localhost:5000/api/courses/${courseId}/enroll`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
};
```

### Skills

```javascript
// Get all skills
const getSkills = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`http://localhost:5000/api/skills?${queryParams}`);
  return response.json();
};

// Create new skill
const createSkill = async (skillData, token) => {
  const response = await fetch('http://localhost:5000/api/skills', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(skillData),
  });
  return response.json();
};

// Update skill progress
const updateSkillProgress = async (skillId, progress, token) => {
  const response = await fetch(`http://localhost:5000/api/skills/${skillId}/progress`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ progress }),
  });
  return response.json();
};
```

### Marketplace

```javascript
// Get marketplace data
const getMarketplace = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`http://localhost:5000/api/marketplace?${queryParams}`);
  return response.json();
};

// Get featured content
const getFeatured = async () => {
  const response = await fetch('http://localhost:5000/api/marketplace/featured');
  return response.json();
};

// Get categories
const getCategories = async () => {
  const response = await fetch('http://localhost:5000/api/marketplace/categories');
  return response.json();
};
```

## State Management Integration

### Context API Example

```javascript
// AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      getCurrentUser(token).then(response => {
        if (response.success) {
          setUser(response.user);
        }
      });
    }
  }, [token]);

  const login = async (identifier, password) => {
    const response = await login(identifier, password);
    if (response.success) {
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('token', response.token);
    }
    return response;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### API Service Layer

```javascript
// api.js
const API_BASE = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    return response.json();
  }

  // Auth methods
  async login(identifier, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Course methods
  async getCourses(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    return this.request(`/courses?${queryParams}`);
  }

  async getCourse(id) {
    return this.request(`/courses/${id}`);
  }

  async enrollInCourse(id) {
    return this.request(`/courses/${id}/enroll`, {
      method: 'POST',
    });
  }

  // Skill methods
  async getSkills(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    return this.request(`/skills?${queryParams}`);
  }

  async createSkill(skillData) {
    return this.request('/skills', {
      method: 'POST',
      body: JSON.stringify(skillData),
    });
  }

  async updateSkillProgress(id, progress) {
    return this.request(`/skills/${id}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ progress }),
    });
  }

  // Marketplace methods
  async getMarketplace(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    return this.request(`/marketplace?${queryParams}`);
  }

  async getFeatured() {
    return this.request('/marketplace/featured');
  }

  async getCategories() {
    return this.request('/marketplace/categories');
  }
}

export default new ApiService();
```

## Environment Variables

Create a `.env` file in your frontend root:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

## CORS Configuration

The backend is configured to accept requests from `http://localhost:5173` (Vite default). If you're using a different port, update the `FRONTEND_URL` in your backend environment variables.

## Error Handling

```javascript
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    console.error('API Error:', error.response.data);
    return error.response.data;
  } else if (error.request) {
    // Request was made but no response received
    console.error('Network Error:', error.message);
    return { success: false, message: 'Network error. Please check your connection.' };
  } else {
    // Something else happened
    console.error('Error:', error.message);
    return { success: false, message: 'An unexpected error occurred.' };
  }
};
```

## Testing the Integration

1. Start the backend: `npm run dev`
2. Start your frontend: `npm run dev`
3. Test the API endpoints using the browser's Network tab
4. Check the backend logs for any errors

## Common Issues

1. **CORS errors**: Make sure the frontend URL is correctly configured in the backend
2. **Authentication errors**: Ensure the JWT token is being sent in the Authorization header
3. **Database connection**: Make sure MongoDB is running
4. **Environment variables**: Verify all required environment variables are set

## Next Steps

1. Implement proper error boundaries in your React components
2. Add loading states for API calls
3. Implement optimistic updates for better UX
4. Add proper form validation
5. Implement file upload for avatars and course images
