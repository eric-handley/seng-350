# SENG-350 Group 1

[TOC]

## Links

### Cycle 2

#### Implementation 2 ([Branch](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/tree/cycle-2/implement))

- Marking
    - [Rubric](docs/2-implement/rubric.md)
    - [Testing Coverage Report](#coverage-report)
    - [Changes.md](docs/2-implement/Changes.md)
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

#### Design 2 ([Branch](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/tree/cycle-2/design))

- Architecture Views
    - [Component & Connector View](docs/2-design/component-connector-view.md)
    - [Module View](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/blob/cycle-2/design/docs/2-design/module-view.svg?ref_type=heads) ([source](docs/2-design/module-view.mmd))
- [Technical Debt Issues](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/issues?sort=created_date&state=all&label_name%5B%5D=tag%3A%3Atechnical%20debt&first_page_size=100)
- Architecture Design Requirements (Updated)
    - [Performance Priorities](docs/adr/adr-2-performance-priorities.md)
    - [Development Workflow](docs/adr/adr-3-development-workflow.md)

### Cycle 1

#### Implementation 1 ([Branch](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/tree/cycle-1/implement))

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

#### Design 1 ([Branch](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/tree/cycle-1/design))

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

Run linter (checks formatting/style):
```bash
npm run lint
```

## Testing

Run tests (requires project to be running):
```bash
npm test
npm run test:coverage # With coverage
```

### Coverage Report

```
--------------------------------|---------|----------|---------|---------|-------------------------------------------------------------
File                            | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                                           
--------------------------------|---------|----------|---------|---------|-------------------------------------------------------------
All files                       |   88.63 |    69.49 |   81.58 |   88.81 |                                                             
 client/src/api                 |   81.66 |    82.75 |   57.14 |   88.23 |                                                             
  bookings.ts                   |   70.96 |    71.42 |      50 |   77.77 | 19-30                                                       
  schedule.ts                   |    93.1 |    93.33 |   66.66 |     100 | 53                                                          
 client/src/components          |   82.92 |    67.24 |   60.86 |   82.05 |                                                             
  FilterPanel.tsx               |   73.58 |    66.66 |   52.63 |   73.07 | 67-71,76,97-99,173-188,208-214                              
  RecurringBookingGroup.tsx     |     100 |    67.56 |     100 |     100 | 27-51,76,79-80                                              
 client/src/hooks               |   77.41 |    47.61 |   67.56 |   82.67 |                                                             
  useBookingHistory.ts          |   68.08 |    45.45 |      52 |   74.68 | 81-85,101-103,108-129                                       
  useRooms.ts                   |   96.55 |       60 |     100 |     100 | 20-26                                                       
  useSchedule.ts                |    87.5 |       40 |     100 |      92 | 41-42                                                       
 client/src/pages               |   81.11 |    67.88 |   73.33 |   82.03 |                                                             
  BookingPage.tsx               |   82.05 |     87.5 |   77.77 |   83.33 | 118-131                                                     
  HistoryPage.tsx               |   59.09 |    39.68 |   55.55 |   60.65 | 78,115,165,174-178,191-211,219-229,303                      
  LoginPage.tsx                 |     100 |     92.3 |     100 |     100 | 25                                                          
  SchedulePage.tsx              |     100 |    95.23 |   71.42 |     100 | 40                                                          
  UsersPage.tsx                 |     100 |      100 |     100 |     100 |                                                             
 client/src/types               |   85.71 |      100 |      50 |   83.33 |                                                             
  index.ts                      |   85.71 |      100 |      50 |   83.33 | 114                                                         
 client/src/utils               |   97.43 |    86.36 |     100 |     100 |                                                             
  bookings.ts                   |     100 |    81.81 |     100 |     100 | 13-29,44                                                    
  time.ts                       |   96.47 |    87.87 |     100 |     100 | 5-10,47,80-84                                               
 server/src/api                 |   98.81 |       75 |   94.87 |   98.69 |                                                             
  audit-logs.controller.ts      |     100 |       50 |     100 |     100 | 88-89                                                       
  bookings.controller.ts        |   95.83 |      100 |   85.71 |   95.45 | 64                                                          
  buildings.controller.ts       |     100 |      100 |     100 |     100 |                                                             
  equipment.controller.ts       |     100 |      100 |     100 |     100 |                                                             
  room-equipment.controller.ts  |     100 |      100 |     100 |     100 |                                                             
  rooms.controller.ts           |     100 |      100 |     100 |     100 |                                                             
  schedule.controller.ts        |    92.3 |      100 |      50 |    90.9 | 47                                                          
  users.controller.ts           |     100 |      100 |     100 |     100 |                                                             
 server/src/app                 |   78.46 |        0 |   33.33 |   76.27 |                                                             
  app.controller.ts             |   88.88 |      100 |      50 |   85.71 | 26                                                          
  app.module.ts                 |     100 |      100 |     100 |     100 |                                                             
  app.service.ts                |    40.9 |        0 |      25 |      35 | 15-59                                                       
 server/src/auth                |   94.73 |    66.66 |   93.33 |   94.02 |                                                             
  auth.controller.ts            |   90.24 |    58.33 |    90.9 |   89.47 | 96,102,107,133                                              
  auth.module.ts                |     100 |      100 |     100 |     100 |                                                             
  auth.service.ts               |     100 |      100 |     100 |     100 |                                                             
  session.serializer.ts         |     100 |       50 |     100 |     100 | 18                                                          
 server/src/auth/strategies     |   69.23 |        0 |      50 |   63.63 |                                                             
  local.strategy.ts             |   69.23 |        0 |      50 |   63.63 | 17-21                                                       
 server/src/config              |     100 |       50 |     100 |     100 |                                                             
  database.config.ts            |     100 |       50 |     100 |     100 | 13-17                                                       
 server/src/database/entities   |     100 |      100 |     100 |     100 |                                                             
  audit-log.entity.ts           |     100 |      100 |     100 |     100 |                                                             
  booking-series.entity.ts      |     100 |      100 |     100 |     100 |                                                             
  booking.entity.ts             |     100 |      100 |     100 |     100 |                                                             
  building.entity.ts            |     100 |      100 |     100 |     100 |                                                             
  equipment.entity.ts           |     100 |      100 |     100 |     100 |                                                             
  room-equipment.entity.ts      |     100 |      100 |     100 |     100 |                                                             
  room.entity.ts                |     100 |      100 |     100 |     100 |                                                             
  user.entity.ts                |     100 |      100 |     100 |     100 |                                                             
 server/src/dto                 |   89.43 |    35.71 |   58.33 |   89.43 |                                                             
  audit-log.dto.ts              |     100 |      100 |     100 |     100 |                                                             
  booking-series.dto.ts         |   81.25 |      100 |       0 |   81.25 | 13,18,23,44,50,56                                           
  booking.dto.ts                |   80.43 |       20 |      70 |   80.43 | 8,24-33,58,76                                               
  building.dto.ts               |     100 |      100 |     100 |     100 |                                                             
  equipment.dto.ts              |     100 |      100 |     100 |     100 |                                                             
  room-equipment.dto.ts         |     100 |      100 |     100 |     100 |                                                             
  room.dto.ts                   |   93.61 |       50 |   88.88 |   93.61 | 16,21,98                                                    
  schedule.dto.ts               |   86.66 |        0 |       0 |   86.66 | 11,73,89,97                                                 
  user.dto.ts                   |   90.47 |       50 |   85.71 |   90.47 | 16,21,29,67                                                 
 server/src/filters             |   81.48 |    47.05 |     100 |      80 |                                                             
  global-exception.filter.ts    |   81.48 |    47.05 |     100 |      80 | 24,51-56                                                    
 server/src/services            |   88.35 |    74.19 |   94.93 |   87.82 |                                                             
  audit-logs.service.ts         |   84.21 |       70 |      90 |   82.35 | 29,33,37,41,45,49,53,129,152                                
  bookings.service.ts           |   86.82 |    76.19 |     100 |   86.63 | ...,253,263,277-279,327,356,362,372,376-377,388,418,424,436 
  buildings.service.ts          |   90.56 |    66.66 |      75 |      90 | 117-128,145                                                 
  equipment.service.ts          |   97.67 |     87.5 |     100 |    97.5 | 111                                                         
  room-equipment.service.ts     |   97.56 |    92.85 |     100 |   97.43 | 131                                                         
  rooms.service.ts              |   92.64 |    76.81 |     100 |    92.3 | 54,60,116,197,239,280,293,312,324,337                       
  users.service.ts              |   74.24 |    59.09 |     100 |   73.01 | 54,68,74-78,93-105,109-111,123,132                          
 server/src/shared/cache        |   69.56 |       25 |   77.77 |   66.66 |                                                             
  cache.module.ts               |   81.81 |       25 |     100 |   77.77 | 18-19                                                       
  cache.service.ts              |   65.71 |      100 |      75 |   63.63 | 18,41,45,60,70,75-89                                        
 server/src/shared/decorators   |     100 |      100 |     100 |     100 |                                                             
  cache.decorator.ts            |     100 |      100 |     100 |     100 |                                                             
  current-user.decorator.ts     |     100 |      100 |     100 |     100 |                                                             
  roles.decorator.ts            |     100 |      100 |     100 |     100 |                                                             
 server/src/shared/guards       |   96.15 |    83.33 |     100 |   95.23 |                                                             
  auth.guard.ts                 |     100 |      100 |     100 |     100 |                                                             
  roles.guard.ts                |   93.33 |       75 |     100 |   91.66 | 23                                                          
 server/src/shared/interceptors |   89.89 |       60 |   84.21 |   89.01 |                                                             
  audit-logging.interceptor.ts  |   95.91 |    61.53 |   84.61 |   95.34 | 52,113                                                      
  http-cache.interceptor.ts     |      84 |    58.33 |   83.33 |   83.33 | 37,47-52,71,112-113,119                                     
 server/src/shared/pipes        |     100 |      100 |     100 |     100 |                                                             
  parse-date.pipe.ts            |     100 |      100 |     100 |     100 |                                                             
--------------------------------|---------|----------|---------|---------|-------------------------------------------------------------

Test Suites: 60 passed, 60 total
Tests:       384 passed, 384 total
Snapshots:   0 total
Time:        82.033 s
```

## Team Members

| Name             | V#        |
|------------------|-----------|
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