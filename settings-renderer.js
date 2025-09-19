const { ipcRenderer } = require('electron');

class SettingsWindow {
    constructor() {
        this.settings = this.loadSettings();
        this.soundFiles = {
            default: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmkgBDqN2n+5Fm'
        };
        this.themePresets = {
            default: {
                primaryColor: '#8b5cf6',
                secondaryColor: '#a855f7',
                breakPrimary: '#c084fc',
                breakSecondary: '#d946ef',
                accentColor: '#a855f7'
            },
            ocean: {
                primaryColor: '#667eea',
                secondaryColor: '#2193b0',
                breakPrimary: '#667eea',
                breakSecondary: '#2193b0',
                accentColor: '#00bcd4'
            },
            forest: {
                primaryColor: '#134e5e',
                secondaryColor: '#71b280',
                breakPrimary: '#71b280',
                breakSecondary: '#134e5e',
                accentColor: '#4caf50'
            },
            sunset: {
                primaryColor: '#ff9a9e',
                secondaryColor: '#fecfef',
                breakPrimary: '#fecfef',
                breakSecondary: '#ff9a9e',
                accentColor: '#ff5722'
            },
            midnight: {
                primaryColor: '#2c3e50',
                secondaryColor: '#4a6741',
                breakPrimary: '#4a6741',
                breakSecondary: '#2c3e50',
                accentColor: '#27ae60'
            },
            cherry: {
                primaryColor: '#eb3349',
                secondaryColor: '#f45c43',
                breakPrimary: '#f45c43',
                breakSecondary: '#eb3349',
                accentColor: '#e91e63'
            }
        };

        this.initializeElements();
        this.bindEvents();
        this.loadSettingsToUI();
        this.updatePreview();
    }

    initializeElements() {
        // Theme controls
        this.themePreset = document.getElementById('themePreset');
        this.primaryColor = document.getElementById('primaryColor');
        this.secondaryColor = document.getElementById('secondaryColor');
        this.breakPrimary = document.getElementById('breakPrimary');
        this.breakSecondary = document.getElementById('breakSecondary');
        this.accentColor = document.getElementById('accentColor');

        // UI controls
        this.timerFontSize = document.getElementById('timerFontSize');
        this.windowOpacity = document.getElementById('windowOpacity');
        this.borderRadius = document.getElementById('borderRadius');
        this.blurIntensity = document.getElementById('blurIntensity');
        this.enableAnimations = document.getElementById('enableAnimations');
        this.showSeconds = document.getElementById('showSeconds');

        // Sound controls
        this.soundTheme = document.getElementById('soundTheme');
        this.soundVolume = document.getElementById('soundVolume');
        this.enableNotifications = document.getElementById('enableNotifications');

        // Buttons
        this.resetBtn = document.getElementById('resetBtn');
        this.applyBtn = document.getElementById('applyBtn');
        this.testSoundBtn = document.getElementById('testSoundBtn');

        // Preview elements
        this.previewTimer = document.querySelector('.preview-timer');
        this.previewTime = document.querySelector('.preview-time');
        this.previewSession = document.querySelector('.preview-session');
        this.previewName = document.querySelector('.preview-name');

        // Color value displays
        this.colorValues = document.querySelectorAll('.color-value');
        this.rangeValues = document.querySelectorAll('.range-value');
    }

    bindEvents() {
        // Theme preset changes
        this.themePreset.addEventListener('change', () => this.applyThemePreset());

        // Color input changes
        [this.primaryColor, this.secondaryColor, this.breakPrimary, this.breakSecondary, this.accentColor]
            .forEach(input => {
                input.addEventListener('input', () => {
                    this.updateColorValue(input);
                    this.updatePreview();
                });
            });

        // Range input changes
        [this.timerFontSize, this.windowOpacity, this.borderRadius, this.blurIntensity, this.soundVolume]
            .forEach(input => {
                input.addEventListener('input', () => {
                    this.updateRangeValue(input);
                    this.updatePreview();
                });
            });

        // Checkbox changes
        [this.enableAnimations, this.showSeconds, this.enableNotifications]
            .forEach(input => {
                input.addEventListener('change', () => this.updatePreview());
            });

        // Select changes
        [this.soundTheme].forEach(input => {
            input.addEventListener('change', () => this.updatePreview());
        });

        // Buttons
        this.resetBtn.addEventListener('click', () => this.resetToDefaults());
        this.applyBtn.addEventListener('click', () => this.applySettings());
        this.testSoundBtn.addEventListener('click', () => this.testSound());
    }

    loadSettings() {
        const defaultSettings = {
            theme: 'default',
            primaryColor: '#8b5cf6',
            secondaryColor: '#a855f7',
            breakPrimary: '#c084fc',
            breakSecondary: '#d946ef',
            accentColor: '#a855f7',
            timerFontSize: 42,
            windowOpacity: 1,
            borderRadius: 15,
            blurIntensity: 10,
            enableAnimations: true,
            showSeconds: true,
            soundTheme: 'default',
            soundVolume: 50,
            enableNotifications: true
        };

        const savedSettings = JSON.parse(localStorage.getItem('pomodoroSettings') || '{}');
        return { ...defaultSettings, ...savedSettings };
    }

    saveSettings() {
        localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
    }

    loadSettingsToUI() {
        this.themePreset.value = this.settings.theme;
        this.primaryColor.value = this.settings.primaryColor;
        this.secondaryColor.value = this.settings.secondaryColor;
        this.breakPrimary.value = this.settings.breakPrimary;
        this.breakSecondary.value = this.settings.breakSecondary;
        this.accentColor.value = this.settings.accentColor;
        this.timerFontSize.value = this.settings.timerFontSize;
        this.windowOpacity.value = this.settings.windowOpacity;
        this.borderRadius.value = this.settings.borderRadius;
        this.blurIntensity.value = this.settings.blurIntensity;
        this.enableAnimations.checked = this.settings.enableAnimations;
        this.showSeconds.checked = this.settings.showSeconds;
        this.soundTheme.value = this.settings.soundTheme;
        this.soundVolume.value = this.settings.soundVolume;
        this.enableNotifications.checked = this.settings.enableNotifications;

        // Update display values
        this.updateAllColorValues();
        this.updateAllRangeValues();
    }

    updateColorValue(input) {
        const valueSpan = input.parentElement.querySelector('.color-value');
        if (valueSpan) {
            valueSpan.textContent = input.value;
        }
    }

    updateRangeValue(input) {
        const valueSpan = input.parentElement.querySelector('.range-value');
        if (valueSpan) {
            let value = input.value;
            if (input.id === 'windowOpacity') {
                value = Math.round(value * 100) + '%';
            } else if (input.id === 'soundVolume') {
                value = value + '%';
            } else {
                value = value + 'px';
            }
            valueSpan.textContent = value;
        }
    }

    updateAllColorValues() {
        [this.primaryColor, this.secondaryColor, this.breakPrimary, this.breakSecondary, this.accentColor]
            .forEach(input => this.updateColorValue(input));
    }

    updateAllRangeValues() {
        [this.timerFontSize, this.windowOpacity, this.borderRadius, this.blurIntensity, this.soundVolume]
            .forEach(input => this.updateRangeValue(input));
    }

    applyThemePreset() {
        const presetName = this.themePreset.value;

        if (presetName !== 'custom' && this.themePresets[presetName]) {
            const preset = this.themePresets[presetName];

            this.primaryColor.value = preset.primaryColor;
            this.secondaryColor.value = preset.secondaryColor;
            this.breakPrimary.value = preset.breakPrimary;
            this.breakSecondary.value = preset.breakSecondary;
            this.accentColor.value = preset.accentColor;

            this.updateAllColorValues();
            this.updatePreview();
        }
    }

    updatePreview() {
        const gradient = `linear-gradient(135deg, ${this.primaryColor.value} 0%, ${this.secondaryColor.value} 100%)`;

        // Update preview timer styling
        this.previewTimer.style.setProperty('--primary-color', this.primaryColor.value);
        this.previewTimer.style.setProperty('--secondary-color', this.secondaryColor.value);
        this.previewTimer.style.setProperty('--accent-color', this.accentColor.value);
        this.previewTimer.style.borderRadius = this.borderRadius.value + 'px';
        this.previewTimer.style.backdropFilter = `blur(${this.blurIntensity.value}px)`;

        this.previewTime.style.fontSize = this.timerFontSize.value + 'px';

        // Update background
        document.body.style.background = gradient;
        document.body.style.opacity = this.windowOpacity.value;

        // Update timer display
        if (this.showSeconds.checked) {
            this.previewTime.textContent = '25:00';
        } else {
            this.previewTime.textContent = '25:00';
        }

        // Animation toggle
        if (this.enableAnimations.checked) {
            this.previewTimer.style.transition = 'all 0.3s ease';
        } else {
            this.previewTimer.style.transition = 'none';
        }
    }

    collectCurrentSettings() {
        return {
            theme: this.themePreset.value,
            primaryColor: this.primaryColor.value,
            secondaryColor: this.secondaryColor.value,
            breakPrimary: this.breakPrimary.value,
            breakSecondary: this.breakSecondary.value,
            accentColor: this.accentColor.value,
            timerFontSize: parseInt(this.timerFontSize.value),
            windowOpacity: parseFloat(this.windowOpacity.value),
            borderRadius: parseInt(this.borderRadius.value),
            blurIntensity: parseInt(this.blurIntensity.value),
            enableAnimations: this.enableAnimations.checked,
            showSeconds: this.showSeconds.checked,
            soundTheme: this.soundTheme.value,
            soundVolume: parseInt(this.soundVolume.value),
            enableNotifications: this.enableNotifications.checked
        };
    }

    applySettings() {
        this.settings = this.collectCurrentSettings();
        this.saveSettings();

        // Send settings to main window
        ipcRenderer.send('apply-theme', this.settings);

        console.log('Settings applied and saved');
        alert('Settings applied successfully!');
    }

    generateSound(type, volume) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = volume;

        if (type === 'chime') {
            // Generate a soft chime sound using multiple frequencies
            const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const envelope = audioContext.createGain();

                oscillator.connect(envelope);
                envelope.connect(gainNode);

                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                oscillator.type = 'sine';

                envelope.gain.setValueAtTime(0, audioContext.currentTime);
                envelope.gain.linearRampToValueAtTime(0.3 / frequencies.length, audioContext.currentTime + 0.01 + index * 0.1);
                envelope.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.5 + index * 0.2);

                oscillator.start(audioContext.currentTime + index * 0.1);
                oscillator.stop(audioContext.currentTime + 2 + index * 0.2);
            });
        } else if (type === 'bell') {
            // Generate a bell sound with harmonics
            const fundamental = 440; // A4
            const harmonics = [1, 2, 3, 4, 5];
            const amplitudes = [1, 0.5, 0.3, 0.2, 0.1];

            harmonics.forEach((harmonic, index) => {
                const oscillator = audioContext.createOscillator();
                const envelope = audioContext.createGain();

                oscillator.connect(envelope);
                envelope.connect(gainNode);

                oscillator.frequency.setValueAtTime(fundamental * harmonic, audioContext.currentTime);
                oscillator.type = 'sine';

                envelope.gain.setValueAtTime(0, audioContext.currentTime);
                envelope.gain.linearRampToValueAtTime(0.2 * amplitudes[index], audioContext.currentTime + 0.01);
                envelope.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 2);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 2.5);
            });
        }
    }

    testSound() {
        const soundType = this.soundTheme.value;
        const volume = this.soundVolume.value / 100;

        if (soundType === 'none') {
            alert('Sound is set to Silent - no sound will play');
            return;
        }

        try {
            if (soundType === 'default' && this.soundFiles[soundType]) {
                // Use the original audio file for default sound
                const audio = new Audio();
                audio.src = this.soundFiles[soundType];
                audio.volume = volume;
                audio.play().then(() => {
                    console.log(`Playing ${soundType} sound at ${Math.round(volume * 100)}% volume`);
                }).catch((error) => {
                    console.error('Failed to play default sound:', error);
                    alert('Failed to play sound. Your browser may have blocked audio playback.');
                });
            } else if (soundType === 'chime' || soundType === 'bell') {
                // Generate sounds using Web Audio API
                this.generateSound(soundType, volume);
                console.log(`Playing generated ${soundType} sound at ${Math.round(volume * 100)}% volume`);
            } else {
                console.warn(`Unknown sound type: ${soundType}`);
                alert('Sound type not implemented yet');
            }
        } catch (error) {
            console.error('Audio context error:', error);
            alert('Failed to create audio. Your browser may not support Web Audio API.');
        }
    }

    resetToDefaults() {
        if (confirm('Reset all settings to default? This cannot be undone.')) {
            localStorage.removeItem('pomodoroSettings');
            this.settings = this.loadSettings();
            this.loadSettingsToUI();
            this.updatePreview();
            console.log('Settings reset to defaults');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SettingsWindow();
});