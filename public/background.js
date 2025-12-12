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
    autoCloseTab: true
  }
};

let intervalId = null;
let isInitialized = false;

// Keep service worker alive with periodic alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    // Just update badge to keep worker active
    updateBadge();
  }
});

// Initialize state immediately on startup
const initializeState = () => {
  if (isInitialized) return;
  
  // Create keepAlive alarm - less frequent to reduce load
  chrome.alarms.create('keepAlive', { periodInMinutes: 2 }); // Every 2 minutes
  
  chrome.storage.local.get(['timerState', 'pomodoro_settings'], (result) => {
    if (result.timerState) {
      timerState = { ...timerState, ...result.timerState };
    }
    if (result.pomodoro_settings) {
      try {
        timerState.settings = { ...timerState.settings, ...JSON.parse(result.pomodoro_settings) };
      } catch (e) {
        console.warn('Failed to parse settings:', e);
      }
    }
    
    // Always reset to fresh state on startup
    timerState.isRunning = false;
    const durations = {
      work: timerState.settings.workDuration * 60,
      break: timerState.settings.breakDuration * 60,
      longBreak: timerState.settings.longBreakDuration * 60
    };
    timerState.timeLeft = durations[timerState.mode];
    
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    
    updateBadge();
    saveState();
    isInitialized = true;
  });
};

// Initialize immediately
initializeState();

// Also initialize on extension startup
chrome.runtime.onStartup.addListener(initializeState);
chrome.runtime.onInstalled.addListener(initializeState);

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
  } else {
    const durations = {
      work: timerState.settings.workDuration * 60,
      break: timerState.settings.breakDuration * 60,
      longBreak: timerState.settings.longBreakDuration * 60
    };
    
    if (timerState.timeLeft < durations[timerState.mode]) {
      // Show pause symbol if timer was started but is now paused
      chrome.action.setBadgeText({ text: '||' });
      chrome.action.setBadgeBackgroundColor({ color: '#d95550' });
      chrome.action.setBadgeTextColor({ color: '#ffffff' });
    } else {
      // Clear badge when reset or at full duration
      chrome.action.setBadgeText({ text: '' });
    }
  }
}

function tick() {
  if (timerState.isRunning && timerState.timeLeft > 0) {
    timerState.timeLeft--;
    
    // Update badge every second when running
    updateBadge();
    
    // Only save state every 10 seconds to reduce I/O
    if (timerState.timeLeft % 10 === 0) {
      saveState();
    }

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
  updateBadge(); // Update badge immediately
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
  updateBadge(); // Update badge immediately
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
  // Ensure state is initialized before handling messages
  if (!isInitialized) {
    initializeState();
  }
  
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

// Handle extension icon clicks with timing-based approach
let lastClickTime = 0;
let clickTimeout = null;
let isProcessing = false;

chrome.action.onClicked.addListener(() => {
  if (isProcessing) return;
  
  const now = Date.now();
  const timeSinceLastClick = now - lastClickTime;
  
  // Clear any existing timeout
  if (clickTimeout) {
    clearTimeout(clickTimeout);
    clickTimeout = null;
  }
  
  // If this is a quick second click (double-click)
  if (timeSinceLastClick < 400 && lastClickTime > 0) {
    isProcessing = true;
    
    // Double click - toggle timer
    if (timerState.isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
    
    lastClickTime = 0; // Reset to prevent triple-click issues
    isProcessing = false;
    return;
  }
  
  // This might be a single click - wait to see if another click comes
  lastClickTime = now;
  clickTimeout = setTimeout(() => {
    // Single click - open popup
    isProcessing = true;
    chrome.action.setPopup({ popup: 'popup.html' });
    chrome.action.openPopup().then(() => {
      setTimeout(() => {
        chrome.action.setPopup({ popup: '' });
        isProcessing = false;
      }, 200);
    }).catch(() => {
      isProcessing = false;
    });
    lastClickTime = 0;
  }, 400);
});
