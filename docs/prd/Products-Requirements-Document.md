Product Requirements Document
=====

[TOC]

## Overview
This product is a room scheduling system and is being built for the University of Victoria to replace the tedious task of manually booking on-campus rooms. It will function as a web app that enables staff to view, book, and cancel their bookings of rooms. Admin users will be able to view audit records and health. Along with general staff and admin, the registrar will be able to manage and maintain the scheduling and user accounts. This application will streamline the booking process.

## Objectives & Goals

The university currently schedules classrooms manually, which slows reservations and creates uncertainty when multiple people request the same space. This system requires staff to wait for approval even for routine bookings, leading to delays and inefficient use of limited classroom space. An updated system could eliminate this bottleneck by giving staff direct access to real-time availability and immediate booking confirmation.

This project will shift classroom bookings to a web-based self-service product. The system will process booking requests instantly without the need for manual review. When conflicts occur for the same room and time, one booking succeeds and the other gets immediate notification of failure, preventing double bookings. Staff need the ability to cancel reservations when plans change so rooms become available for others to book. The system will display availability based on classroom and time-slot data that the Registrar maintains, ensuring that what users see reflects actual space availability. These features will make classroom booking faster and reduce administrative overhead.

## User Stories

## Functional Requirements
1. Staff can book rooms in 1 click - see gitlab issue 1
2. If 2 people book rooms at the same time one gets an error message - see gitlab issue 2
3. The System must support staff, registrar and admins - see gitlab issue 3
4. The system must support cancelation, rollback and undo - see gitlab issue 4
5. The System has to be fully integrated to Docker - see gitlab issue 5
6. The admin role must be fully supported - see gitlab issue 6
7. The registrar role must be fully supported - see gitlab issue 7
8. The system must include a sign-in page- see gitlab issue 8
9. The system must allow users to book rooms for up to 1 week in the future - see gitlab issue 9
10. The system must allow for the length of bookings to be changed - see gitlab issue 10

## Quality Attribute Requirements

## Milestones & Deliverables
The development group plans to manage time spent on the project by estimating the time to implement each issue. Then it will be assigned based on the skills needed and who has availability to work on each one. Once the work has been assigned accordingly, the group plans to attend lab sessions to update other group members on progress and/or blockers as well as meet outside of classtime when needed to futher coordinate work and discuss implementation (about once a week).\
**Milestone 1** - %"Design I": This PRD, our test plan, our ADRs and our GenAI prompts file.\
**Milestone 2** - %"Implementation I": Implementing user stories, functional requirements, and quality attributes.\
**Milestone 3** - %"Design II": Improve and retrospect design based on feedback and design two or more advanced capabilities.\
**Milestone 4** - %"Implementation II": Implement design improvements and two or more advanced capabilities.\
**Milestone 5** - %"Refactoring": Make changes to another group's code to adapt it.\
**Milestone 6** - %"Reflection and Presentation": Create slides and answer questions about the project and the use of AI.
