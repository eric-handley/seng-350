# SENG-350 Group 1

## Links

**Cycle 2**
- Implementation 2 ([Branch](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/tree/cycle-2/implement))
    - Updated Features
        - Staff Functionality (issue [#1](courses/2025091/SENG350_COSI/teams/group_1_proj#1))
            - Reoccuring bookings (issues [#14](courses/2025091/SENG350_COSI/teams/group_1_proj#14) and [#47](courses/2025091/SENG350_COSI/teams/group_1_proj#47))
            - View equipment in room (issue [#56](courses/2025091/SENG350_COSI/teams/group_1_proj#56))
        - Registrar Functionality (issue [#7](courses/2025091/SENG350_COSI/teams/group_1_proj#7))
            - View stats/logs (issue [#64](courses/2025091/SENG350_COSI/teams/group_1_proj#64))
        - Testing
            - Fix skipped tests (issue [#63](courses/2025091/SENG350_COSI/teams/group_1_proj#63))
            - More comprehensive frontend tests (issue [#52](courses/2025091/SENG350_COSI/teams/group_1_proj#52))
        - Improve comments (issues [#60](courses/2025091/SENG350_COSI/teams/group_1_proj#60), [#61](courses/2025091/SENG350_COSI/teams/group_1_proj#61), and [#58](courses/2025091/SENG350_COSI/teams/group_1_proj#58))
    - New Features
        - MCP Endpoint (issue [#53](courses/2025091/SENG350_COSI/teams/group_1_proj#53))
        - Swap a major library (issue [#59](courses/2025091/SENG350_COSI/teams/group_1_proj#59))
- Design 2 ([Branch](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/tree/cycle-2/design))
    - Architecture Views
        - [Component & Connector View](docs/2-design/component-connector-view.md)
        - [Module View](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/blob/cycle-2/design/docs/2-design/module-view.svg?ref_type=heads) ([source](docs/2-design/module-view.mmd))
    - [Technical Debt Issues](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/issues?sort=created_date&state=all&label_name%5B%5D=tag%3A%3Atechnical%20debt&first_page_size=100)
    - Architecture Design Requirements (Updated)
        - [Performance Priorities](docs/adr/adr-2-performance-priorities.md)
        - [Development Workflow](docs/adr/adr-3-development-workflow.md)

**Cycle 1**
- Implementation 1 ([Branch](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/tree/cycle-1/implement))
    - > [!important]
      > **Running**: `docker compose up -d --wait` and wait for all services to be healthy (could take a while) before testing. A `NetworkError` when attempting to log in indicates that the server has not fully started yet (this is usually the last service to finish setting up)
    - Architecture Documentation
        - [Database Schema](docs/backend/db/database-schema.md)
        - [API Documentation](docs/backend/api/api.md)
            - [Swagger OpenAPI Documentation](docs/backend/api/swagger.md) (`localhost:3000/api-docs`)
            - [Authentication](docs/backend/api/auth.md)
        - [Role Permissions Matrix](docs/backend/api/permissions.md)
    - Marking
        - [Rubric](docs/1-implement/rubric.md)
        - [Scope Changes](docs/1-implement/scope-changes.md)
- Design 1 ([Branch](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/tree/cycle-1/design))
    - [Product Requirements Document](docs/1-design/product-requirements-document.md)
    - [Test Plan](docs/1-design/test-plan.md)
    - Architecture Design Requirements
        1. [Tech Stack Choices](docs/adr/adr-1-tech-stack-choices.md)
        2. [Performance Priorities](docs/adr/adr-2-performance-priorities.md)
        3. [Development Workflow](docs/adr/adr-3-development-workflow.md)

**Team Docs**
- [Meeting Notes](docs/team/minutes.md)
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
```

To restart with fresh build:
```bash
npm restart
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
├── docs/                           - Project documentation
│   ├── 1-design/                   - Cycle 1 design deliverables
│   ├── 1-implement/                - Cycle 1 implementation deliverables
│   ├── 2-design/                   - Cycle 2 design deliverables
│   ├── adr/                        - Architecture Decision Records
│   ├── backend/                    - Backend documentation
│   │   ├── api/                    - API documentation
│   │   └── db/                     - Database documentation
│   ├── frontend/                   - Frontend UI assets and documentation
│   ├── team/                       - Team policies and expectations
│   └── prompts.md                  - AI prompt history
├── docker/                         - Docker configuration files
│   ├── Dockerfile.client           - Client container configuration
│   └── Dockerfile.server           - Server container configuration
├── src/
│   ├── client/
│   │   ├── public/                 - Compiled assets and HTML entry point
│   │   ├── src/
│   │   │   ├── api/                - API client functions
│   │   │   ├── components/         - React components
│   │   │   │   └── admin/          - Admin-specific components
│   │   │   ├── contexts/           - React contexts
│   │   │   ├── hooks/              - Custom React hooks
│   │   │   ├── pages/              - Page components
│   │   │   ├── styles/             - CSS stylesheets
│   │   │   ├── types/              - TypeScript type definitions
│   │   │   └── utils/              - Utility functions
│   │   └── tests/                  - Frontend unit tests
│   ├── scripts/                    - Utility scripts
│   └── server/
│       ├── data/                   - Static data files
│       ├── src/                    - NestJS backend code
│       │   ├── api/                - REST controllers
│       │   ├── app/                - Main application module
│       │   ├── auth/               - Authentication modules
│       │   ├── config/             - Configuration files
│       │   ├── database/           - TypeORM entities and migrations
│       │   │   ├── entities/       - Database entity definitions
│       │   │   ├── migrations/     - Database schema migrations
│       │   │   └── seeds/          - Scripts for importing preset data
│       │   ├── dto/                - Data Transfer Objects for API validation
│       │   ├── filters/            - Exception filters
│       │   ├── services/           - Business logic services
│       │   └── shared/             - Shared utilities and guards
│       │       ├── cache/          - Redis caching modules
│       │       ├── decorators/     - Custom decorators
│       │       ├── guards/         - Auth guards and middleware
│       │       └── interceptors/   - HTTP interceptors
│       └── tests/                  - Backend tests
│           ├── controllers/        - Controller unit tests
│           ├── integration/        - Integration tests
│           └── services/           - Service unit tests
└── .vscode/                        - Shared VS Code workspace settings
```