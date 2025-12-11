import type { Task, HistoryEntry, Settings } from './types';

const STORAGE_KEYS = {
  TASKS: 'pomodoro_tasks',
  HISTORY: 'pomodoro_history',
  SETTINGS: 'pomodoro_settings',
  CURRENT_TASK: 'pomodoro_current_task'
};

const isExtension = typeof chrome !== 'undefined' && chrome.storage;

// Sync chrome.storage to localStorage on load
if (isExtension) {
  chrome.storage.local.get([STORAGE_KEYS.TASKS, STORAGE_KEYS.HISTORY, STORAGE_KEYS.SETTINGS, STORAGE_KEYS.CURRENT_TASK], (result: { [key: string]: string }) => {
    Object.keys(result).forEach(key => {
      if (result[key]) {
        localStorage.setItem(key, result[key]);
      }
    });
  });
}

export const storage = {
  getTasks: (): Task[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    return data ? JSON.parse(data) : [];
  },

  saveTasks: (tasks: Task[]) => {
    const data = JSON.stringify(tasks);
    localStorage.setItem(STORAGE_KEYS.TASKS, data);
    if (isExtension) {
      chrome.storage.local.set({ [STORAGE_KEYS.TASKS]: data });
    }
  },

  getHistory: (): HistoryEntry[] => {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  },

  saveHistory: (history: HistoryEntry[]) => {
    const data = JSON.stringify(history);
    localStorage.setItem(STORAGE_KEYS.HISTORY, data);
    if (isExtension) {
      chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: data });
    }
  },

  addHistoryEntry: (entry: HistoryEntry) => {
    const history = storage.getHistory();
    history.unshift(entry);
    storage.saveHistory(history);
  },

  getSettings: (): Settings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {
      workDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      autoStartBreaks: false,
      autoStartWork: false,
      soundEnabled: true,
      tickSoundEnabled: false,
      openTabOnComplete: true,
      autoCloseTab: true,
      dailyGoal: 4,
      weeklyGoal: 20,
      monthlyGoal: 80
    };
  },

  saveSettings: (settings: Settings) => {
    const data = JSON.stringify(settings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, data);
    if (isExtension) {
      chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: data });
    }
  },

  getCurrentTask: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_TASK);
  },

  setCurrentTask: (taskId: string | null) => {
    if (taskId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_TASK, taskId);
      if (isExtension) {
        chrome.storage.local.set({ [STORAGE_KEYS.CURRENT_TASK]: taskId });
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_TASK);
      if (isExtension) {
        chrome.storage.local.remove(STORAGE_KEYS.CURRENT_TASK);
      }
    }
  }
};
