**Implementation-I**

Branch: `issue-5/dev-setup`
- `claude-code` prompts
    - create docker-compose for a typescript react client (esbuild) and a typescript server with postgres, set server env to connect to db
    - scaffold the client in ./client: react + typescript using esbuild, add package.json dev/build scripts, tsconfig etc.
    - scaffold the server in ./server: typescript http server using pg, add package.json etc.
    - add placeholder package-lock.json files in ./client and ./server so npm install works
    - add an npm run tmux script that starts client/server/db and opens a tmux session with panes for each of their logs
    - scan the entire src/ dir and the files in base dir to understand this project. ignore /docs/
    - set up the remaining missing tech stack elements (nestjs, redis, auth.js), one at a time
    - add nestjs cli to container properly (not globally) and fix server startup issues
    - set up hot reload correctly for both client and server
    - fix typescript compilation issues
    - set up redis properly with cache manager
    - add note to caching example about not using redis until api is properly set up
    - set up auth.js
    - set up testing/linting according to @docs/adr/adr-3-development-workflow.md
    - set up eslint with reasonable rules for both client and server
    - set up jest for testing on both server and client with minimal framework (don't write tests yet)
    - fix depreciated eslint version and other dependency warnings
    - fix linter errors
    - convert this project into a single node install for client and server so that only one jest config, eslint, etc would be necessary (but could hopefully still have some separate options)
    - make root level npm lint script run both client and server lint checks
    - there should be no need for a node_modules volume
    - change the docker-compose file so the output from dependency install is shown
    - fix docker dependency installation - why are deps being installed every time i run npm run tmux (should check and update, not get ALL deps from scratch)
    - put tests inside the already created test folders in both client and server
    - stop jest from generating coverage folder on runs

Branch: `feature-35/better-web-scraper`
- `claude-code` prompts
    - work with me on @src/scripts/scraper.py to extract room data from https://www.uvic.ca/search/rooms/ (room links on this page) to @data/uvic_rooms.json . we need some way of cleaning of the room equipment as many will have slight variations but functionally mean the same thing. also quantities need to be extracted
    - add paralellism so it runs faster
    - your normalization rules are overly simplistic and lose important data for some rooms. take a sample of a couple different ones and see what i mean
    - look at the json output to determine if any rooms are missing attributes, then if so, analyze these specific rooms to fix
    - that normalize_equipment_name function is crazy, there MUST be a less messy way of writing that

Branch `issue-31/db-setup`
- `claude-code` prompts:
    - organize/name files in the @src/server/src/ folder better for a small team project, put empty template files inside any folders that don't exist yet
    - update @readme.md with the new backend folder structure
    - implement the schema defined in @docs/db/schema.md in the postgres instance - see @docker-compose.yml
    - create a seed script in @src/server/src/database/seeds that populates the postgres instance defined in @docker-compose.yml with the data from @src/server/data/uvic_rooms.json . you must respect and follow @docs/db/schema.md and the db setup defined by @src/server/src/database/migrations/1732573200000-InitialSchema.ts
    - set up basic CRUD endpoints for the server as defined by the project structure in @readme.md . use the schema reference in @docs/db/schema.md . only add endpoints that make sense, eg. buildings and equipment do not need to be updated or created via api. read the docs to get a better understanding of the app and which endpoints are needed
    - run `npm run lint` and fix linter errors

Branch `feature-7/registrar`
- ChatGPT prompts:
    - how can i break up a .tsx file into multiple files for better code quality?
    - how can I edit this function to properly add the submitted information to the table? const handleSaveNewUser = (updated: User) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updated.id ? updated : u))
    );
    setAddingUser(null);
  };
  - fix the initial_users code: export const INITIAL_USERS = [
  { id: '1',  email: 'alicejohnson@uvic.ca', pasname: 'Alice Johnson', role: 'admin' as const,},
  { id: '2', name: 'Bob Smith', role: 'staff' as const, email: 'bobsmith@uvic.ca'},
  { id: '3', name: 'Charlie Doe', role: 'registrar' as const, email: 'charliedoe@uvic.ca'},
]
- how can i create a confimation page for blocking a user?

**Design-I**

1. "how can i link a gitlab milestone in a mrkdown file in the same project?" 
    - [Conversation Link](https://chatgpt.com/share/68cd9407-72f0-800a-a606-495ba3c74f99)

2. "what is a good way to do integration testing for the following tech stack? We will use Typescript with React for frontend, NestJS for the entry layer, NestJS for the backend, PostgreSQL for server-side data store, Redis for cache and minimal messaging, Auth.js for authentication and authorization." 
    - [Conversation Link](https://chatgpt.com/c/68cdc58f-94a8-8330-93b6-320b7cdaebac)
    
3. "give an example of a comprehensive test plan for a rooms booking webapp"
    - [Conversation Link](https://chatgpt.com/c/68cdcbfc-251c-8331-8be5-f4a2b9f3a482)

3. "How to link an issue to my markdown file on Gitlab"
    - [Conversation Link](https://chatgpt.com/share/68cdc678-112c-8009-9e49-3f5656ba05e1)

4. "What is a reasonable line coverage for testing a web application? Please highlight different scenarios where this would change, and provide resources for your answers."
    - [Conversation Link](https://chatgpt.com/share/68cf0022-738c-8009-b330-63ceaf29bb04)
5. "Hi chat, can you help me build a typescript login-page using react, the page should follow the style designs of the added images, keep the page simple to begin with."
 - [Conversation Link](https://chatgpt.com/c/68d83f87-bd80-8326-9e95-5cd02279058e)
 6. "how would i connect a .css page to a .tsx page?"
  - [Conversation Link](https://chatgpt.com/c/68dac82b-a650-8333-9ea7-a0c8c5f6e88c)