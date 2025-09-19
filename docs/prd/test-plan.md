Our test plan is based of skills learned in Seng 321, software testing. We are planning to use unit testing during development, E2E testing through scripting once the development is near finished. Integration testing, property testing and system testing. We are also setting up a test pipleine for the main project branch.

coverage targets: We are looking for 80% branch coverage as our coverage to be confident in our code quality.

test tools: Jest, pipeline through gitlab

test types: unit testing through Jest for fast bug detection, E2E tests for user journey correctness, integration testing for real system wiring validation, property testing and system testing.

Key risks the tests will examine: Our tests will be examining the key risks of integration failiure via integration testing. We will be eliminating bugs within our code through unit testing.

Scenarios to test for: 
Load interface in < 10 seconds 
Search classrooms in < 5 seconds
Single-winner concurrent booking
Recover after DB restart < 30s
Blocks unauthorized access
Authorize based on role
Booking in =< 3 clicks
All services healthy after deployment < 5 min
Alert on booking conflict in < 5 seconds

