/*
 * Perfect Pomodoro Timer
 * Copyright (C) 2024 Matt Brown <perfect-pomodoro@hackerapps.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow;
let historyWindow;
let settingsWindow;
let tray = null;

function createWindow() {
  // Create proper icon for Linux - try multiple sizes
  let windowIcon;
  const iconPaths = [
    path.join(__dirname, 'assets/icon-128.png'),
    path.join(__dirname, 'assets/icon-64.png'),
    path.join(__dirname, 'assets/icon.png')
  ];

  for (const iconPath of iconPaths) {
    if (require('fs').existsSync(iconPath)) {
      windowIcon = nativeImage.createFromPath(iconPath);
      if (!windowIcon.isEmpty()) {
        console.log(`Using icon: ${iconPath}`);
        break;
      }
    }
  }

  if (!windowIcon || windowIcon.isEmpty()) {
    console.log('No valid icon found, using default');
    windowIcon = nativeImage.createEmpty();
  }

  mainWindow = new BrowserWindow({
    width: 420,
    height: 850,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    resizable: false,
    titleBarStyle: 'default',
    icon: windowIcon,
    autoHideMenuBar: true,
    menuBarVisible: false
  });

  mainWindow.loadFile('index.html');

  // Remove menu bar completely
  mainWindow.setMenuBarVisibility(false);

  // Explicitly set the window icon for Linux systems
  if (process.platform === 'linux') {
    mainWindow.setIcon(windowIcon);
  }

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close - minimize to tray instead of quitting
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function getTrayIcon(sessionType = 'work', themeName = 'default', timerState = 'running') {
  const fs = require('fs');
  let trayIcon;

  // Try theme-specific icon with state first
  let iconPath = path.join(__dirname, `assets/icon-${themeName}-${sessionType}-${timerState}.png`);

  // If theme-specific icon with state doesn't exist, try generic session type with state
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, `assets/icon-${sessionType}-${timerState}.png`);
  }

  // If that doesn't exist, try without state
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, `assets/icon-${themeName}-${sessionType}.png`);
  }

  // Fall back to generic session type without state
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, `assets/icon-${sessionType}.png`);
  }

  // If that doesn't exist either, use fallback paths
  if (!fs.existsSync(iconPath)) {
    const iconPaths = {
      work: path.join(__dirname, 'assets/icon-work.png'),
      break: path.join(__dirname, 'assets/icon-break.png'),
      custom: path.join(__dirname, 'assets/icon-white.png'),
      black: path.join(__dirname, 'assets/icon-black.png'),
      white: path.join(__dirname, 'assets/icon-white.png')
    };
    iconPath = iconPaths[sessionType] || iconPaths.work;
  }

  // Try to load the selected icon
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (!trayIcon.isEmpty()) {
      trayIcon = trayIcon.resize({ width: 16, height: 16 });
      console.log(`Using ${themeName}-${sessionType}-${timerState} tray icon`);
      return trayIcon;
    }
  }

  // Fallback to original icon loading logic
  const svgPath = path.join(__dirname, 'assets/icon.svg');
  if (fs.existsSync(svgPath)) {
    trayIcon = nativeImage.createFromPath(svgPath);
    if (!trayIcon.isEmpty()) {
      trayIcon = trayIcon.resize({ width: 16, height: 16 });
      console.log('Using SVG fallback icon');
      return trayIcon;
    }
  }

  const pngPath = path.join(__dirname, 'assets/icon.png');
  if (fs.existsSync(pngPath)) {
    trayIcon = nativeImage.createFromPath(pngPath);
    if (!trayIcon.isEmpty()) {
      trayIcon = trayIcon.resize({ width: 16, height: 16 });
      console.log('Using PNG fallback icon');
      return trayIcon;
    }
  }

  // Create programmatic fallback
  console.log('Creating programmatic fallback icon');
  const svgData = `<svg width="22" height="22" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="10" fill="#ffffff" stroke="#000000" stroke-width="1"/>
    <circle cx="11" cy="11" r="7" fill="#ff4444" stroke="#cc0000" stroke-width="1"/>
    <circle cx="11" cy="11" r="5" fill="none" stroke="#ffffff" stroke-width="1.5"/>
    <line x1="11" y1="11" x2="11" y2="6" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
    <circle cx="11" cy="11" r="1" fill="#ffffff"/>
  </svg>`;
  trayIcon = nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svgData).toString('base64')}`);
  trayIcon = trayIcon.resize({ width: 16, height: 16 });
  console.log('Created programmatic fallback tray icon');

  return trayIcon;
}

function updateTrayIcon(sessionType = 'work', themeName = 'default', timerState = 'running') {
  if (!tray) return;

  const newIcon = getTrayIcon(sessionType, themeName, timerState);
  if (newIcon && !newIcon.isEmpty()) {
    tray.setImage(newIcon);
    console.log(`Updated tray icon to ${themeName}-${sessionType}-${timerState}`);
  }
}

function createTray() {
  // Check if system tray is available
  if (!app.isReady()) {
    console.log('App not ready, delaying tray creation');
    return;
  }

  console.log('Creating system tray...');

  try {
    const trayIcon = getTrayIcon('work', 'default', 'stopped'); // Start with work theme, stopped state

    if (trayIcon && !trayIcon.isEmpty()) {
      tray = new Tray(trayIcon);
      console.log('Tray created successfully');
    } else {
      console.log('Failed to create valid icon, trying empty icon');
      tray = new Tray(nativeImage.createEmpty());
    }
  } catch (error) {
    console.error('Error creating tray:', error);
    // Final fallback
    try {
      const image = nativeImage.createEmpty();
      tray = new Tray(image);
      console.log('Created tray with empty icon');
    } catch (fallbackError) {
      console.error('Failed to create tray entirely:', fallbackError);
      return;
    }
  }

  // Function to update the context menu based on window visibility
  const updateContextMenu = () => {
    const isVisible = mainWindow && mainWindow.isVisible();
    const contextMenu = Menu.buildFromTemplate([
      {
        label: isVisible ? 'Hide' : 'Show',
        click: () => {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
          }
        }
      },
      {
        label: 'Start Timer',
        click: () => {
          mainWindow.show();
          mainWindow.webContents.send('tray-start-timer');
        }
      },
      {
        label: 'Pause Timer',
        click: () => {
          mainWindow.webContents.send('tray-pause-timer');
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
  };

  // Initial menu setup
  updateContextMenu();

  // Update menu when window visibility changes
  mainWindow.on('show', updateContextMenu);
  mainWindow.on('hide', updateContextMenu);

  tray.setToolTip('Perfect Pomodoro Timer');

  // Double click to show/hide window
  tray.on('double-click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // Don't quit - keep running in system tray
  if (process.platform !== 'darwin') {
    // On macOS, keep app running even when all windows closed
    return;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle app termination more aggressively in development
app.on('before-quit', () => {
  if (mainWindow) {
    mainWindow.destroy();
  }
});

function createHistoryWindow() {
  if (historyWindow) {
    historyWindow.focus();
    return;
  }

  historyWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true,
    menuBarVisible: false,
    parent: mainWindow,
    modal: false,
    title: 'Session History'
  });

  historyWindow.loadFile('history.html');
  historyWindow.setMenuBarVisibility(false);

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    historyWindow.webContents.openDevTools();
  }

  historyWindow.on('closed', () => {
    historyWindow = null;
  });
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 700,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true,
    menuBarVisible: false,
    parent: mainWindow,
    modal: false,
    title: 'Settings'
  });

  settingsWindow.loadFile('settings.html');
  settingsWindow.setMenuBarVisibility(false);

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    settingsWindow.webContents.openDevTools();
  }

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

ipcMain.on('show-notification', (event, title, body) => {
  new Notification({ title, body }).show();
});

ipcMain.on('open-history', () => {
  createHistoryWindow();
});

ipcMain.on('open-settings', () => {
  createSettingsWindow();
});

ipcMain.on('get-history-data', (event) => {
  // Send history data to history window
  const history = JSON.parse(global.historyData || '[]');
  event.reply('history-data', history);
});

ipcMain.on('save-history-data', (event, data) => {
  global.historyData = JSON.stringify(data);
});

// Track current state for tray icon
let currentSessionType = 'work';
let currentTheme = 'default';
let currentTimerState = 'stopped';

ipcMain.on('apply-theme', (event, themeData) => {
  // Send theme data to main window
  if (mainWindow) {
    mainWindow.webContents.send('theme-update', themeData);
  }

  // Update current theme and tray icon
  currentTheme = themeData.theme || 'custom';
  updateTrayIcon(currentSessionType, currentTheme, currentTimerState);
});

// Handle session type changes to update tray icon
ipcMain.on('session-type-changed', (event, sessionType) => {
  currentSessionType = sessionType;
  updateTrayIcon(currentSessionType, currentTheme, currentTimerState);
});

// Handle timer state changes
ipcMain.on('timer-state-changed', (event, timerState) => {
  currentTimerState = timerState;
  updateTrayIcon(currentSessionType, currentTheme, currentTimerState);
});

// Handle theme changes for tray icon
ipcMain.on('update-tray-theme', (event, themeName, sessionType, timerState) => {
  if (themeName) currentTheme = themeName;
  if (sessionType) currentSessionType = sessionType;
  if (timerState) currentTimerState = timerState;
  updateTrayIcon(currentSessionType, currentTheme, currentTimerState);
});