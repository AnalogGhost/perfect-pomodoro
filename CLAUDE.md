# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Electron-based Pomodoro timer desktop application that can be distributed across Linux, Windows, and macOS. The app features customizable work/break sessions, desktop notifications, and visual progress tracking.

## Architecture

### Core Application Structure
- **main.js**: Electron main process - handles window creation, IPC communication, and system notifications
- **renderer.js**: Contains the `PomodoroTimer` class that manages timer logic, session states, and UI updates
- **index.html**: Application UI with timer display, controls, and settings
- **styles.css**: Gradient-based styling with work/break theme switching

### Key Communication Patterns
- Main process communicates with renderer via IPC for desktop notifications (`show-notification` event)
- Renderer process uses vanilla JavaScript with DOM manipulation (no frameworks)
- Settings are read directly from form inputs, no persistent storage currently implemented

### Timer Logic Flow
The `PomodoroTimer` class manages session progression:
1. Work sessions (default 25min) → Short breaks (5min) → Long breaks (15min after 4 sessions)
2. Auto-advancing sessions with notifications between transitions
3. Real-time progress bar updates and theme changes

## Development Commands

### Development Workflow
```bash
npm run watch     # Hot reload development (auto-restart on file changes)
npm run dev       # Development mode with logging
npm run dev-debug # Development with DevTools auto-open
npm start         # Basic Electron start
```

The `npm run watch` command uses `dev.js` to monitor `main.js`, `renderer.js`, `index.html`, and `styles.css` for changes.

### Building and Distribution
```bash
npm run build          # Unified build command (runs ./build.sh)
npm run clean          # Remove dist/ folder
npm run build-linux    # Linux AppImage + deb packages
npm run build-windows  # Windows NSIS installer + portable exe (requires Wine)
npm run build-mac      # macOS DMG + ZIP (requires macOS)
```

The build script (`build.sh`) intelligently builds for available platforms and provides clear feedback about skipped builds.

## Platform-Specific Notes

### Electron Configuration
- Uses `--no-sandbox` flag for Linux compatibility
- NodeIntegration enabled with contextIsolation disabled (legacy renderer setup)
- DevTools auto-open in development when `--dev` flag or `NODE_ENV=development`

### Cross-Platform Building
- Linux builds work on any Linux system
- Windows builds require Wine installation
- macOS builds require building on macOS
- electron-builder handles platform-specific packaging automatically

### Distribution Packages
- **Linux**: AppImage (portable) and .deb (Ubuntu/Debian)
- **Windows**: NSIS installer and portable .exe
- **macOS**: DMG installer and ZIP archive with universal binaries (x64 + arm64)

## File Watching and Hot Reload

The `dev.js` script uses chokidar to watch core application files and automatically restart Electron when changes are detected. This enables rapid development iteration without manual restarts.