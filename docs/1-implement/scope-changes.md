## Scope Management Document

# Project Summary
Our group has completed the main functionality as laid out in the rubric with two additional bonus features that were in the original criteria and later removed. In particular, we have a functional web application buildable and runnable in a docker container with Staff, Registrar, and Admin use cases implemented and connected to our database. We also included unit/integration/acceptance testing, a test coverage document, and used version control and issue features to track progress effectively. A full summary of features against the marking rubric can be found in rubric.md in this directory.


# Initial Scope
Our initial scope from the design phase resembles our implementation minus a few discrepencies discussed in the following section. There were a few design requirements that we realized were not required for the project, and we also noted that our initial testing plan was too intensive for the scope of implementation-1.

# Scope Changes / Revised Scope
While our project meets the criteria from the rubric, there are some discrepencies from our design to the implementation. In particular:
- There is no functionality for directly editing booking times on an existing booking. The user must cancel their booking and rebook with their desired time.

- Our test coverage plan was more ambitious than we could reasonably implement. Specifically, 80% branch coverage was both difficult to measure and difficult to achieve for a repository of this size. In addition, tests that required timing were low yield and challenging to create measurable repeatable tests for. Instead of our original plan, we created tests for the most commonly used features and ensure that we completed unit tests, integration tests, and acceptance tests in order to meet the rubric's requirements. Additionally, manual tests were performed on the system as a whole to check for things that may be less obvious/not possible to check using automated tests (UI appearance, End to End tests, etc.). We hope that our revised testing implementation satisfies the testing section of the rubric even though it is less comprehensive than our original plan.

- Recurring bookings were not added as they were not required by the rubric. In cycle 2, we will revisit this requirement and decide if it should be implemented.

The scope changes that were not resolved (differnet solution found and implemented) are still tracked by issues that are updated to reflect that they will be revisited in cycle 2.
