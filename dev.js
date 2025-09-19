const { spawn } = require('child_process');
const chokidar = require('chokidar');

let electronProcess = null;

function startElectron() {
  if (electronProcess) {
    electronProcess.kill('SIGTERM');
    electronProcess = null;
  }

  electronProcess = spawn('npm', ['run', 'start'], {
    stdio: 'inherit',
    shell: true
  });

  electronProcess.on('close', () => {
    electronProcess = null;
  });
}

function setupWatcher() {
  console.log('👀 Watching for file changes...');

  const watcher = chokidar.watch([
    'main.js',
    'renderer.js',
    'index.html',
    'styles.css'
  ], {
    ignored: /node_modules/,
    persistent: true
  });

  let debounceTimer = null;

  watcher.on('change', (path) => {
    console.log(`📝 File changed: ${path}`);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      console.log('🔄 Restarting...');
      startElectron();
    }, 1000);
  });
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  if (electronProcess) {
    electronProcess.kill('SIGTERM');
  }
  process.exit(0);
});

console.log('🔧 Starting development mode...');
startElectron();
setupWatcher();