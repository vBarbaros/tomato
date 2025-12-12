let state = null;
let tasks = [];
let currentTaskId = null;
let hasStarted = false;
let currentView = 'timer';

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

function showView(viewName) {
  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  
  // Remove active from all nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected view
  document.getElementById(viewName + 'View').classList.add('active');
  document.getElementById(viewName + 'Nav').classList.add('active');
  
  currentView = viewName;
  
  // Only load content when switching TO that specific view
  if (viewName === 'calendar') {
    loadHeatmap();
  } else if (viewName === 'settings') {
    loadSettings();
  }
}

function loadTasks() {
  const stored = localStorage.getItem('pomodoro_tasks');
  tasks = stored ? JSON.parse(stored) : [];
  
  const storedTaskId = localStorage.getItem('pomodoro_current_task');
  currentTaskId = storedTaskId;
  
  const select = document.getElementById('taskSelect');
  select.innerHTML = '<option value="">Generic</option>';
  
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

function loadHeatmap() {
  const history = JSON.parse(localStorage.getItem('pomodoro_history') || '[]');
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Get days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  
  // Count sessions per day
  const dailyCounts = {};
  history.forEach(entry => {
    const entryDate = new Date(entry.completedAt);
    if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
      const day = entryDate.getDate();
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    }
  });
  
  // Color function matching main app
  const getIntensityColor = (count) => {
    if (count === 0) return '#ebedf0';
    if (count <= 2) return '#c6e48b';
    if (count <= 4) return '#7bc96f';
    if (count <= 6) return '#239a3b';
    return '#196127';
  };
  
  // Month name
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // Generate calendar HTML with larger sizing
  let html = `
    <h3 style="margin: 0 0 20px 0; font-size: 16px; text-align: center;">${monthName}</h3>
    <div style="display: flex; gap: 0; justify-content: center;">
      <div style="display: flex; flex-direction: column; width: 24px; margin-right: 4px;">
        <div style="height: 14px;"></div>
        <div style="height: 12px; margin-bottom: 4px; font-size: 11px; display: flex; align-items: center;">M</div>
        <div style="height: 12px; margin-bottom: 4px;"></div>
        <div style="height: 12px; margin-bottom: 4px; font-size: 11px; display: flex; align-items: center;">W</div>
        <div style="height: 12px; margin-bottom: 4px;"></div>
        <div style="height: 12px; margin-bottom: 4px; font-size: 11px; display: flex; align-items: center;">F</div>
        <div style="height: 12px; margin-bottom: 4px;"></div>
      </div>
      <div style="display: flex; gap: 4px;">
  `;
  
  // Calculate weeks
  const totalCells = firstDay + daysInMonth;
  const weeks = Math.ceil(totalCells / 7);
  
  for (let week = 0; week < weeks; week++) {
    html += `<div style="display: flex; flex-direction: column; gap: 4px;">`;
    
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const cellIndex = week * 7 + dayOfWeek;
      const day = cellIndex - firstDay + 1;
      
      if (cellIndex < firstDay || day > daysInMonth) {
        // Empty cell
        html += `<div style="width: 12px; height: 12px;"></div>`;
      } else {
        // Day cell
        const count = dailyCounts[day] || 0;
        const color = getIntensityColor(count);
        const isToday = day === now.getDate();
        
        html += `<div style="
          width: 12px; 
          height: 12px; 
          background-color: ${color}; 
          border-radius: 2px;
          ${isToday ? 'outline: 2px solid #333; outline-offset: 1px;' : ''}
        " title="${day}/${currentMonth + 1}: ${count} sessions"></div>`;
      }
    }
    
    html += `</div>`;
  }
  
  html += `
      </div>
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 20px; font-size: 11px;">
      <span>Less</span>
      <div style="width: 10px; height: 10px; background-color: #ebedf0; border-radius: 2px;"></div>
      <div style="width: 10px; height: 10px; background-color: #c6e48b; border-radius: 2px;"></div>
      <div style="width: 10px; height: 10px; background-color: #7bc96f; border-radius: 2px;"></div>
      <div style="width: 10px; height: 10px; background-color: #239a3b; border-radius: 2px;"></div>
      <div style="width: 10px; height: 10px; background-color: #196127; border-radius: 2px;"></div>
      <span>More</span>
    </div>
  `;
  
  document.getElementById('heatmapContainer').innerHTML = html;
}

function loadSettings() {
  // First try to get settings from background worker, then fallback to localStorage
  chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
    let settings = {};
    
    if (response && response.settings) {
      settings = response.settings;
    } else {
      settings = JSON.parse(localStorage.getItem('pomodoro_settings') || '{}');
    }
    
    document.getElementById('soundEnabled').checked = settings.soundEnabled !== false;
    document.getElementById('tickSoundEnabled').checked = settings.tickSoundEnabled === true;
    document.getElementById('workDuration').value = settings.workDuration || 25;
    document.getElementById('breakDuration').value = settings.breakDuration || 5;
    document.getElementById('longBreakDuration').value = settings.longBreakDuration || 15;
  });
}

function saveSettings() {
  const settings = {
    soundEnabled: document.getElementById('soundEnabled').checked,
    tickSoundEnabled: document.getElementById('tickSoundEnabled').checked,
    workDuration: parseInt(document.getElementById('workDuration').value),
    breakDuration: parseInt(document.getElementById('breakDuration').value),
    longBreakDuration: parseInt(document.getElementById('longBreakDuration').value)
  };
  
  // Save to localStorage
  localStorage.setItem('pomodoro_settings', JSON.stringify(settings));
  
  // Sync with background worker
  chrome.runtime.sendMessage({ action: 'updateSettings', settings }, (response) => {
    console.log('Settings updated in background worker');
  });
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

// Navigation event listeners
document.getElementById('timerNav').addEventListener('click', () => showView('timer'));
document.getElementById('calendarNav').addEventListener('click', () => showView('calendar'));
document.getElementById('settingsNav').addEventListener('click', () => showView('settings'));

// Settings event listeners
document.getElementById('soundEnabled').addEventListener('change', saveSettings);
document.getElementById('tickSoundEnabled').addEventListener('change', saveSettings);
document.getElementById('workDuration').addEventListener('change', saveSettings);
document.getElementById('breakDuration').addEventListener('change', saveSettings);
document.getElementById('longBreakDuration').addEventListener('change', saveSettings);

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
showView('timer'); // Start with timer view
// Update every second
setInterval(getState, 1000);

