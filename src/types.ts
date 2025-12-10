export type TimerMode = 'work' | 'break' | 'longBreak';

export type Task = {
  id: string;
  name: string;
  color: string;
  createdAt: number;
};

export type HistoryEntry = {
  id: string;
  taskId: string;
  taskName: string;
  mode: TimerMode;
  duration: number;
  completedAt: number;
};

export type Settings = {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
  tickSoundEnabled: boolean;
  openTabOnComplete: boolean;
  autoCloseTab: boolean;
  dailyGoal: number;
  weeklyGoal: number;
  monthlyGoal: number;
};
