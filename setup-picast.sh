#!/bin/bash
# L5Music Player — Pi Cast Setup
# One-click install: server.js + mpv + dependencies
# Run: curl -sSL https://raw.githubusercontent.com/L5Diy/ha-l5music-player/main/setup-picast.sh | bash

set -e
echo "=== L5Music Pi Cast Setup ==="
echo ""

# Check for Node.js
if ! command -v node &>/dev/null; then
  echo "[!] Node.js not found. Installing..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "[ok] Node.js $(node -v)"

# Install mpv
if ! command -v mpv &>/dev/null; then
  echo "[!] mpv not found. Installing..."
  sudo apt-get update && sudo apt-get install -y mpv
fi
echo "[ok] mpv $(mpv --version | head -1)"

# Create install directory
INSTALL_DIR="$HOME/l5music-player"
echo "[*] Installing to $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Download server.js from repo
REPO="https://raw.githubusercontent.com/L5Diy/ha-l5music-player/main"
echo "[*] Downloading server.js..."
curl -sSL "$REPO/server.js" -o server.js
curl -sSL "$REPO/package.json" -o package.json

# Download frontend files
mkdir -p public/assets
for file in app.js adapter.js adapter-l5music.js adapter-subsonic.js cast-audio.js audio-proxy.js index.html styles.css pwa.css manifest.json; do
  echo "[*] Downloading $file..."
  curl -sSL "$REPO/public/$file" -o "public/$file"
done

# Install npm dependencies
echo "[*] Installing dependencies..."
npm install --production 2>/dev/null

# Install PM2 if not present
if ! command -v pm2 &>/dev/null; then
  echo "[*] Installing PM2..."
  sudo npm install -g pm2
fi

# Start with PM2
pm2 stop l5music-player 2>/dev/null || true
pm2 start server.js --name l5music-player
pm2 save

IP=$(hostname -I | awk "{print \$1}")
echo ""
echo "=== Pi Cast Ready! ==="
echo "Server running at http://$IP:3003"
echo ""
echo "Open the L5Music Player PWA on your phone,"
echo "go to Settings > Pi Cast, and enter:"
echo "  http://$IP:3003"
echo ""
echo "Then tap the 3-dot menu and select Pi Cast."
