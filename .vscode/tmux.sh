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

tmux new-session -d -s "$SESSION" -n main \
  "bash -lc 'until docker compose ps -q client | grep -q .; do sleep 1; done; docker compose logs -f client'"

tmux split-window -v -t "$SESSION":0 \
  "bash -lc 'until docker compose ps -q db | grep -q .; do sleep 1; done; docker compose logs -f db'"

tmux split-window -h -t "$SESSION":0.0 \
  "bash -lc 'until docker compose ps -q server | grep -q .; do sleep 1; done; docker compose logs -f server'"

tmux split-window -h -t "$SESSION":0.2 \
  "bash -lc 'until docker compose ps -q deps | grep -q .; do sleep 1; done; docker compose logs -f deps'"

tmux split-window -v -t "$SESSION":0.3 \
  "bash -lc 'docker compose up --wait'"

tmux attach-session -t "$SESSION"
