let timerState = {
  isRunning: false,
  mode: 'work',
  timeLeft: 25 * 60,
  sessions: 0,
  settings: {
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    autoStartBreaks: false,
    autoStartWork: false,
    soundEnabled: true,
    tickSoundEnabled: false,
    openTabOnComplete: true,
    autoCloseTab: false
  }
};

let intervalId = null;

// Load state from storage on startup
chrome.storage.local.get(['timerState'], (result) => {
  if (result.timerState) {
    timerState = result.timerState;
  }
  // Also load settings from localStorage if available
  chrome.storage.local.get(['pomodoro_settings'], (settingsResult) => {
    if (settingsResult.pomodoro_settings) {
      timerState.settings = JSON.parse(settingsResult.pomodoro_settings);
    }
  });
});

function saveState() {
  chrome.storage.local.set({ timerState });
}

function updateBadge() {
  if (timerState.isRunning) {
    const minutes = Math.floor(timerState.timeLeft / 60);
    const seconds = timerState.timeLeft % 60;
    const text = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#d95550' });
    chrome.action.setBadgeTextColor({ color: '#ffffff' });
  } else if (timerState.timeLeft < timerState.settings.workDuration * 60) {
    // Show pause symbol if timer was started but is now paused
    chrome.action.setBadgeText({ text: '||' });
    chrome.action.setBadgeBackgroundColor({ color: '#d95550' });
    chrome.action.setBadgeTextColor({ color: '#ffffff' });
  } else {
    // Clear badge when reset
    chrome.action.setBadgeText({ text: '' });
  }
}

function tick() {
  if (timerState.isRunning && timerState.timeLeft > 0) {
    timerState.timeLeft--;
    updateBadge();
    saveState();

    // Play tick sound if enabled
    if (timerState.settings.tickSoundEnabled) {
      playSound('tick');
    }

    if (timerState.timeLeft === 0) {
      handleTimerComplete();
    }
  }
}

async function playSound(soundType) {
  try {
    // Check if offscreen document exists
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });

    if (existingContexts.length === 0) {
      // Create offscreen document
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'Play timer completion sound'
      });
    }

    // Send message to play sound
    chrome.runtime.sendMessage({
      action: 'playSound',
      soundType: soundType
    });
  } catch (error) {
    console.error('Error playing sound:', error);
  }
}

function handleTabManagement() {
  if (!timerState.settings.openTabOnComplete) return;
  
  // Don't open tab if auto-start is enabled
  if ((timerState.mode === 'break' && timerState.settings.autoStartBreaks) || 
      (timerState.mode === 'longBreak' && timerState.settings.autoStartBreaks) ||
      (timerState.mode === 'work' && timerState.settings.autoStartWork)) {
    return;
  }

  // Check if timer tab already exists
  chrome.tabs.query({ url: chrome.runtime.getURL('index.html') }, (tabs) => {
    if (tabs.length > 0) {
      // Focus existing tab
      chrome.tabs.update(tabs[0].id, { active: true });
      chrome.windows.update(tabs[0].windowId, { focused: true });
    } else {
      // Create new tab with cycle completion flag
      chrome.tabs.create({ 
        url: chrome.runtime.getURL('index.html?cycleComplete=true'),
        active: true 
      });
    }
  });
}

function handleTimerComplete() {
  timerState.isRunning = false;
  
  console.log('Timer complete! Mode:', timerState.mode);

  // Play sound if enabled
  if (timerState.settings.soundEnabled) {
    playSound(timerState.mode === 'work' ? 'workComplete' : 'breakComplete');
  }

  // Show notification
  chrome.notifications.create('pomodoro-complete', {
    type: 'basic',
    iconUrl: 'icon128.png',
    title: 'Tomato Timer',
    message: timerState.mode === 'work' ? 'Time for a break!' : 'Time to work!',
    priority: 2,
    requireInteraction: true,
    silent: true
  });

  // Save history entry for completed work sessions
  if (timerState.mode === 'work') {
    console.log('Saving work session to history...');
    chrome.storage.local.get(['pomodoro_current_task', 'pomodoro_tasks', 'pomodoro_history'], (result) => {
      const currentTaskId = result.pomodoro_current_task || null;
      const tasks = result.pomodoro_tasks ? JSON.parse(result.pomodoro_tasks) : [];
      const history = result.pomodoro_history ? JSON.parse(result.pomodoro_history) : [];
      
      console.log('Current task:', currentTaskId);
      console.log('Existing history entries:', history.length);
      
      const task = tasks.find(t => t.id === currentTaskId);
      const entry = {
        id: Date.now().toString(),
        taskId: currentTaskId || 'none',
        taskName: task?.name || 'Generic',
        mode: 'work',
        duration: timerState.settings.workDuration * 60,
        completedAt: Date.now()
      };
      
      console.log('New history entry:', entry);
      
      history.unshift(entry);
      chrome.storage.local.set({ pomodoro_history: JSON.stringify(history) }, () => {
        console.log('History saved! Total entries:', history.length);
      });
    });
  }

  if (timerState.mode === 'work') {
    timerState.sessions++;
    if (timerState.sessions % 4 === 0) {
      timerState.mode = 'longBreak';
      timerState.timeLeft = timerState.settings.longBreakDuration * 60;
      if (timerState.settings.autoStartBreaks) {
        timerState.isRunning = true;
      }
    } else {
      timerState.mode = 'break';
      timerState.timeLeft = timerState.settings.breakDuration * 60;
      if (timerState.settings.autoStartBreaks) {
        timerState.isRunning = true;
      }
    }
  } else {
    timerState.mode = 'work';
    timerState.timeLeft = timerState.settings.workDuration * 60;
    if (timerState.settings.autoStartWork) {
      timerState.isRunning = true;
    }
  }

  // Handle tab management
  handleTabManagement();

  updateBadge();
  saveState();
}

function startTimer() {
  timerState.isRunning = true;
  updateBadge(); // Update badge immediately
  saveState();
  if (!intervalId) {
    intervalId = setInterval(tick, 1000);
  }
}

function pauseTimer() {
  timerState.isRunning = false;
  updateBadge();
  saveState();
}

function resetTimer() {
  timerState.isRunning = false;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  const durations = {
    work: timerState.settings.workDuration * 60,
    break: timerState.settings.breakDuration * 60,
    longBreak: timerState.settings.longBreakDuration * 60
  };
  timerState.timeLeft = durations[timerState.mode];
  updateBadge();
  saveState();
}

function switchMode(mode) {
  timerState.mode = mode;
  timerState.isRunning = false;
  const durations = {
    work: timerState.settings.workDuration * 60,
    break: timerState.settings.breakDuration * 60,
    longBreak: timerState.settings.longBreakDuration * 60
  };
  timerState.timeLeft = durations[mode];
  updateBadge();
  saveState();
}

// Listen for messages from popup/page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getState':
      sendResponse(timerState);
      break;
    case 'start':
      startTimer();
      sendResponse(timerState);
      break;
    case 'pause':
      pauseTimer();
      sendResponse(timerState);
      break;
    case 'reset':
      resetTimer();
      sendResponse(timerState);
      break;
    case 'switchMode':
      switchMode(request.mode);
      sendResponse(timerState);
      break;
    case 'updateSettings':
      timerState.settings = request.settings;
      saveState();
      sendResponse(timerState);
      break;
  }
  return true;
});

// Initialize badge on startup
updateBadge();

// Create context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'open-app',
    title: 'Tomato Timer: Focus on Your Life',
    contexts: ['action', 'page', 'selection', 'link', 'image', 'video', 'audio']
  });

  chrome.contextMenus.create({
    id: 'separator-1',
    type: 'separator',
    contexts: ['action']
  });

  chrome.contextMenus.create({
    id: 'resume',
    title: 'Resume',
    contexts: ['action']
  });

  chrome.contextMenus.create({
    id: 'start',
    title: 'Start',
    contexts: ['action']
  });

  chrome.contextMenus.create({
    id: 'stop',
    title: 'Stop',
    contexts: ['action']
  });

  chrome.contextMenus.create({
    id: 'reset',
    title: 'Reset Tomato Timer',
    contexts: ['action']
  });

  chrome.contextMenus.create({
    id: 'separator-2',
    type: 'separator',
    contexts: ['action']
  });

  chrome.contextMenus.create({
    id: 'tasks',
    title: 'Tomato Timer Tasks',
    contexts: ['action']
  });

  chrome.contextMenus.create({
    id: 'history',
    title: 'History',
    contexts: ['action']
  });

  chrome.contextMenus.create({
    id: 'settings',
    title: 'Settings',
    contexts: ['action']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info) => {
  switch (info.menuItemId) {
    case 'open-app':
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
      break;
    case 'resume':
    case 'start':
      startTimer();
      break;
    case 'stop':
      pauseTimer();
      break;
    case 'reset':
      resetTimer();
      break;
    case 'tasks':
    case 'history':
    case 'settings':
      // Open popup and navigate to the view
      chrome.storage.local.set({ targetView: info.menuItemId }, () => {
        chrome.action.openPopup();
      });
      break;
  }
});

// Handle extension icon clicks
// Delays: Single click: 250ms, Double click: 250ms, Triple click: 250ms
let clickTimeout = null;
let clickCount = 0;

chrome.action.onClicked.addListener(() => {
  clickCount++;

  // Clear existing timeout
  if (clickTimeout) {
    clearTimeout(clickTimeout);
  }

  // Wait for potential multiple clicks
  clickTimeout = setTimeout(() => {
    if (clickCount === 1) {
      // Single click - toggle timer (150ms delay)
      if (timerState.isRunning) {
        pauseTimer();
      } else {
        // Provide immediate visual feedback before starting
        chrome.action.setBadgeText({ text: '...' });
        chrome.action.setBadgeBackgroundColor({ color: '#d95550' });
        startTimer();
      }
    } else if (clickCount === 2) {
      // Double click - reset (150ms delay)
      chrome.action.setBadgeText({ text: 'RST' });
      chrome.action.setBadgeBackgroundColor({ color: '#6c757d' });
      resetTimer();
    } else if (clickCount >= 3) {
      // Triple click - open popup (150ms delay)
      chrome.action.setPopup({ popup: 'popup.html' });
      chrome.action.openPopup().then(() => {
        // Reset popup setting after opening
        setTimeout(() => {
          chrome.action.setPopup({ popup: '' });
        }, 100);
      });
    }
    clickCount = 0;
  }, 250); // Increased back to 250ms for better multi-click detection
});
