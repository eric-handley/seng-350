#!/usr/bin/env bash
set -Eeuo pipefail

# tmux layout:
# - Split once vertical (top/bottom)
# - Split each row horizontal (top-left/top-right, bottom-left/bottom-right)
# - Split bottom-right vertical (top/bottom)
#
# Panes:
#  top-left:    client logs
#  top-right:   server logs
#  bottom-left: db logs
#  bottom-right (top):    docker compose up --wait (closes when ready)
#  bottom-right (bottom): deps install logs

SESSION="${TMUX_SESSION:-dev}"

if tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux kill-session -t "$SESSION"
fi

# Top-left: client logs (wait for container)
tmux new-session -d -s "$SESSION" -n main \
  "bash -lc 'until docker compose ps -q client | grep -q .; do sleep 1; done; docker compose logs -f client'"

# Bottom-left: db logs (wait for container)
tmux split-window -v -t "$SESSION":0 \
  "bash -lc 'until docker compose ps -q db | grep -q .; do sleep 1; done; docker compose logs -f db'"

# Top-right: server logs (wait for container)
tmux split-window -h -t "$SESSION":0.0 \
  "bash -lc 'until docker compose ps -q server | grep -q .; do sleep 1; done; docker compose logs -f server'"

# Bottom-right (top): compose up --wait (shows startup incl. deps; exits when ready)
tmux split-window -h -t "$SESSION":0.2 \
  "bash -lc 'until docker compose ps -q deps | grep -q .; do sleep 1; done; docker compose logs -f deps'"

# Bottom-right (bottom): deps logs
tmux split-window -v -t "$SESSION":0.3 \
  "bash -lc 'docker compose up --wait'"

# tmux select-layout -t "$SESSION":0 tiled
tmux attach-session -t "$SESSION"
