## Reason for selection of group 8's project

Group 8's project had several areas of improvement that we were interested in working on during the refactoring exercise. In particular, their repository was the largest among all the groups in SENG 350, there was dead code, usability issues, and configuration flaws.

In our initial investigation of the repository, we noticed that node modules were a part of the commit history drastically increasing the total size in bytes. Looking into the code, the organization was logical, but some issues like duplicate files for admin/registrar/staff home pages were observed. When trying out the features of the app, it was noted that admin and registrar were not able to create bookings, equipment filters did not filter the rooms correctly, and the booking confirmation message was white text with a white background.

The documentation for the project was mostly well defined with clear ADRs in docs/decisions/ADRs.md, the initial PRD.md file in docs/Design1, diagrams in docs/images, and a comprehensive README file explaining how to build and run the project. One issue that we noticed here, however, was that there was no documentation for API usage and so calls for getting data from the database have to be inferred from the code.

With overall good structure and documentation along with areas with room for improvement, we found Group 8's repository to be the most appealing to take on for our refactoring task.


THIS IS THE PROVIDED GUIDE FOR WRITING THIS:
NB: you should be very careful in running untrusted code on your machine. I have not conducted any malware or other scans on these zip files. Sandboxing them in a Docker container/VM would be wise. See appendix below.
Due diligence means your team has carefully evaluated the code of the other teams. More than code, you will want to inspect the documentation and other artifacts. Document your process and answer the following in a short, 500 word report titled "DueDiligence.md".
Does the code have good comments?
Are there adequate documents to explain the architecture?
Are there obvious quality gaps in the code, as explained by code quality tools such as SonarQube or Codescene?
Do the developers seem capable and understand the approach they took?
