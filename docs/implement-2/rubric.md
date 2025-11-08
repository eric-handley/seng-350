# Implementation II Rubric

## Functionality

| Criterion                      | Completed (5 points)                                                                 | Not Completed (0 points)                                                             | Score |
| ----------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ----- |
| MCP Endpoint Exists           | Function is completed with appropriate tests and docs.                               | Function was not completed, and/or does not work when TA tests.                     | Score of MCP Endpoint Exists: __ / 5 |
| MCP Works With Claude or other tool | The MCP endpoint not only exists but returns useful services for a third-party AI agent. | The third-party agent cannot connect or the endpoint is never called.               | Score of MCP Works With Claude or other tool: __ / 5 |
| API endpoints                 | API endpoints are present and documented as to why these endpoints exist.           | No endpoints; no explanations; or minimal number of endpoints (1 or 2).             | Score of API endpoints: __ / 5 |
| API tested                    | Tests pass using API testing.                                                       | API fails on more than 25% of the tests.                                            | Score of API tested: __ / 5 |

---

## Adherence to Design

| Criterion              | Extending (5 points)                                                                                                         | Proficient (4 points)                                                                                 | Developing (2 points)                                                                 | Emerging (1 point)                                                                                 | Score |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----- |
| Requirements Coverage  | Proficient, but beyond: a trace matrix or explicit links to the originals, and all requirements are updated.               | The implementation addresses the user stories and functional requirements from the PRD.               | Subject to the scope revision, some or most requirements were not addressed.         | (Reserved for very weak or unclear requirements coverage.)                                         | Score of Requirements Coverage: __ / 5 |
| Explained Deviations   | Extending grades are given to explanations that are concise and simple to follow. Any deviations from the original design are clearly explained and justified in `Changes.md`, demonstrating thoughtful adaptation rather than last-minute changes. | Deviations from the design are mostly explained and traceable.                                        | Deviations are mentioned but not clearly justified or organized.                     | There is no connection between the requirements in the backlog and whatever code is in the repo.   | Score of Explained Deviations: __ / 5 |

---

## Code Quality and Design

| Criterion                 | Extending (5 points)                                                                                                                                   | Proficient (4 points)                                                                                 | Developing (3 points)                                                                      | Emerging (1 point)                                                                                   | Score |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ----- |
| Code Readability and Style| A truly professional piece of software engineering. Comments are extensive; there are no commented out lines; there is clear command of the code, beyond what an AI creates. | Adherence to language-specific conventions, clear naming, and consistent formatting.                 | Some inconsistent style, unclear naming, or minor technical debt.                         | Code is haphazard and slapdash, full of obvious TD and unnecessary functions and boilerplate.       | Score of Code Readability and Style: __ / 5 |
| Architecture & Design     | Design is clean and evidence of refactoring has been done.                                                                                            | The project has a clear sense of modularity and style. Concerns are properly separated. There are no obvious code smells such as very long functions. | Some modularity but with noticeable code smells or mixed responsibilities.                | There is no clear sense of design; lots of code smells; multiple responsibilities in one module.     | Score of Architecture & Design: __ / 5 |
| Clarity and Docs          | Documentation clearly explains how to test, run, install, etc. the system. There are no hidden requirements or strange requests to set environment variables. | Documentation is present and mostly clear, with minor omissions.                                      | Documentation is incomplete, unclear, or out of date.                                     | Documentation is missing or unusable.                                                               | Score of Clarity and Docs: __ / 5 |

---

## Testing

| Criterion         | Extending (5 points)                                                                                          | Proficient (3 points)                                                                                       | Developing (2 points)                                           | Emerging (1 point)                          | Score |
| ----------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------- | ----- |
| Unit Tests        | Unit tests are extensive and well documented; test code is separated and maintainable. With respect to Implementation I, all tests are more comprehensive and documented. | Core business logic is tested in isolation.                                                                 | Some unit tests exist, but coverage is limited or poorly organized. | No testing (for this and following categories). | Score of Unit Tests: __ / 5 |
| Integration Tests | Tests are extensive and look at all corner cases. Evidence of deep thought for a test plan.                  | Interactions between components are tested.                                                                 | Limited integration testing, missing key flows.                  | No integration tests.                        | Score of Integration Tests: __ / 5 |
| Acceptance Tests  | Key user stories and functional requirements are validated.                                                  | Main user stories are tested manually or with limited automation.                                          | Some acceptance tests but not clearly tied to user stories.      | No acceptance tests.                         | Score of Acceptance Tests: __ / 5 |
| Test Coverage     | Justification for test coverage is provided and reasonable. Test coverage metrics are provided.              | Some coverage metrics and justification are provided.                                                       | Coverage is discussed but not measured or justified clearly.      | No mention of coverage or justification.     | Score of Test Coverage: __ / 5 |

---

## Project Management

| Criterion                    | Extending (3 points)                                   | Proficient (2 points)                                                | Developing (1 point)                                              | Emerging (0 points)                                       | Score |
| --------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------- | ----- |
| Version Control             | Consistent and meaningful commit history.             | Mostly meaningful commits with occasional large or unclear commits. | Commits are infrequent or poorly described.                       | Most commits made via web interface; lack of basic Git knowledge. | Score of Version Control: __ / 3 |
| Issue Tracking and Code Review | Issues are tracked; code reviews happened.             | Some issues and reviews, but not consistent.                         | Minimal issue tracking or review evidence.                        | No code reviews; issues not linked to commits.            | Score of Issue Tracking and Code Review: __ / 3 |
| Prompting Document          | AI prompts are properly documented and recorded.       | Most prompts documented; minor gaps.                                | Minimal or incomplete prompt documentation.                       | No prompt document.                                      | Score of Prompting Document: __ / 3 |

---

## Total

**Score of Implementation II: __ / 74**
