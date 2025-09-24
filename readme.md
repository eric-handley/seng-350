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

Prereqs:
- Docker installed
- Docker daemon running (or Docker Desktop)
- `npm` installed (optional but recommended)


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
    - Start PostgreSQL database on `localhost:5432`
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
├── docs/                  - Project documentation
│   ├── adr/               - Architecture Decision Records
│   └── team/              - Team policies and expectations
├── src/
│   ├── client/
│   │   ├── public/        - Static assets and HTML entry point
│   │   │   └── assets/    - Compiled JS bundles and source maps
│   │   ├── src/           - React source code
│   │   └── tests/         - Frontend unit tests
│   └── server/
│       ├── src/           - Nest.js backend code
│       │   ├── auth/      - Auth.js authentication modules
│       │   └── cache/     - Redis caching modules
│       └── tests/         - Backend unit tests
└── .vscode/               - Shared VS Code workspace settings
```