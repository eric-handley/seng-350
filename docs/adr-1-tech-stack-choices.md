# Title: ADR 1: Tech Stack Choices
## Context
The following tech stack was chosen from pre-approved options given for the project.
## Decision
We will use Typescript with React for frontend, NestJS for the entry layer, NestJS for the backend, PostgreSQL for server-side data store, Redis for cache and minimal messaging, Auth.js for authentication and authorization.
## Status
Accepted 
## Consequences
### Frontend
**Typescript over Javascript:**
- Easier to avoid and debug type errors in Typescript.  
- Takes an extra step to compile into Javascript.
- Steeper learning curve.
- Better autocompletion, refactoring suggestions, and code navigation due to type information being available.
- Team has more experience using Typescript\

**React over next.js:**
- More flexible.
- Requires more setup and external libraries.
- Component-based architecture.
- Team has more experince using React.
- Suitable for wide range of projects.\

## Entry Layer
**NestJS over Express**
- More consistency with backend.
- Structured (modular and organized) approach with conventions to follow.
- NestJS more suitable for complex applications.
- Steeper learning curve.
- May have slightly worse performance.\

## Backend
**NestJS**
- Alternative choices not given.
- Utilizes Typescript.
- Easy scalability.
- \
## Server-Side Data Store
**PostgreSQL over SQLite**
- Team has more experince usign PostgreSQL.
- PostgreSQL has more in-depth abilities.
- PostgreSQL better for multiple users.
- More scalable.
- Requires more management.\

## Cache and Minimal Messaging
**Redis**
- Alternative choices not given.
- 
## Authentication and Authorization
**Auth.js over JWT**
- 
## Testing and Demo Tools
**Jest over Vitest**
- Team has more experince using Jest.
- 
## Packaging
**Docker**
- Alternative choices not given.
- 