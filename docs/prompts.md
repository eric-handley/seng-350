

# Implementation Prompts

- create docker-compose for a typescript react frontend (esbuild) and a typescript
backend with postgres 16; dev-only; expose 5173 and 3000; mount ./frontend and ./
backend; use node:22-bookworm-slim; add db healthcheck and a db-data volume; set
backend env to connect to db
- scaffold the frontend in ./frontend: react + typescript without vite using esbuild;
add package.json (dev/build scripts), tsconfig (react-jsx), public/index.html, src/
main.tsx, esbuild.dev.mjs, esbuild.build.mjs
- scaffold the backend in ./backend: typescript http server on port 3000 using pg;
add package.json (dev with ts-node, build, start), tsconfig, and src/index.ts that
queries select now()
- keep compose commands as “npm ci && npm run dev” for both frontend and backend
- add placeholder package-lock.json files in ./frontend and ./backend so npm ci works
- add a Makefile with build, build-nc, clean, up, run, down, start, stop, restart;
default SVC=backend
- add a run-tmux make target that starts only frontend and backend and opens a tmux
session named dev with two panes tailing their logs