# Frontend API Usage Guide

> **Swagger UI**: Interactive API documentation is available at `http://localhost:3000/api-docs` when the server is running. For adding Swagger documentation to backend code, see [swagger.md](./swagger.md).

> **Authentication**: For information on authenticating with the API (required for `credentials: 'include'`) see [auth.md](./auth.md).

## Base URL
```
http://localhost:3000
```

## HTTP Verbs

### GET
```javascript
// Get all items
const response = await fetch('http://localhost:3000/api/users', {
  credentials: 'include' // Include session cookie
});
const users = await response.json();

// Get specific item
const response = await fetch('http://localhost:3000/api/users/123', {
  credentials: 'include'
});
const user = await response.json();

// With query parameters
const response = await fetch('http://localhost:3000/api/users?page=1&limit=10', {
  credentials: 'include'
});
const results = await response.json();
```

### POST (Create)
```javascript
const newUser = {
  name: 'John Doe',
  email: 'john@example.com'
};

const response = await fetch('http://localhost:3000/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(newUser),
  credentials: 'include' // Include session cookie
});

const createdUser = await response.json();
```

### PUT (Complete Update)
```javascript
const updatedUser = {
  name: 'John Smith',
  email: 'john.smith@example.com'
};

const response = await fetch('http://localhost:3000/api/users/123', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updatedUser),
  credentials: 'include'
});

const result = await response.json();
```

### PATCH (Partial Update)
```javascript
const updates = {
  name: 'John Smith'  // Only updating name
};

const response = await fetch('http://localhost:3000/api/users/123', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updates),
  credentials: 'include'
});

const result = await response.json();
```

### DELETE
```javascript
const response = await fetch('http://localhost:3000/api/users/123', {
  method: 'DELETE',
  credentials: 'include'
});

// DELETE often returns no content, just check status
if (response.ok) {
  console.log('User deleted successfully');
}
```