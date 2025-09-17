

# Implementation Prompts

- create docker-compose for a typescript react client (esbuild) and a typescript server with postgres 16, set server env to connect to db
- scaffold the client in ./client: react + typescript using esbuild, add package.json dev/build scripts, tsconfig etc.
- scaffold the server in ./server: typescript http server on port 3000 using pg, add package.json etc.
- add placeholder package-lock.json files in ./client and ./server so npm ci works
- add a Makefile with basic helper commands for docker
- add a run-tmux make target that starts only client and server and opens a tmux session named dev with two panes tailing their logs
