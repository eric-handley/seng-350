# Title: ADR 3: Development Workflow

## Context
Our team needs a development workflow that supports the course requirements for GitLab and Docker usage. The workflow must accommodate phase-based development cycles, maintain code quality through automated testing, and ensure proper traceability between code changes and project requirements. Constraints include maintainer-only access to main branch, required GitLab issue tracking for all work, and Docker containerization for deployment.

## Decision
We will follow a development workflow that uses individual branches for each project phase, issue/feature branches for individual work, an automated CI/CD pipeline for quality assurance and testing, and standardized tooling for consistency across local development environments. 

## Status

## Consequences