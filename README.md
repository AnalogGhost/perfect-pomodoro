# Perfect Pomodoro Timer

A beautiful and customizable desktop Pomodoro timer built with Electron. Features work/break sessions, desktop notifications, system tray integration, and multiple visual themes.

![Perfect Pomodoro Timer](assets/icon-128.png)

## Features

- ⏱️ **Customizable Sessions**: Configure work (25min), short break (5min), and long break (15min) durations
- 🎨 **Multiple Themes**: Choose from Default, Forest, Ocean, Sunset, Cherry, Midnight themes or create custom ones
- 🔔 **Desktop Notifications**: Get notified when sessions start and end
- 📊 **Session Tracking**: View your productivity history and statistics
- 🖥️ **System Tray**: Minimize to tray and control timer from system menu
- 🎯 **Auto-advancing**: Automatically transitions between work and break sessions
- 🌈 **Visual Progress**: Real-time progress bar with theme-based colors
- ⚙️ **Flexible Settings**: Customize everything from session lengths to notification preferences

## Download & Installation

### Linux
- **AppImage** (recommended): Download `Perfect Pomodoro Timer-1.0.0.AppImage`
  - Make executable: `chmod +x "Perfect Pomodoro Timer-1.0.0.AppImage"`
  - Run by double-clicking or `./Perfect\ Pomodoro\ Timer-1.0.0.AppImage`
- **Debian/Ubuntu**: Download `.deb` package and install with `sudo dpkg -i pomodoro-timer_1.0.0_amd64.deb`

### Windows
- **Installer**: Download and run the `.exe` installer
- **Portable**: Download the portable `.exe` file

### macOS
- **DMG**: Download and mount the `.dmg` file, drag to Applications
- **ZIP**: Download and extract the `.zip` file

## Development

### Prerequisites
- Node.js (v16 or higher)
- npm

### Setup
```bash
git clone https://github.com/yourusername/pomodoro-timer.git
cd pomodoro-timer
npm install
```

### Development Commands
```bash
npm run dev          # Development mode with logging
npm run watch        # Hot reload development (auto-restart on changes)
npm run dev-debug    # Development with DevTools auto-open
npm start            # Basic Electron start
```

### Building
```bash
npm run build        # Build for all available platforms
npm run build-linux  # Linux AppImage + deb packages
npm run build-windows # Windows installer + portable (requires Wine on Linux)
npm run build-mac    # macOS DMG + ZIP (requires macOS)
npm run clean        # Remove dist/ folder
```

## Architecture

- **Electron**: Cross-platform desktop framework
- **Vanilla JavaScript**: No heavy frameworks, pure DOM manipulation
- **IPC Communication**: Main process handles notifications and system integration
- **Theme System**: CSS custom properties for dynamic theming
- **File Watching**: Hot reload in development with automatic restart

## File Structure

```
├── main.js              # Electron main process
├── renderer.js          # Timer logic and UI management
├── index.html           # Main application UI
├── styles.css           # Theme-based styling
├── settings.html        # Settings window
├── history.html         # Session history window
├── assets/              # Icons and images
├── build.sh             # Cross-platform build script
└── dev.js               # Development file watcher
```

## Usage

1. **Start Timer**: Click the play button to begin a work session
2. **Pause/Resume**: Click pause to temporarily stop, resume to continue
3. **Skip Session**: Use the skip button to move to the next session
4. **Change Themes**: Open settings to select from available themes or create custom ones
5. **View History**: Check your productivity stats in the history window
6. **System Tray**: Minimize to tray for background operation

## Customization

### Themes
The app includes several built-in themes:
- **Default**: Clean red and blue gradient
- **Forest**: Green nature-inspired colors
- **Ocean**: Blue aquatic theme
- **Sunset**: Warm orange and yellow tones
- **Cherry**: Pink and red cherry blossom colors
- **Midnight**: Dark theme with purple accents

### Custom Themes
Create your own themes in the settings panel by adjusting:
- Work session colors (background gradients)
- Break session colors
- Text and accent colors
- Progress bar styling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GNU General Public License v3.0 or later - see the [LICENSE](LICENSE) file for details.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

## Acknowledgments

- Built with [Electron](https://electronjs.org/)
- Icons designed for system tray integration
- Pomodoro Technique® developed by Francesco Cirillo