# Authentication API Documentation

Simple documentation for integrating with our authentication system.

## Base URL
```
http://localhost:5000/api
```

## Authentication Endpoints

### 1. Register New User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```
Response:
```json
{
  "success": true,
  "message": "User registered. Please check your email for verification code.",
  "data": {
    "email": "john@example.com"
  }
}
```

### 2. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```
Response:
```json
{
  "success": true,
  "token": "jwt_token_here",
  "redirectUrl": "/dashboard",
  "data": {
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

### 3. Email Verification
```http
POST /auth/verify-email
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```
Response:
```json
{
  "success": true,
  "message": "Email verified successfully",
  "token": "jwt_token_here"
}
```

### 4. Resend Verification Email
```http
POST /auth/resend-verification
Content-Type: application/json

{
  "email": "john@example.com"
}
```
Response:
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

### 5. OAuth Login Routes

#### Google OAuth
- Login: `GET /auth/google`
- Admin Login: `GET /auth/admin/google`

#### Facebook OAuth
- Login: `GET /auth/facebook`
- Admin Login: `GET /auth/admin/facebook`

### 6. Get Current User
```http
GET /auth/user
Authorization: Bearer your_jwt_token
```
Response:
```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isEmailVerified": true
  }
}
```

### 7. Logout
```http
GET /auth/logout
Authorization: Bearer your_jwt_token
```
Response:
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

## Admin Endpoints

### 1. Register Admin
```http
POST /auth/admin/register
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "adminpass123"
}
```

### 2. Update User Role (Admin Only)
```http
PUT /auth/role/:userId
Authorization: Bearer admin_jwt_token
Content-Type: application/json

{
  "role": "admin"  // or "user"
}
```

### 3. Get All Users (Admin Only)
```http
GET /users
Authorization: Bearer admin_jwt_token
```

## Integration Guide

### 1. Authentication Header
For protected routes, include the JWT token in the Authorization header:
```
Authorization: Bearer your_jwt_token
```

### 2. CORS Support
The API supports CORS for frontend integration. Make sure to include credentials in your requests:
```javascript
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
```

### 3. Error Handling
All endpoints return consistent error responses:
```json
{
  "success": false,
  "message": "Error message here"
}
```

### 4. OAuth Flow
1. Redirect users to OAuth login routes (`/auth/google` or `/auth/facebook`)
2. User authenticates with provider
3. Backend redirects to your frontend with JWT token
4. Store token and redirect to appropriate dashboard

## Frontend Integration Examples

### React Integration
```javascript
// Example using React hooks
const useAuth = () => {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.data.user);
    }
    return data;
  };

  const logout = async () => {
    await fetch('http://localhost:5000/api/auth/logout', {
      method: 'GET',
      credentials: 'include'
    });
    setUser(null);
  };

  return { user, login, logout };
};
```

### Next.js Integration
```javascript
// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth';

export default NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const res = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials),
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success) {
          return data.data.user;
        }
        return null;
      }
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorizationUrl: 'http://localhost:5000/api/auth/google'
    }),
    Facebook({
      clientId: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      authorizationUrl: 'http://localhost:5000/api/auth/facebook'
    })
  ],
});
```

### Vue.js Integration
```javascript
// Example using Vue Composition API
import { ref } from 'vue';

export const useAuth = () => {
  const user = ref(null);

  const login = async (email, password) => {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      user.value = data.data.user;
    }
    return data;
  };

  return { user, login };
};
```

## Environment Setup

### Required Environment Variables
```env
# Backend URL
REACT_APP_API_URL=http://localhost:5000/api  # For React
NEXT_PUBLIC_API_URL=http://localhost:5000/api # For Next.js
VITE_API_URL=http://localhost:5000/api        # For Vite-based projects

# OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# JWT Secret
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
```

## Important CORS Considerations
- The backend is configured to accept requests from any frontend origin in development
- For production, set the correct CLIENT_URL in your backend .env file
- All requests that require authentication must include credentials
- Cookies are configured to work cross-domain in both development and production

## Security Best Practices
1. Store JWT tokens in HTTP-only cookies (already implemented in backend)
2. Use environment variables for sensitive information
3. Implement refresh token rotation (endpoint available)
4. Always validate user session on frontend app load
5. Handle token expiration gracefully

## Common Integration Patterns

### Protected Routes
```javascript
// React Example
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return user ? children : <Navigate to="/login" />;
};

// Next.js Example
export async function getServerSideProps({ req }) {
  const token = req.cookies.token;
  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  return { props: {} };
}
```

### OAuth Button Implementation
```javascript
// Universal implementation that works with any framework
const OAuthButton = ({ provider }) => {
  const handleLogin = () => {
    window.location.href = `http://localhost:5000/api/auth/${provider}`;
  };

  return (
    <button onClick={handleLogin}>
      Login with {provider}
    </button>
  );
};
```

### Error Handling
```javascript
// Example error boundary or interceptor
const handleApiError = (error) => {
  if (error.status === 401) {
    // Token expired or invalid
    logout();
    redirect('/login');
  } else if (error.status === 403) {
    // Permission denied
    redirect('/unauthorized');
  } else {
    // Generic error handling
    showErrorNotification(error.message);
  }
};
```

## Security Features
- Password hashing using bcrypt
- JWT-based authentication
- HTTP-only cookies for token storage
- Email verification with OTP
- Role-based access control
- OAuth 2.0 integration with Google and Facebook
