# OAuth-Based Role-Based Authentication System

This is a reusable OAuth-based role-based authentication system for hackathon projects. It supports authentication with Google and Facebook OAuth providers and includes role-based access control with two types of users: Admin and User.

## Features

- Google and Facebook OAuth authentication
- JWT-based authentication
- Role-based access control (Admin and User roles)
- Ready to use with Next.js frontend
- MongoDB database integration

## Tech Stack

- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: Passport.js with OAuth strategies
- **Token**: JSON Web Tokens (JWT)

## Prerequisites

- Node.js (v14+ recommended)
- MongoDB (local instance or MongoDB Atlas)
- Google OAuth credentials (from Google Developer Console)
- Facebook OAuth credentials (from Facebook Developer Console)

## Installation

1. Clone the repository or copy the files to your project
2. Install dependencies:

```bash
npm install
```

3. Configure your environment variables by creating a `.env` file with the following variables:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/auth_system
# Or use MongoDB Atlas: mongodb+srv://<username>:<password>@cluster.mongodb.net/auth_system

# JWT Secret
JWT_SECRET=your_jwt_super_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d

# OAuth Credentials
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback

# Client URL (Next.js frontend)
CLIENT_URL=http://localhost:3000
```

4. Start the server:

```bash
npm start
```

## API Endpoints

### Authentication Routes

- `GET /api/auth/google`: Start Google OAuth flow
- `GET /api/auth/google/callback`: Handle Google OAuth callback
- `GET /api/auth/facebook`: Start Facebook OAuth flow
- `GET /api/auth/facebook/callback`: Handle Facebook OAuth callback
- `GET /api/auth/user`: Get current user (Protected)
- `PUT /api/auth/role/:userId`: Update user role (Admin only)
- `GET /api/auth/logout`: Logout

### User Routes (Admin only)

- `GET /api/users`: Get all users 
- `GET /api/users/:id`: Get user by ID
- `DELETE /api/users/:id`: Delete user

## Next.js Frontend Integration

1. Create authentication hooks in your Next.js app:

```javascript
// hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/user`);
      setUser(res.data.data);
      setLoading(false);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  };

  const loginWithOAuth = (provider) => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/${provider}`;
  };

  const logout = async () => {
    try {
      await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`);
      localStorage.removeItem('token');
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithOAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

2. Create OAuth callback page in your Next.js app:

```javascript
// pages/auth/success.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AuthSuccess() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { token } = router.query;
      if (token) {
        localStorage.setItem('token', token);
        window.location.href = '/dashboard';
      }
    }
  }, [router.query]);

  return <div>Processing authentication...</div>;
}
```

3. Create login buttons in your Next.js app:

```javascript
// components/LoginButtons.js
import { useAuth } from '../hooks/useAuth';

export default function LoginButtons() {
  const { loginWithOAuth } = useAuth();

  return (
    <div>
      <button onClick={() => loginWithOAuth('google')}>
        Login with Google
      </button>
      <button onClick={() => loginWithOAuth('facebook')}>
        Login with Facebook
      </button>
    </div>
  );
}
```

## Security Notes

- Always use HTTPS in production
- Keep your JWT secret secure and change it regularly
- Implement rate limiting for authentication attempts
- Consider adding additional security measures like CSRF protection
  
