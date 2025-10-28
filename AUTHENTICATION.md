# Authentication Implementation

This document describes the authentication system implemented for the Mifumo Connect frontend.

## Overview

The authentication system has been fully integrated with the Mifumo SMS backend API, providing secure user management and session handling.

## Features Implemented

### 1. User Registration
- **Endpoint**: `POST /api/auth/register/`
- **Fields**: email, password, first_name, last_name, phone_number (optional)
- **Features**:
  - Form validation with password strength indicator
  - Real-time password matching validation
  - Terms of service agreement requirement
  - Automatic login after successful registration

### 2. User Login
- **Endpoint**: `POST /api/auth/login/`
- **Fields**: email, password
- **Features**:
  - Remember me functionality
  - Automatic redirect to intended page after login
  - Error handling with user-friendly messages
  - JWT token management

### 3. User Profile Management
- **Endpoints**:
  - `GET /api/auth/profile/` - Fetch user profile
  - `PUT /api/auth/profile/` - Update user profile
- **Features**:
  - Real-time profile updates
  - Avatar display with user initials
  - Editable fields: first_name, last_name, phone_number
  - Read-only email field (cannot be changed)

### 4. Authentication State Management
- **Context**: `AuthContext` provides global authentication state
- **Features**:
  - Automatic token refresh
  - Persistent login sessions
  - Protected route handling
  - Loading states during authentication

### 5. Protected Routes
- **Component**: `ProtectedRoute` wrapper
- **Features**:
  - Automatic redirect to login for unauthenticated users
  - Preserves intended destination after login
  - Loading spinner during authentication check

### 6. Logout Functionality
- **Endpoint**: `POST /api/auth/logout/`
- **Features**:
  - Clears all stored tokens
  - Redirects to login page
  - Available in user profile dropdown

## File Structure

```
src/
├── lib/
│   └── api.ts                    # API client configuration
├── contexts/
│   └── AuthContext.tsx          # Authentication context provider
├── components/
│   ├── ProtectedRoute.tsx       # Route protection wrapper
│   └── layout/
│       └── AppHeader.tsx        # Updated with user profile dropdown
├── pages/
│   ├── Login.tsx               # Updated with real API integration
│   ├── Signup.tsx              # Updated with real API integration
│   ├── Settings.tsx            # Updated with profile management
│   ├── Dashboard.tsx           # Updated with user name display
│   └── Landing.tsx             # Updated with auth redirect
└── App.tsx                     # Updated with AuthProvider and protected routes
```

## API Integration

### Base Configuration
- **Base URL**: `http://127.0.0.1:8000/api`
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json`

### Token Management
- Access tokens stored in localStorage
- Refresh tokens stored in localStorage
- Automatic token refresh on API calls
- Token cleanup on logout

### Error Handling
- Network error handling
- API error message display
- User-friendly error messages
- Loading states during operations

## Security Features

1. **JWT Token Security**
   - Tokens stored in localStorage
   - Automatic token refresh
   - Token validation on each request

2. **Password Security**
   - Password strength validation
   - Password confirmation matching
   - Secure password transmission

3. **Route Protection**
   - All dashboard routes require authentication
   - Automatic redirect for unauthenticated users
   - Preserved navigation state

## Usage

### For Developers

1. **Accessing User Data**
   ```tsx
   import { useAuth } from '@/contexts/AuthContext';

   const { user, isAuthenticated, login, logout } = useAuth();
   ```

2. **Protecting Routes**
   ```tsx
   <Route path="/dashboard" element={
     <ProtectedRoute>
       <Dashboard />
     </ProtectedRoute>
   } />
   ```

3. **API Calls**
   ```tsx
   import { apiClient } from '@/lib/api';

   const response = await apiClient.getProfile();
   ```

### For Users

1. **Registration**: Visit `/signup` to create a new account
2. **Login**: Visit `/login` to sign in to existing account
3. **Profile Management**: Visit `/settings` to update profile information
4. **Logout**: Click on user avatar in header and select "Log out"

## Future Enhancements

- [ ] Password change functionality
- [ ] Email verification flow
- [ ] Two-factor authentication
- [ ] Password reset functionality
- [ ] Profile photo upload
- [ ] Company/tenant management
- [ ] API key management
- [ ] Session management

## Backend Requirements

The frontend expects the following backend endpoints to be available:

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/token/refresh/`
- `GET /api/auth/profile/`
- `PUT /api/auth/profile/`
- `POST /api/auth/password/change/`
- `POST /api/auth/password/reset/`
- `POST /api/auth/verify-email/`
- `POST /api/auth/api-key/generate/`
- `POST /api/auth/api-key/revoke/`
- `POST /api/auth/logout/`

All endpoints should return appropriate HTTP status codes and JSON responses as documented in the API specification.
