### These are modified (to match implementation II) versions of the acceptance tests from the original test plan along with additional cases

**([Issue #11](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/issues/11))**\
    As a member of staff at the University of Victoria,\
    I want to view the available classrooms at a given time,\
    So that I can choose a classroom that doesn't interfere with other classes.\
**Tests**
1. From the home page, ensure the **Book Rooms** tab is active (this is the default after signing in).
2. Use the date/time filters in the panel on the left to choose the desired slot (filters update results automatically; there is no “Apply” button).
3. Pick an available room card and click **Book room**.
4. Observe that a reserved room shows a disabled **Reserved** button instead of allowing the booking (no pop‑up error is shown).
    
**([Issue #12](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/issues/12))**\
    As a member of staff at the University of Victoria,\
    I want to book a classroom at a given time and have it show up for all other staff members,\
    So that no one else takes the classroom/time that I want for my class.\
**Tests**
1. In the **Book Rooms** tab, select the time slot via the filters.
2. Book an available room by clicking **Book room**.
3. Log into a different staff account.
4. Navigate to **Book Rooms** and select the same date/time.
5. Confirm the previously booked room now shows **Reserved** and cannot be booked again.

**([Issue #13](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/issues/13))**\
    As a member of staff at the University of Victoria,\
    I want to review and cancel my booking,\
    So that I can reschedule it for another time that works better.\
**Tests**
1. In **Book Rooms**, filter to the desired time and click **Book room** on an available room.
2. Switch to the **My Bookings & History** tab (registrars/admins see **All Bookings**).
3. Verify the new booking appears in the list.
4. Click **Cancel** on the booking and confirm it now shows the **Cancelled** badge.
5. Return to **Book Rooms**, pick a new time, and create a replacement booking.

**([Issue #14](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/issues/14))**\
    As a member of staff at the University of Victoria,\
    I want to be able to book a recurring weekly schedule for my class for a given term,\
    So that I avoid the manual task of booking each week separately.\
**Tests**
1. In **Book Rooms**, choose the date/time for the first occurrence.
2. Click **Book recurring** on the desired room card.
3. In the modal, pick the recurrence pattern (daily/weekly/monthly) and a **Repeat until** date.
4. Submit the form and confirm the modal closes with a success state (booking error banner if the server rejects it).

**([Issue #15](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/issues/15))**\
    As a Registrar employee at the University of Victoria,\
    I want the system to only allow one success (and give the other a failure message) when two people try to book a room's time slot at the same time\
    So that I don't have to manually resolve double bookings\
**Tests**
1. Sign into two staff accounts in separate browsers or sessions.
2. In each session, open the **Book Rooms** tab and filter to the same date/time.
3. On both sessions, attempt to book the same room.
4. One booking succeeds (button changes to **Reserved**); the other session shows a booking error banner and the room remains unavailable.

**([Issue #16](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/issues/16))**\
    As a Registrar employee of the University of Victoria,\
    I want to be able to have control over the bookings as a whole and overwrite any bookings if needed,\
    So that I can resolve scheduling issues if they arise.\
**Tests**
1. Sign into a registrar account.
2. Open the **All Bookings** tab (My Bookings displays for staff).
3. Locate an upcoming booking and click **Cancel**.
4. Confirm the booking now shows the **Cancelled** badge and disappears from bookable rooms.

**([Issue #17](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/issues/17))**\
    As an administrator at the University of Victoria,\
    I want to view configuration constraints, audit records and health of the system,\
    So that I can ensure everything is functioning as expected, and notify the IT team if there are any issues.\
**Tests**
1.  sign into an admin account.
2. Use the tab navigation to open **Manage Buildings & Rooms**, **Manage Equipment**, **Audit**, and **System Health** in turn.
3. Review configuration data, audit entries, and health status in their respective tabs.

**([Issue #26](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/issues/26))**\
    As a member of staff of the University of Victoria with the role of Staff, Admin, or Registrar,\
    I want to be able to sign into my account through a simple sign-in page,\
    so that I can complete actions within the website.\
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

**([Issue #53](https://gitlab.csc.uvic.ca/courses/2025091/SENG350_COSI/teams/group_1_proj/-/issues/53))**\
MCP Agent room booking. See src/mcp-server/BOOKING_GUIDE.md for testing steps.







