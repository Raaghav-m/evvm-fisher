#!/bin/bash

# EVVM Telegram Bot Deployment Script

set -e

echo "🚀 Starting EVVM Telegram Bot deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or later is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if yarn is installed
if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn is not installed. Please install Yarn."
    exit 1
fi

echo "✅ Yarn version: $(yarn -v)"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy env.example to .env and configure it."
    exit 1
fi

echo "✅ Environment file found"

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Run tests
echo "🧪 Running tests..."
yarn test

# Build the project (if needed)
echo "🔨 Building project..."
# yarn build

# Check if PM2 is installed for production deployment
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 found - ready for production deployment"
    echo "To start with PM2: pm2 start ecosystem.config.js"
else
    echo "ℹ️  PM2 not found. Install PM2 for production deployment: npm install -g pm2"
fi

echo "✅ Deployment preparation completed!"
echo ""
echo "To start the bot:"
echo "  Development: yarn dev"
echo "  Production:  yarn start"
echo "  With PM2:    pm2 start ecosystem.config.js"
echo ""
echo "Make sure to configure your .env file with:"
echo "  - TELEGRAM_BOT_TOKEN"
echo "  - RPC URLs for your networks"
echo "  - Other required settings"
