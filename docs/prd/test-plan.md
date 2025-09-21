## 1. Introduction
Our test plan is based of skills learned in SENG 321 (Requirements Engineering) and SENG 275 (Software Testing). We are planning to create suites of different test types including (and not limited to) unit testing during development, E2E testing through scripting once the development is near finished, integration testing and system testing. We are also setting up a test pipleine for the main project branch.

## 2. Coverage Targets
 We are looking for 80% branch coverage as our coverage to be confident in our code quality. Understanding that branch coverage does not neccessarily indicate quality testing, this number may change as we begin development of the product.

## 3. Test Tools
 Jest, pipeline through gitlab.

## 4. Test Types
 Unit testing through Jest for fast bug detection, E2E tests for user journey correctness, integration testing for real system wiring validation, and system testing. We will also use a test-driven-development approach (when possible) through writing many unit tests as we work on new features.

## 5. Key risks the tests will examine
 Our tests will be examining the key risks of integration failure via integration testing. We will be eliminating bugs within our code through unit testing. We will be testing for requirement failure through end-to-end testing.

## 6. Scenarios to test for
- Load interface in < 10 seconds
- Search classrooms in < 5 seconds
- Single-winner concurrent booking
- Recover after DB restart < 30s
- Blocks unauthorized access
- Authorize based on role
- Booking in =< 3 clicks
- All services healthy after deployment < 5 min
- Alert on booking conflict in < 5 seconds

## 7. Scope
**In-Scope**
- Unit testing: Testing of all features before they are added to main.\
- System testing: Testing of nonfunctional system requirements. 
- E2E testing: Manual testing of functional requirements.
**Out of Scope**
- Mutation testing: mutation testing is quite labour intensive and meant for large projects that will be in use for a long time, as that does not match this project we have decided against mutation testing.

## 8. User Story Testing
1.  (Issue #11)\
    As a member of staff at the University of Victoria,\
    I want to view the available classrooms at a given time,\
    So that I can choose a classroom that doesn't interfere with other classes. 
**Tests**
1. Click the "browse rooms" button.
2. Specify the start and end of the time you would like to book.
3. click the "Apply" button.
4. select an available room and click the "Book" button.
5. select an unavailable room and click the "Book" button for it to result in an error. 
    
2.  (Issue #12)\
    As a member of staff at the University of Victoria,\
    I want to book a classroom at a given time and have it show up for all other staff members,\
    So that no one else takes the classroom/time that I want for my class.
**Tests**
1. Click the "browse rooms" button.
2. Specify the start and end of the time you would like to book.
3. click the "Apply" button.
4. select an available room and click the "Book" button.
5. log into a different staff acount.
6. View that the timeslot booked by the last staff account says unavailable.

3.  (Issue #13)\
    As a member of staff at the University of Victoria,\
    I want to review and cancel my booking,\
    So that I can reschedule it for another time that works better.
**Tests**
1. Click the "browse rooms" button.
2. Specify the start and end of the time you would like to book.
3. click the "Apply" button.
4. select an available room and click the "Book" button.
5. go into the "My Bookings" section and see the current booking.
6. Click the "Cancel Booking" button on the listed booking.
7. repeat steps 1-4 with the new time.

4.  (Issue #14)\
    As a member of staff at the University of Victoria,\
    I want to be able to book a recurring weekly schedule for my class for a given term,\
    So that I avoid the manual task of booking each week separately.
**Tests**
1. Click the "browse rooms" button.
2. Specify the start and end of the time you would like to book.
3. click the "Apply" button.
4. select the repeat booking check-mark and choose an end date on the schedule.
5. select an available room and click the "Book" button.

5.  (Issue #15)\
    As a Registrar employee at the University of Victoria,\
    I want the system to only allow one success (and give the other a failure message) when two people try to book a room's time slot at the same time\
    So that I don't have to manually resolve double bookings
**Tests**
1. sign into two staff accounts.
2. click the "browse rooms" button on both accounts.
2. Specify the start and end of the time you would like to book on both accounts.
3. click the "Apply" button on both accounts.
4. select an available room and click the "Book" button on both accounts at the same time.
5. account 1 should book the room and account 2 should recieve an error message and not book the room.

6.  (Issue #16)\
    As a Registrar employee of the University of Victoria,\
    I want to be able to have control over the bookings as a whole and overwrite any bookings if needed,\
    So that I can resolve scheduling issues if they arise.
**Tests**
1.  sign into a registrar account.
2. go to the schedule.
3. click cancel on a booking.
4. observe the room booking being canceled.

7.  (Issue #17)\
    As an administrator at the University of Victoria,\
    I want to view configuration constraints, audit records and health of the system,\
    So that I can ensure everything is functioning as expected, and notify the IT team if there are any issues.
**Tests**
1.  sign into an admin account.
2. click on System settings.
3. review configurations and system settings.
4. click on system health.
5. click view audit records.
6. exit out of audit records.
7. click view system health records.

8.  (Issue #26)\
    As a member of staff of the University of Victoria with the role of Staff, Admin, or Registrar,\
    I want to be able to sign into my account through a simple sign-in page,\
    so that I can complete actions within the website.
**Tests**
1. sign into a staff account.
2. sign out.
3. sign into a admin account.
4. sign out.
5. sign into a registrar account.
6. sign out.
7. attempt to sign into an account with the wrong password it should fail.
8. attempt to sign into an account with both the password and email empty it should fail.
9. attempt to sign into an account with a fake email and a correct password it should fail.








