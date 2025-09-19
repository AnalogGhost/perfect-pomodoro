const { ipcRenderer } = require('electron');

class HistoryWindow {
    constructor() {
        this.history = [];
        this.filteredHistory = [];

        this.initializeElements();
        this.bindEvents();
        this.loadHistory();
    }

    initializeElements() {
        this.historyList = document.getElementById('historyList');
        this.exportJsonBtn = document.getElementById('exportJsonBtn');
        this.exportCsvBtn = document.getElementById('exportCsvBtn');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.dateFilter = document.getElementById('dateFilter');
        this.nameFilter = document.getElementById('nameFilter');
        this.clearFiltersBtn = document.getElementById('clearFilters');

        // Stats elements
        this.totalSessions = document.getElementById('totalSessions');
        this.totalTime = document.getElementById('totalTime');
        this.avgSession = document.getElementById('avgSession');
        this.todaySessions = document.getElementById('todaySessions');
    }

    bindEvents() {
        this.exportJsonBtn.addEventListener('click', () => this.exportHistory('json'));
        this.exportCsvBtn.addEventListener('click', () => this.exportHistory('csv'));
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        this.refreshBtn.addEventListener('click', () => this.loadHistory());

        this.dateFilter.addEventListener('change', () => this.applyFilters());
        this.nameFilter.addEventListener('input', () => this.applyFilters());
        this.clearFiltersBtn.addEventListener('click', () => this.clearFilters());
    }

    loadHistory() {
        this.history = JSON.parse(localStorage.getItem('pomodoroHistory') || '[]');
        this.filteredHistory = [...this.history];
        this.updateStats();
        this.renderHistory();
    }

    updateStats() {
        const today = new Date().toDateString();
        const todaysSessions = this.history.filter(session =>
            new Date(session.startTime).toDateString() === today
        );

        const totalMinutes = this.history.reduce((sum, session) =>
            sum + Math.round(session.actualDuration / 60), 0
        );

        const totalHours = Math.floor(totalMinutes / 60);
        const avgMinutes = this.history.length > 0 ?
            Math.round(totalMinutes / this.history.length) : 0;

        this.totalSessions.textContent = this.history.length;
        this.totalTime.textContent = `${totalHours}h ${totalMinutes % 60}m`;
        this.avgSession.textContent = `${avgMinutes}min`;
        this.todaySessions.textContent = todaysSessions.length;
    }

    renderHistory() {
        if (this.filteredHistory.length === 0) {
            this.historyList.innerHTML = '<div class="no-history">No sessions match your filters</div>';
            return;
        }

        this.historyList.innerHTML = '';

        // Sort by most recent first
        const sortedHistory = this.filteredHistory
            .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

        sortedHistory.forEach(session => {
            const row = document.createElement('div');
            row.className = 'history-row';

            const startDate = new Date(session.startTime);
            const actualMinutes = Math.round(session.actualDuration / 60);
            const plannedMinutes = Math.round(session.plannedDuration / 60);

            row.innerHTML = `
                <div class="col-name">${session.name}</div>
                <div class="col-date">${startDate.toLocaleDateString()}</div>
                <div class="col-time">${startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                <div class="col-duration">${actualMinutes}min</div>
                <div class="col-planned">${plannedMinutes}min</div>
            `;

            this.historyList.appendChild(row);
        });
    }

    applyFilters() {
        const dateFilter = this.dateFilter.value;
        const nameFilter = this.nameFilter.value.toLowerCase().trim();

        this.filteredHistory = this.history.filter(session => {
            const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
            const sessionName = session.name.toLowerCase();

            const matchesDate = !dateFilter || sessionDate === dateFilter;
            const matchesName = !nameFilter || sessionName.includes(nameFilter);

            return matchesDate && matchesName;
        });

        this.renderHistory();
    }

    clearFilters() {
        this.dateFilter.value = '';
        this.nameFilter.value = '';
        this.filteredHistory = [...this.history];
        this.renderHistory();
    }

    exportHistory(format) {
        if (this.filteredHistory.length === 0) {
            alert('No session data to export');
            return;
        }

        const dataToExport = this.filteredHistory.length < this.history.length ?
            this.filteredHistory : this.history;

        let content, filename, mimeType;

        if (format === 'json') {
            content = JSON.stringify(dataToExport, null, 2);
            filename = `pomodoro-history-${new Date().toISOString().split('T')[0]}.json`;
            mimeType = 'application/json';
        } else if (format === 'csv') {
            const headers = ['Session Name', 'Start Time', 'End Time', 'Planned Duration (min)', 'Actual Duration (min)', 'Work Duration', 'Short Break', 'Long Break'];
            const csvRows = [headers.join(',')];

            dataToExport.forEach(session => {
                const row = [
                    `"${session.name}"`,
                    `"${new Date(session.startTime).toISOString()}"`,
                    `"${new Date(session.endTime).toISOString()}"`,
                    Math.round(session.plannedDuration / 60),
                    Math.round(session.actualDuration / 60),
                    session.workDuration,
                    session.shortBreak,
                    session.longBreak
                ];
                csvRows.push(row.join(','));
            });

            content = csvRows.join('\n');
            filename = `pomodoro-history-${new Date().toISOString().split('T')[0]}.csv`;
            mimeType = 'text/csv';
        }

        // Create download link
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`Exported ${dataToExport.length} sessions as ${format.toUpperCase()}`);
    }

    clearHistory() {
        if (confirm('Clear all session history? This cannot be undone.')) {
            localStorage.removeItem('pomodoroHistory');
            this.loadHistory();
            console.log('Session history cleared');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HistoryWindow();
});