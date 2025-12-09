let state = null;
let tasks = [];
let currentTaskId = null;
let hasStarted = false;

const quotes = [
  "Focus on being productive instead of busy.",
  "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
  "You don't have to be great to start, but you have to start to be great.",
  "The secret of getting ahead is getting started.",
  "Don't watch the clock; do what it does. Keep going."
];

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function loadTasks() {
  const stored = localStorage.getItem('pomodoro_tasks');
  tasks = stored ? JSON.parse(stored) : [];
  
  const storedTaskId = localStorage.getItem('pomodoro_current_task');
  currentTaskId = storedTaskId;
  
  const select = document.getElementById('taskSelect');
  select.innerHTML = '<option value="">No Task</option>';
  
  tasks.forEach(task => {
    const option = document.createElement('option');
    option.value = task.id;
    option.textContent = task.name;
    if (task.id === currentTaskId) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function loadQuote() {
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  document.getElementById('quote').textContent = randomQuote;
}

function updateUI() {
  if (!state) return;
  
  document.getElementById('timer').textContent = formatTime(state.timeLeft);
  
  // Update mode buttons
  document.getElementById('workBtn').classList.toggle('active', state.mode === 'work');
  document.getElementById('breakBtn').classList.toggle('active', state.mode === 'break' || state.mode === 'longBreak');
  
  // Check if timer has been started
  const defaultTime = state.settings.workDuration * 60;
  hasStarted = state.timeLeft < defaultTime || state.isRunning;
  
  // Update start button
  document.getElementById('startBtn').textContent = state.isRunning ? '⏸' : '▶';
}

function getState() {
  chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
    state = response;
    updateUI();
  });
}

document.getElementById('taskSelect').addEventListener('change', (e) => {
  currentTaskId = e.target.value || null;
  localStorage.setItem('pomodoro_current_task', currentTaskId || '');
});

document.getElementById('startBtn').addEventListener('click', () => {
  const action = state.isRunning ? 'pause' : 'start';
  chrome.runtime.sendMessage({ action }, (response) => {
    state = response;
    updateUI();
  });
});

document.getElementById('resetBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'reset' }, (response) => {
    state = response;
    hasStarted = false;
    updateUI();
  });
});

document.getElementById('workBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'switchMode', mode: 'work' }, (response) => {
    state = response;
    hasStarted = false;
    updateUI();
  });
});

document.getElementById('breakBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'switchMode', mode: 'break' }, (response) => {
    state = response;
    hasStarted = false;
    updateUI();
  });
});

document.getElementById('fullPageLink').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

// Initialize
loadTasks();
loadQuote();
getState();
// Update every second
setInterval(getState, 1000);

