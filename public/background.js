let timerState = {
  isRunning: false,
  mode: 'work',
  timeLeft: 25 * 60,
  sessions: 0,
  settings: {
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    soundEnabled: true,
    tickSoundEnabled: false
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

function handleTimerComplete() {
  timerState.isRunning = false;
  
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
  
  if (timerState.mode === 'work') {
    timerState.sessions++;
    if (timerState.sessions % 4 === 0) {
      timerState.mode = 'longBreak';
      timerState.timeLeft = timerState.settings.longBreakDuration * 60;
    } else {
      timerState.mode = 'break';
      timerState.timeLeft = timerState.settings.breakDuration * 60;
    }
  } else {
    timerState.mode = 'work';
    timerState.timeLeft = timerState.settings.workDuration * 60;
  }
  
  updateBadge();
  saveState();
}

function startTimer() {
  if (!intervalId) {
    intervalId = setInterval(tick, 1000);
  }
  timerState.isRunning = true;
  updateBadge();
  saveState();
}

function pauseTimer() {
  timerState.isRunning = false;
  updateBadge();
  saveState();
}

function resetTimer() {
  timerState.isRunning = false;
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

// Handle extension icon clicks
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
      // Single click - toggle timer
      if (timerState.isRunning) {
        pauseTimer();
      } else {
        startTimer();
      }
    } else if (clickCount === 2) {
      // Double click - reset
      resetTimer();
    } else if (clickCount >= 3) {
      // Triple click - open popup
      chrome.action.setPopup({ popup: 'popup.html' });
      chrome.action.openPopup().then(() => {
        // Reset popup setting after opening
        setTimeout(() => {
          chrome.action.setPopup({ popup: '' });
        }, 100);
      });
    }
    clickCount = 0;
  }, 250);
});
