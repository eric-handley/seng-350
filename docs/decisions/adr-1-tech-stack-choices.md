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
- Better autocompletion, refactoring suggestions, and code navigation due to type information being available.\
\
**React over next.js:**
- More flexible
- Requires more setup
- 
## Entry Layer
**NestJS over Express**
- More consistency with backend.
- 
## Backend
**NestJS**
- Alternaive choices not given.
- 
## Server-Side Data Store
**PostgreSQL over SQLite**
- 
## Cache and Minimal Messaging
**Redis**
- Alternative choices not given.
- 
## Authentication and Authorization
**Auth.js over JWT**
## Testing and Demo Tools
**TODO**
## Packaging
**Docker**
- Alternative choices not given.
- 