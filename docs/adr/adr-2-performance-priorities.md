# Title: ADR 2: Performance Priorities
## Context
The following performance priorites were chosen based on functional requirements, quality attributes, and developer opinions. They will guide the development process in terms of how decisions should be made. The list is in a ranked order with 1 being highest priority and 7 being the lowest. 
 
## Decision
1. Reliability - Important that this system is functioning whenever a staff member needs to book a room.
2. Maintainability - The system must be easily maintainable otherwise there is a lower benefit in decreased room booking effort. 
3. Security - The users' information should be kept private but impact of room registration information being leaked is low. 
4. Cost - This is a relatively small system and should not be overly expensive to develop, however, some cost will be incurred for increased performance of 1, 2, and 3.
5. Speed - The speed will not be a top priority because users wil not be using the application for extended periods of time and it will have minimal to no impact on the abilities of the application.
6. UX - User experince is not a top priority because the system is not trying to attract customers and will be relatively simple. However, the users should not have a negative experience and it should be designed to be intuitive to use.
7. Scalability - The scalability of the application is the lowest priority because it will not be gaining users at a great volume or speed due to only being accessible to UVic staff.
## Status
Accepted
## Consequences
**Reliability:**
- Decreased speed.
- Application is functioning whenever a staff member needs to book a room.
- Application is robust.
- Captured in issues #17 and #16

**Maintainability:**
- Decreased speed.
- Application is robust.
- Application is easy to fix in the case of a bug.
- Increased reliability.

**Security:** 
- Decreased speed.
- Users' information is safe.
- Application in resistant to attacks.
- Captured in issue #26

**Cost:**
- Low cost may negatively affect all other priorities (a balance has to be found).
- Unlikely to be expensive to develop due to nature of application.

**Speed** 
- Decreased security.
- Slower speed decreases UX.

**UX**
- Decreased security.
- Lower UX makes the application less enjoyable to use.

**Scalability**
- Decreased maintainability.
- Increased cost.
- Low scalability leads to low potential to increase user base.