#!/usr/bin/env bash
# AutoVault — start API + web app
set -e
cd "$(dirname "$0")"

echo "▶ Starting MySQL (official 26.7.0 via LaunchAgent)…"
launchctl load ~/Library/LaunchAgents/com.autovault.mysql.plist 2>/dev/null || true
sleep 2

echo "▶ Starting API server on :5001 …"
tmux kill-session -t car-api 2>/dev/null || true
(cd server && tmux new-session -d -s car-api "node src/index.js > /tmp/car-api.log 2>&1")

echo "▶ Starting web app on :5173 …"
tmux kill-session -t car-web 2>/dev/null || true
(cd client && tmux new-session -d -s car-web "npm run dev > /tmp/car-web.log 2>&1")

sleep 3
echo ""
echo "✅ AutoVault is live:"
echo "   Web app : http://localhost:5173"
echo "   API     : http://localhost:5001/api/health"
echo ""
echo "Stop with:  tmux kill-session -t car-api -t car-web"
