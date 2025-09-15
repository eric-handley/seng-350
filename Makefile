.DEFAULT_GOAL := run

COMPOSE ?= docker compose

build: 
	$(COMPOSE) build

clean:
	$(COMPOSE) build --no-cache

run: build 
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

# If you have tmux installed, you can run frontend and backend in separate panes
tmux: run
	tmux new-session -d -s dev "$(COMPOSE) logs -f frontend"
	tmux split-window -v -t dev:0 "$(COMPOSE) logs -f backend"
	tmux attach-session -t dev
