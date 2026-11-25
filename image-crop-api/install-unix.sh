#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if [ ! -f ".env" ]; then
  cp .env.example .env
fi

echo "=========================================="
echo "       Image Crop API - Setup"
echo "=========================================="
echo "1) Docker (RECOMMENDED - Builds locally + Auto-starts with Docker)"
echo "2) Native Node.js + PM2 (Auto-starts on OS boot)"
read -p "Choose installation method (1 or 2): " choice

if [ "$choice" == "1" ]; then
  docker compose up -d --build
  echo "Done! Image Crop API is running at http://localhost:3133"
elif [ "$choice" == "2" ]; then
  npm install --omit=dev
  npm install -g pm2
  pm2 start server.js --name "image-crop-api"
  pm2 save
  echo "Run the command output below (if any) to complete OS startup registration:"
  pm2 startup
  echo "Done! Image Crop API is running at http://localhost:3133"
else
  echo "Invalid selection."
  exit 1
fi
