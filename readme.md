# SENG-350 Group 1

## Links

**Cycle 1**
- Design 1 ([Branch](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/tree/cycle-1/design))
    - [Product Requirements Document](docs/product-requirements-document.md)
    - [Test Plan](docs/test-plan.md)
    - Architecture Design Requirements
        1. [Tech Stack Choices](docs/adr/adr-1-tech-stack-choices.md)
        2. [Performance Priorities](docs/adr/adr-2-performance-priorities.md)
        2. [Development Workflow](docs/adr/adr-3-development-workflow.md)
- Implementation 1 ([Branch](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/tree/cycle-1/implement))
    - [Database Schema](docs/db/schema.md)
    - [Swagger/API Usage](docs/api/api.md)


**Team Docs**
- [Meeting Minutes](docs/minutes.md)
- [Team Expectations](docs/team/team-expectations.md)

**Other**
- [AI Prompt History](docs/prompts.md) 

## Development

Requirements:
- Docker installed
- Docker daemon running (or Docker Desktop)
- Node.js + npm installed


Start the full dev environment with all services:
```bash
npm start
```

Or use Docker Compose directly:
```bash
docker compose up -d
```

This will:
- Install/update dependencies
- Build and start the client (React app) on `localhost:5173`
- Build and start the server (NestJS API) on `localhost:3000  `
    - Show Swagger API docs on `localhost:3000/api-docs`
- Start PostgreSQL database `postgres` on `localhost:5432`
    - Start PostgreSQL database `test_db` on `localhost:5433`
    - Seed both databases with room + building data
    - Seed both databases with demo users
        - `staff@uvic.ca`, password `staff`
        - `registrar@uvic.ca`, password `registrar`
        - `admin@uvic.ca`, password `admin`
- Start Redis cache on `localhost:6379`

To stop all services:
```bash
npm stop
# or
docker compose down
```

To restart with fresh build:
```bash
npm restart
# or
docker compose down -v --remove-orphans && docker compose build --no-cache && docker compose up -d --force-recreate
```

### Other `npm` Scripts

Run linter (checks formatting/style):
```bash
npm run lint
```

Run tests:
```bash
npm test
npm run test:coverage # With coverage
```

## Team Members

| Name             | V#        |
| ---------------- | --------- |
| Keagan Potash    | 01003228  |
| Jennifer Vlaar   | 01001396  |
| Eric Handley     | 01002886  |
| Arda Berktin     | V01009910 |
| Jasper Halvorson | V01000790 |

## Project Structure

```
.
├── docs/                       - Project documentation
│   ├── adr/                    - Architecture Decision Records
│   ├── api/                    - API documentation
│   ├── db/                     - Database documentation
│   ├── team/                   - Team policies and expectations
│   └── ui/                     - UI assets and documentation
├── src/                        
│   ├── client/                 
│   │   ├── public/             - Compiled assets and HTML entry point
│   │   ├── src/                
│   │   │   ├── components/     - React components
│   │   │   ├── constants/      - App constants
│   │   │   ├── contexts/       - React contexts
│   │   │   ├── hooks/          - Custom React hooks
│   │   │   ├── pages/          - Page components
│   │   │   ├── styles/         - CSS stylesheets
│   │   │   ├── types/          - TypeScript type definitions
│   │   │   └── utils/          - Utility functions
│   │   └── tests/              - Frontend unit tests
│   ├── scripts/                - Utility scripts
│   └── server/                 
│       ├── data/               - Static data files
│       ├── src/                - NestJS backend code
│       │   ├── api/            - REST controllers (users, rooms, bookings, etc.)
│       │   ├── app/            - Main application module
│       │   ├── auth/           - Authentication modules
│       │   ├── config/         - Configuration files
│       │   ├── database/       - TypeORM entities and migrations
│       │   │   ├── entities/   - Database entity definitions
│       │   │   ├── migrations/ - Database schema migrations
│       │   │   └── seeds/      - Scripts for importing preset data
│       │   ├── dto/            - Data Transfer Objects for API validation
│       │   ├── filters/        - Exception filters
│       │   ├── services/       - Business logic services  
│       │   └── shared/         - Shared utilities and guards
│       │       ├── cache/      - Redis caching modules
│       │       └── guards/     - Auth guards and middleware
│       └── tests/              - Backend unit tests
└── .vscode/                    - Shared VS Code workspace settings
```