#!/bin/bash

echo "🚀 Building Perfect Pomodoro Timer for all platforms..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/

# Build Linux packages (always works)
echo "🐧 Building Linux packages..."
npm run build-linux-all

# Try Windows build (if Wine is available)
if command -v wine &> /dev/null; then
    echo "🪟 Building Windows packages..."
    npm run build-windows || echo "⚠️  Windows build failed (Wine issue)"
else
    echo "⚠️  Skipping Windows build (Wine not installed)"
fi

# Try macOS build (if on macOS or with proper tools)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Building macOS packages..."
    npm run build-mac || echo "⚠️  macOS build failed"
else
    echo "⚠️  Skipping macOS build (not on macOS)"
fi

echo ""
echo "✅ Build complete! Available packages:"
ls -la dist/ | grep -E "\.(AppImage|deb|exe|dmg|zip)$" || echo "Check dist/ folder for available packages"

echo ""
echo "📦 Distribution files ready in dist/ folder"