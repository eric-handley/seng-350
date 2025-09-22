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
- Team has more experience using Typescript.

**React over Next.js:**
- More flexible.
- Requires more setup and external libraries.
- Component-based architecture.
- Team has more experince using React.
- Suitable for wide range of projects.

## Entry Layer
**NestJS over Express**
- More consistency with backend.
- Structured (modular and organized) approach with conventions to follow.
- NestJS more suitable for complex applications.
- Steeper learning curve.
- May have slightly worse performance.

## Backend
**NestJS**
- Alternative choices not given.
- Utilizes Typescript.
- Easy scalability.
- Modular structure.

## Server-Side Data Store
**PostgreSQL over SQLite**
- Team has more experince usign PostgreSQL.
- PostgreSQL has more in-depth abilities.
- PostgreSQL better for multiple users.
- More scalable.
- Requires more management.
- Captured in issues #12 #13 #14 and #15

## Cache and Minimal Messaging
**Redis**
- Alternative choices not given.
- Stores data in RAM (fast read and write)
- Cache-aside and cache-prefetching caching patterns.
- Minimizes need to query primary database.
- Scalable for large amounts of data and traffic.

## Authentication and Authorization
**Auth.js over JWT**
- Full-featured authentication for React.
- Abstracts away low-level details of JWT.
- Less customizable.
- Browser-centric.
- Handles various providers and session management complexities.
- May cause extra setup steps when being used with React
- Captured in issue #26

## Testing and Demo Tools
**Jest over Vitest**
- Team has more experince using Jest.
- Scalable and reliable.
- Slower feedback loop.
- Large ecosystem.
- More complex setup and configuration.

## Packaging
**Docker**
- Alternative choices not given.
- Encapsulates application and dependencies in container.
- Offers consistency in different environments.
- Team has experience using Docker.