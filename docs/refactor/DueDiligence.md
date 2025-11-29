## Reason for selection of group 8's project

Group 8's project had several areas of improvement that we were interested in working on during the refactoring exercise. In particular, their repository was the largest among all the groups in SENG 350, there was dead code, usability issues, and configuration flaws.

In our initial investigation of the repository, we noticed that node modules were a part of the commit history drastically increasing the total size in bytes. Looking into the code, the organization was logical, but some issues like duplicate files for admin/registrar/staff home pages were observed. When trying out the features of the app, it was noted that admin and registrar were not able to create bookings, equipment filters did not filter the rooms correctly, and the booking confirmation message was white text with a white background.

The documentation for the project was mostly well defined with clear ADRs in docs/decisions/ADRs.md, the initial PRD.md file in docs/Design1, diagrams in docs/images, and a comprehensive README file explaining how to build and run the project. One issue that we noticed here, however, was that there was no documentation for API usage and so calls for getting data from the database have to be inferred from the code.

With overall good structure and documentation along with areas with room for improvement, we found Group 8's repository to be the most appealing to take on for our refactoring task.

One code smell targeted was primitive obsession due to a high reliance of primitives through-out their repository we changed their date-time primitives via the implementation of dateTime.js and dateUtils.js to allow for the change of the primitives to bookingsearch.jsx through running npm run test:smells one can see the date-usage.jsx tests added to show the removal of primitives and the preserved behaviour.

The other code smell we targeted was the long method smell in src/backend/routes/bookings.js called post that was almost 200 lines that handled multiple different functionalities such as CRUD, filtering logic and business logic. This makes the method hard to understand, hard to use and hard to test. After fixing the smell we created the test bookings.code-smell.test.js to test the changes that were made that solved the long method smell.

THIS IS THE PROVIDED GUIDE FOR WRITING THIS:
NB: you should be very careful in running untrusted code on your machine. I have not conducted any malware or other scans on these zip files. Sandboxing them in a Docker container/VM would be wise. See appendix below.
Due diligence means your team has carefully evaluated the code of the other teams. More than code, you will want to inspect the documentation and other artifacts. Document your process and answer the following in a short, 500 word report titled "DueDiligence.md".
Does the code have good comments?
Are there adequate documents to explain the architecture?
Are there obvious quality gaps in the code, as explained by code quality tools such as SonarQube or Codescene?
Do the developers seem capable and understand the approach they took?
