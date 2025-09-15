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

# If you have tmux installed, you can run client and server in separate panes
tmux: run
	tmux new-session -d -s dev "$(COMPOSE) logs -f client"
	tmux split-window -v -t dev:0 "$(COMPOSE) logs -f server"
	tmux attach-session -t dev
