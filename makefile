.DEFAULT_GOAL := run

COMPOSE ?= docker compose
PROJECT ?= seng-350
V_CLIENT := $(PROJECT)_client-node-modules
V_SERVER := $(PROJECT)_server-node-modules
PULL ?= 0

build: 
	@$(COMPOSE) build

run: build 
	@$(COMPOSE) up -d

down:
	@$(COMPOSE) down

# Rebuild client/server from scratch
rebuild:
	@$(COMPOSE) down -v --remove-orphans
	@docker volume rm $(V_CLIENT) $(V_SERVER) || true
	@$(COMPOSE) build --no-cache
	@$(COMPOSE) up -d --force-recreate

# If you have tmux installed, you can run & show client and server logs in separate panes
tmux: run
	@tmux new-session -d -s dev "$(COMPOSE) logs -f client"
	@tmux split-window -v -t dev:0 "$(COMPOSE) logs -f server"
	@tmux split-window -h -t dev:0 "$(COMPOSE) logs -f db"
	@tmux attach-session -t dev
