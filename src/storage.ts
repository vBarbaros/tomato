import type { Task, HistoryEntry, Settings } from './types';

const STORAGE_KEYS = {
  TASKS: 'pomodoro_tasks',
  HISTORY: 'pomodoro_history',
  SETTINGS: 'pomodoro_settings',
  CURRENT_TASK: 'pomodoro_current_task'
};

export const storage = {
  getTasks: (): Task[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    return data ? JSON.parse(data) : [];
  },

  saveTasks: (tasks: Task[]) => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  getHistory: (): HistoryEntry[] => {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  },

  saveHistory: (history: HistoryEntry[]) => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
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
      tickSoundEnabled: false
    };
  },

  saveSettings: (settings: Settings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getCurrentTask: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_TASK);
  },

  setCurrentTask: (taskId: string | null) => {
    if (taskId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_TASK, taskId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_TASK);
    }
  }
};
