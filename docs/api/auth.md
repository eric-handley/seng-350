# Authentication API

## Overview

The authentication system uses session-based authentication with role-based access control (RBAC). Sessions are stored in cookies and expire after 24 hours.

## User Roles

- **Staff** - Regular faculty/staff users
- **Registrar** - Course scheduling and management
- **Admin** - Full system access including user management

## Endpoints

### POST /api/auth/login

Authenticate a user with email and password.

**Request Body:**
```json
{
  "email": "user@uvic.ca",
  "password": "password123"
}
```

**Success Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@uvic.ca",
  "first_name": "John",
  "last_name": "Doe",
  "role": "Staff"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

**Session:**
- Sets session cookie (connect.sid)
- Cookie expires in 24 hours
- httpOnly, sameSite=lax
- secure=true in production

---

### POST /api/auth/logout

Logout and destroy the current session.

**Request:**
- Requires valid session cookie

**Success Response (204 No Content):**
- Empty response body
- Clears session cookie

---

### GET /api/auth/session

Get information about the current authenticated user.

**Request:**
- Requires valid session cookie

**Success Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@uvic.ca",
    "first_name": "John",
    "last_name": "Doe",
    "role": "Admin"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Not authenticated"
}
```

---

## Protected Endpoints

Endpoints can be protected using guards:

### Authentication Required
Endpoints with `@UseGuards(AuthGuard)` require a valid session.

**Error Response (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Authentication required"
}
```

### Role-Based Access
Endpoints with `@UseGuards(AuthGuard, RolesGuard)` and `@Roles(...)` require specific roles.

**Error Response (403 Forbidden):**
User is authenticated but lacks required role.

**Example Protected Endpoints:**
- **User Management** (`/users/*`) - Requires `Admin` role
  - `POST /users` - Create user (Admin only)
  - `GET /users` - List users (Admin only)
  - `GET /users/:id` - Get user (Admin only)
  - `PATCH /users/:id` - Update user (Admin only, cannot change own role)
  - `DELETE /users/:id` - Delete user (Admin only, cannot delete self)

---

## Usage Examples

### Login Flow

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@uvic.ca", "password": "password123"}' \
  -c cookies.txt

# 2. Access protected endpoint
curl -X GET http://localhost:3000/users \
  -b cookies.txt

# 3. Check session
curl -X GET http://localhost:3000/api/auth/session \
  -b cookies.txt

# 4. Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

### Browser/Frontend Usage

```javascript
// Login
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important: include cookies
  body: JSON.stringify({
    email: 'admin@uvic.ca',
    password: 'password123'
  })
});

const user = await response.json();

// Access protected endpoint
const usersResponse = await fetch('http://localhost:3000/users', {
  credentials: 'include' // Include session cookie
});

// Logout
await fetch('http://localhost:3000/api/auth/logout', {
  method: 'POST',
  credentials: 'include'
});
```

---

## Session Configuration

Sessions are configured in `src/main.ts`:

- **Secret:** `SESSION_SECRET` env var (default: dev-session-secret-change-in-production)
- **Cookie Name:** connect.sid
- **Max Age:** 24 hours (86400000 ms)
- **HttpOnly:** true (prevents XSS)
- **Secure:** true in production (HTTPS only)
- **SameSite:** lax (CSRF protection)

**Environment Variables:**
```bash
SESSION_SECRET=your-secure-random-secret-here
NODE_ENV=production  # Enables secure cookies
```

---

## Security Notes

1. **Password Storage:** Passwords are hashed using bcrypt with 10 salt rounds
2. **Session Security:** Sessions use httpOnly cookies to prevent XSS attacks
3. **CORS:** Configured to accept credentials from http://localhost:5173 in development
4. **No Registration:** Users can only be created by Admins via `/users` endpoint
5. **Role Enforcement:** RolesGuard checks user role against required roles on each request

---

## Implementation Details

### Decorators

**@Roles(...roles: UserRole[])**
- Marks endpoints with required roles
- Example: `@Roles(UserRole.ADMIN, UserRole.REGISTRAR)`

**@CurrentUser()**
- Injects authenticated user into controller method
- Returns `AuthenticatedUser` object
- Example:
```typescript
@Get('profile')
@UseGuards(AuthGuard)
async getProfile(@CurrentUser() user: AuthenticatedUser) {
  return user;
}
```

### Guards

**AuthGuard**
- Checks if user is authenticated
- Throws 401 if no valid session
- Location: `src/shared/guards/auth.guard.ts`

**RolesGuard**
- Checks if user has required role(s)
- Returns false if role doesn't match
- Location: `src/shared/guards/roles.guard.ts`

---

## Testing

### Create Admin User (for testing)

First, create an admin user via SQL or migration:

```sql
INSERT INTO users (id, email, password_hash, first_name, last_name, role)
VALUES (
  gen_random_uuid(),
  'admin@uvic.ca',
  '$2a$10$...',  -- bcrypt hash of 'password123'
  'Admin',
  'User',
  'Admin'
);
```

Or use the API (requires existing admin):

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -b admin-cookies.txt \
  -d '{
    "email": "newadmin@uvic.ca",
    "password": "securepass123",
    "first_name": "New",
    "last_name": "Admin",
    "role": "Admin"
  }'
```
