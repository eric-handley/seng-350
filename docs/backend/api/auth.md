# Authentication API

## Overview

The authentication system uses session-based authentication with role-based access control. Sessions are stored in cookies and expire after 24 hours.

## User Roles

- **Staff** - Regular faculty/staff users
  - Can view own profile, manage own bookings, and search rooms
- **Registrar** - Course scheduling and management
  - Can view/create/edit/delete Staff users (cannot edit roles)
  - Can view and manage all bookings
  - Can search rooms and buildings
- **Admin** - Full system access including user management
  - Can create/edit/delete any user (including role changes)
  - Can view and manage all bookings
  - Full access to rooms, buildings, equipment, and audit logs

For a complete permission matrix, see [permissions.md](./permissions.md).

Test users are set up in the database with the following credentials:
- `staff@uvic.ca`, password `staff`
- `registrar@uvic.ca`, password `registrar`
- `admin@uvic.ca`, password `admin`

## Endpoints

### POST /api/auth/login

Authenticate a user with email and password.

**Request Body:**
```json
{
  "email": "staff@uvic.ca",
  "password": "staff"
}
```

**Success Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "staff@uvic.ca",
  "first_name": "Staff",
  "last_name": "User",
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
    "email": "admin@uvic.ca",
    "first_name": "Admin",
    "last_name": "User",
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
- **User Management** (`/users/*`)
  - `POST /users` - Create user (Registrar: Staff only, Admin: any role)
  - `GET /users` - List users (Registrar/Admin only)
  - `GET /users/:id` - Get user (Staff: own profile only, Registrar/Admin: any user)
  - `PATCH /users/:id` - Update user (Registrar: Staff users only, cannot change roles; Admin: any user, can change roles except own)
  - `DELETE /users/:id` - Delete user (Registrar: Staff users only; Admin: any user except self)
- **Bookings** (`/bookings/*`)
  - All roles can create and manage their own bookings
  - Registrar/Admin can view and manage all bookings
  - Staff can only view and manage their own bookings
- **Schedule** (`/schedule`)
  - Staff, Registrar, and Admin can query available or booked time slots grouped by building and room

---

## Frontend Usage

```javascript
// Login
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important: include cookies
  body: JSON.stringify({
    email: 'admin@uvic.ca',
    password: 'admin'
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
