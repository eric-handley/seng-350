

# Implementation Prompts

- create docker-compose for a typescript react frontend (esbuild) and a typescript backend with postgres 16, set backend env to connect to db
- scaffold the frontend in ./frontend: react + typescript using esbuild, add package.json dev/build scripts, tsconfig etc.
- scaffold the backend in ./backend: typescript http server on port 3000 using pg, add package.json etc.
- add placeholder package-lock.json files in ./frontend and ./backend so npm ci works
- add a Makefile with basic helper commands for docker
- add a run-tmux make target that starts only frontend and backend and opens a tmux session named dev with two panes tailing their logs