/*
 * Perfect Pomodoro Timer
 * Copyright (C) 2024
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const { ipcRenderer } = require('electron');

class PomodoroTimer {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentSessionType = 'work';
        this.sessionCount = 1;
        this.totalSessions = 0;
        this.timeRemaining = 0;
        this.totalTime = 0;
        this.timer = null;
        this.currentSessionName = 'General Work';
        this.sessionStartTime = null;

        this.initializeElements();
        this.loadSavedSessions();
        this.loadSettings();
        this.bindEvents();
        this.updateDisplay();
        this.loadThemeSettings();
        this.setupThemeListener();
        this.setupTrayListeners();

        // Initialize tray icon state
        ipcRenderer.send('timer-state-changed', 'stopped');
    }

    initializeElements() {
        this.timeDisplay = document.getElementById('timeDisplay');
        this.sessionTypeDisplay = document.getElementById('sessionType');
        this.sessionNameDisplay = document.getElementById('sessionName');
        this.sessionCountDisplay = document.getElementById('sessionCount');
        this.progressFill = document.getElementById('progressFill');

        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');

        this.sessionNameInput = document.getElementById('sessionNameInput');
        this.savedSessionsSelect = document.getElementById('savedSessions');
        this.saveSessionBtn = document.getElementById('saveSessionBtn');
        this.deleteSessionBtn = document.getElementById('deleteSessionBtn');

        this.workDurationInput = document.getElementById('workDuration');
        this.shortBreakInput = document.getElementById('shortBreak');
        this.longBreakInput = document.getElementById('longBreak');
        this.sessionsUntilLongBreakInput = document.getElementById('sessionsUntilLongBreak');

        this.openHistoryBtn = document.getElementById('openHistoryBtn');
        this.openSettingsBtn = document.getElementById('openSettingsBtn');
    }

    loadSettings() {
        this.settings = {
            workDuration: parseInt(this.workDurationInput.value) * 60,
            shortBreak: parseInt(this.shortBreakInput.value) * 60,
            longBreak: parseInt(this.longBreakInput.value) * 60,
            sessionsUntilLongBreak: parseInt(this.sessionsUntilLongBreakInput.value)
        };

        this.timeRemaining = this.settings.workDuration;
        this.totalTime = this.settings.workDuration;
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());

        this.sessionNameInput.addEventListener('input', () => {
            this.currentSessionName = this.sessionNameInput.value || 'Unnamed Session';
            this.updateDisplay();
        });

        this.savedSessionsSelect.addEventListener('change', () => this.loadSelectedSession());
        this.saveSessionBtn.addEventListener('click', () => this.saveCurrentSession());
        this.deleteSessionBtn.addEventListener('click', () => this.deleteSelectedSession());

        this.openHistoryBtn.addEventListener('click', () => this.openHistoryWindow());
        this.openSettingsBtn.addEventListener('click', () => this.openSettingsWindow());

        [this.workDurationInput, this.shortBreakInput, this.longBreakInput, this.sessionsUntilLongBreakInput]
            .forEach(input => {
                input.addEventListener('change', () => {
                    if (!this.isRunning) {
                        this.loadSettings();
                        this.updateDisplay();
                    }
                });
            });
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.sessionStartTime = new Date();

            // Update tray icon to running state
            ipcRenderer.send('timer-state-changed', 'running');

            this.timer = setInterval(() => {
                this.tick();
            }, 1000);
        }
    }

    pause() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
            clearInterval(this.timer);
            this.isRunning = false;

            // Update tray icon to paused state
            ipcRenderer.send('timer-state-changed', 'paused');
        }
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;

        if (this.timer) {
            clearInterval(this.timer);
        }

        this.currentSessionType = 'work';
        this.sessionCount = 1;

        // Update tray icon to stopped state
        ipcRenderer.send('timer-state-changed', 'stopped');
        this.totalSessions = 0;
        this.loadSettings();
        this.updateDisplay();
        this.updateTheme();
    }

    tick() {
        if (this.timeRemaining > 0) {
            this.timeRemaining--;
            this.updateDisplay();
        } else {
            this.sessionComplete();
        }
    }

    sessionComplete() {
        const sessionEndTime = new Date();
        const sessionDuration = Math.round((sessionEndTime - this.sessionStartTime) / 1000);

        // Save completed session to history
        if (this.currentSessionType === 'work') {
            this.saveSessionToHistory({
                name: this.currentSessionName,
                type: 'work',
                plannedDuration: this.totalTime,
                actualDuration: sessionDuration,
                startTime: this.sessionStartTime,
                endTime: sessionEndTime,
                workDuration: this.settings.workDuration / 60,
                shortBreak: this.settings.shortBreak / 60,
                longBreak: this.settings.longBreak / 60
            });
        }

        this.playNotification();

        if (this.currentSessionType === 'work') {
            this.totalSessions++;

            if (this.totalSessions % this.settings.sessionsUntilLongBreak === 0) {
                this.currentSessionType = 'longBreak';
                this.timeRemaining = this.settings.longBreak;
                this.totalTime = this.settings.longBreak;
            } else {
                this.currentSessionType = 'shortBreak';
                this.timeRemaining = this.settings.shortBreak;
                this.totalTime = this.settings.shortBreak;
            }
        } else {
            this.currentSessionType = 'work';
            this.sessionCount++;
            this.timeRemaining = this.settings.workDuration;
            this.totalTime = this.settings.workDuration;
        }

        this.updateDisplay();
        this.updateTheme();

        // Apply custom theme colors if available
        const settings = JSON.parse(localStorage.getItem('pomodoroSettings') || '{}');
        if (Object.keys(settings).length > 0) {
            this.applyTheme(settings);
        }

        setTimeout(() => {
            this.start();
        }, 1000);
    }

    playNotification() {
        let title, body;

        if (this.currentSessionType === 'work') {
            title = 'Work Session Complete!';
            body = 'Time for a break. Great job!';
        } else {
            title = 'Break Time Over!';
            body = 'Ready to get back to work?';
        }

        ipcRenderer.send('show-notification', title, body);

        const audio = new Audio();
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmkgBDqN2n+5Fm';
        audio.play().catch(() => {});
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        this.sessionCountDisplay.textContent = this.sessionCount;

        let sessionTypeText;
        switch (this.currentSessionType) {
            case 'work':
                sessionTypeText = 'Work Session';
                break;
            case 'shortBreak':
                sessionTypeText = 'Short Break';
                break;
            case 'longBreak':
                sessionTypeText = 'Long Break';
                break;
        }
        this.sessionTypeDisplay.textContent = sessionTypeText;

        // Update session name display
        if (this.currentSessionType === 'work') {
            this.sessionNameDisplay.textContent = this.currentSessionName;
        } else {
            this.sessionNameDisplay.textContent = 'Take a break!';
        }

        const progress = ((this.totalTime - this.timeRemaining) / this.totalTime) * 100;
        this.progressFill.style.width = `${progress}%`;
    }

    updateTheme() {
        const body = document.body;
        if (this.currentSessionType === 'work') {
            body.className = 'work-session';
        } else {
            body.className = 'break-session';
        }

        // Update tray icon to match session type
        ipcRenderer.send('session-type-changed', this.currentSessionType);
    }

    // Session management methods
    loadSavedSessions() {
        const savedSessions = JSON.parse(localStorage.getItem('pomodoroSessions') || '{}');
        this.savedSessionsSelect.innerHTML = '<option value="">Select a saved session...</option>';

        Object.keys(savedSessions).forEach(sessionName => {
            const option = document.createElement('option');
            option.value = sessionName;
            option.textContent = sessionName;
            this.savedSessionsSelect.appendChild(option);
        });
    }

    saveCurrentSession() {
        const sessionName = this.sessionNameInput.value.trim();
        if (!sessionName) {
            alert('Please enter a session name');
            return;
        }

        const sessionData = {
            name: sessionName,
            workDuration: parseInt(this.workDurationInput.value),
            shortBreak: parseInt(this.shortBreakInput.value),
            longBreak: parseInt(this.longBreakInput.value),
            sessionsUntilLongBreak: parseInt(this.sessionsUntilLongBreakInput.value)
        };

        const savedSessions = JSON.parse(localStorage.getItem('pomodoroSessions') || '{}');
        savedSessions[sessionName] = sessionData;
        localStorage.setItem('pomodoroSessions', JSON.stringify(savedSessions));

        this.loadSavedSessions();
        this.savedSessionsSelect.value = sessionName;

        console.log(`Session "${sessionName}" saved!`);
    }

    loadSelectedSession() {
        const sessionName = this.savedSessionsSelect.value;
        if (!sessionName) return;

        const savedSessions = JSON.parse(localStorage.getItem('pomodoroSessions') || '{}');
        const sessionData = savedSessions[sessionName];

        if (sessionData) {
            this.sessionNameInput.value = sessionData.name;
            this.workDurationInput.value = sessionData.workDuration;
            this.shortBreakInput.value = sessionData.shortBreak;
            this.longBreakInput.value = sessionData.longBreak;
            this.sessionsUntilLongBreakInput.value = sessionData.sessionsUntilLongBreak;

            this.currentSessionName = sessionData.name;

            if (!this.isRunning) {
                this.loadSettings();
                this.updateDisplay();
            }
        }
    }

    deleteSelectedSession() {
        const sessionName = this.savedSessionsSelect.value;
        if (!sessionName) {
            alert('Please select a session to delete');
            return;
        }

        if (confirm(`Delete session "${sessionName}"?`)) {
            const savedSessions = JSON.parse(localStorage.getItem('pomodoroSessions') || '{}');
            delete savedSessions[sessionName];
            localStorage.setItem('pomodoroSessions', JSON.stringify(savedSessions));

            this.loadSavedSessions();
            console.log(`Session "${sessionName}" deleted!`);
        }
    }

    // Session History Methods
    saveSessionToHistory(sessionData) {
        const history = JSON.parse(localStorage.getItem('pomodoroHistory') || '[]');
        history.push(sessionData);

        // Keep only last 100 sessions to avoid storage bloat
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }

        localStorage.setItem('pomodoroHistory', JSON.stringify(history));
    }

    openHistoryWindow() {
        ipcRenderer.send('open-history');
    }

    openSettingsWindow() {
        ipcRenderer.send('open-settings');
    }

    loadThemeSettings() {
        const settings = JSON.parse(localStorage.getItem('pomodoroSettings') || '{}');
        if (Object.keys(settings).length > 0) {
            this.applyTheme(settings);
        }
    }

    setupThemeListener() {
        ipcRenderer.on('theme-update', (event, themeData) => {
            this.applyTheme(themeData);
        });
    }

    setupTrayListeners() {
        // Listen for tray commands
        ipcRenderer.on('tray-start-timer', () => {
            if (!this.isRunning) {
                this.start();
            }
        });

        ipcRenderer.on('tray-pause-timer', () => {
            if (this.isRunning && !this.isPaused) {
                this.pause();
            } else if (this.isPaused) {
                this.resume();
            }
        });
    }

    applyTheme(settings) {
        const body = document.body;
        const container = document.querySelector('.container');
        const timerDisplay = document.querySelector('.timer-display');
        const timeDisplay = document.querySelector('.time');

        // Apply colors based on current session type
        if (this.currentSessionType === 'work') {
            body.style.background = `linear-gradient(135deg, ${settings.primaryColor} 0%, ${settings.secondaryColor} 100%)`;
        } else {
            body.style.background = `linear-gradient(135deg, ${settings.breakPrimary} 0%, ${settings.breakSecondary} 100%)`;
        }

        // Apply UI settings
        if (settings.windowOpacity) {
            body.style.opacity = settings.windowOpacity;
        }

        if (settings.timerFontSize) {
            timeDisplay.style.fontSize = settings.timerFontSize + 'px';
        }

        if (settings.borderRadius) {
            timerDisplay.style.borderRadius = settings.borderRadius + 'px';
        }

        if (settings.blurIntensity) {
            timerDisplay.style.backdropFilter = `blur(${settings.blurIntensity}px)`;
        }

        if (settings.accentColor) {
            document.documentElement.style.setProperty('--accent-color', settings.accentColor);
            // Update progress fill and buttons
            const progressFill = document.querySelector('.progress-fill');
            const primaryBtns = document.querySelectorAll('.btn.primary');

            if (progressFill) {
                progressFill.style.background = settings.accentColor;
            }

            primaryBtns.forEach(btn => {
                btn.style.background = settings.accentColor;
            });
        }

        // Apply animations setting
        if (settings.enableAnimations === false) {
            document.documentElement.style.setProperty('--transition-duration', '0s');
        } else {
            document.documentElement.style.setProperty('--transition-duration', '0.3s');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});