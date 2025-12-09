import { useState, useEffect, useRef, useCallback } from 'react';
import type { TimerMode, Task, HistoryEntry, Settings as SettingsType } from './types';
import { storage } from './storage';
import { playSound } from './audio';
import Tasks from './Tasks';
import History from './History';
import Settings from './Settings';
import quotes from './assets/quotes.json';
import './App.css';

type View = 'timer' | 'tasks' | 'history' | 'settings';

function App() {
  const [view, setView] = useState<View>('timer');
  const [mode, setMode] = useState<TimerMode>('work');
  const [settings, setSettings] = useState<SettingsType>(storage.getSettings());
  const [timeLeft, setTimeLeft] = useState(() => settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [tasks, setTasks] = useState<Task[]>(storage.getTasks());
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(storage.getCurrentTask());
  const [history, setHistory] = useState<HistoryEntry[]>(storage.getHistory());
  const [currentQuote, setCurrentQuote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);
  const [hasStarted, setHasStarted] = useState(false); // Track if timer was ever started
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const isExtension = useRef(false);

  // Detect if running as extension
  useEffect(() => {
    isExtension.current = typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
    
    // Check if opened from context menu with target view
    if (isExtension.current) {
      chrome.storage.local.get(['targetView'], (result: { targetView?: string }) => {
        if (result.targetView) {
          setView(result.targetView as View);
          chrome.storage.local.remove('targetView');
        }
      });
      
      // Listen for storage changes to update history
      const handleStorageChange = (changes: { [key: string]: { oldValue?: string; newValue?: string } }, areaName: string) => {
        if (areaName === 'local') {
          if (changes.pomodoro_history && changes.pomodoro_history.newValue) {
            localStorage.setItem('pomodoro_history', changes.pomodoro_history.newValue);
            setHistory(JSON.parse(changes.pomodoro_history.newValue));
          }
          if (changes.pomodoro_tasks && changes.pomodoro_tasks.newValue) {
            localStorage.setItem('pomodoro_tasks', changes.pomodoro_tasks.newValue);
            setTasks(JSON.parse(changes.pomodoro_tasks.newValue));
          }
        }
      };
      
      chrome.storage.onChanged.addListener(handleStorageChange);
      
      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }
  }, []);

  // Sync with background service worker if running as extension
  useEffect(() => {
    if (isExtension.current) {
      chrome.runtime.sendMessage({ action: 'getState' }, (response: { mode: TimerMode; timeLeft: number; isRunning: boolean; sessions: number; settings: SettingsType } | undefined) => {
        if (response) {
          setMode(response.mode);
          setTimeLeft(response.timeLeft);
          setIsRunning(response.isRunning);
          setSessions(response.sessions);
          setHasStarted(response.timeLeft < response.settings.workDuration * 60);
          if (response.settings) {
            setSettings(response.settings);
          }
        }
      });

      // Keep syncing every second
      const syncInterval = setInterval(() => {
        chrome.runtime.sendMessage({ action: 'getState' }, (response: { mode: TimerMode; timeLeft: number; isRunning: boolean; sessions: number; settings: SettingsType } | undefined) => {
          if (response) {
            setMode(response.mode);
            setTimeLeft(response.timeLeft);
            setIsRunning(response.isRunning);
            setSessions(response.sessions);
            setHasStarted(response.timeLeft < response.settings.workDuration * 60);
          }
        });
      }, 1000);

      return () => clearInterval(syncInterval);
    }
  }, []);

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setCurrentQuote(quotes[randomIndex]);
  };

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    getRandomQuote();
    
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    startTimeRef.current = 0;

    // Play completion sound
    if (settings.soundEnabled) {
      if (mode === 'work') {
        playSound.workComplete();
      } else {
        playSound.breakComplete();
      }
    }

    if (mode === 'work') {
      const task = tasks.find(t => t.id === currentTaskId);
      const entry: HistoryEntry = {
        id: Date.now().toString(),
        taskId: currentTaskId || 'none',
        taskName: task?.name || 'No Task',
        mode,
        duration,
        completedAt: Date.now()
      };
      storage.addHistoryEntry(entry);
      setHistory(storage.getHistory());

      const newSessions = sessions + 1;
      setSessions(newSessions);
      
      if (newSessions % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(settings.longBreakDuration * 60);
        if (settings.autoStartBreaks) setIsRunning(true);
      } else {
        setMode('break');
        setTimeLeft(settings.breakDuration * 60);
        if (settings.autoStartBreaks) setIsRunning(true);
      }
    } else {
      setMode('work');
      setTimeLeft(settings.workDuration * 60);
      if (settings.autoStartWork) setIsRunning(true);
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Timer', {
        body: mode === 'work' ? 'Time for a break!' : 'Time to work!',
      });
    }
  }, [mode, tasks, currentTaskId, sessions, settings]);

  useEffect(() => {
    // Don't run local timer if we're syncing with background worker
    if (isExtension.current) return;
    
    if (isRunning && timeLeft > 0) {
      if (startTimeRef.current === 0) {
        startTimeRef.current = Date.now();
      }
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
        if (settings.tickSoundEnabled) {
          playSound.tick();
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, settings.tickSoundEnabled]);

  useEffect(() => {
    // Don't handle completion locally if we're syncing with background worker
    if (isExtension.current) return;
    
    if (timeLeft === 0 && startTimeRef.current !== 0) {
      queueMicrotask(() => handleTimerComplete());
    }
  }, [timeLeft, handleTimerComplete]);

  const toggleTimer = () => {
    if (isExtension.current) {
      const action = isRunning ? 'pause' : 'start';
      chrome.runtime.sendMessage({ action });
      if (!hasStarted) setHasStarted(true);
    } else {
      if (!isRunning && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      setIsRunning(!isRunning);
      if (!hasStarted) setHasStarted(true);
    }
  };

  const resetTimer = () => {
    if (isExtension.current) {
      chrome.runtime.sendMessage({ action: 'reset' });
      setHasStarted(false);
    } else {
      setIsRunning(false);
      startTimeRef.current = 0;
      const durations = {
        work: settings.workDuration * 60,
        break: settings.breakDuration * 60,
        longBreak: settings.longBreakDuration * 60
      };
      setTimeLeft(durations[mode]);
      setHasStarted(false);
    }
  };

  const switchMode = (newMode: TimerMode) => {
    if (isExtension.current) {
      chrome.runtime.sendMessage({ action: 'switchMode', mode: newMode });
    } else {
      setMode(newMode);
      const durations = {
        work: settings.workDuration * 60,
        break: settings.breakDuration * 60,
        longBreak: settings.longBreakDuration * 60
      };
      setTimeLeft(durations[newMode]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddTask = (name: string, color: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      name,
      color,
      createdAt: Date.now()
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    storage.saveTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    storage.saveTasks(updated);
    if (currentTaskId === id) {
      setCurrentTaskId(null);
      storage.setCurrentTask(null);
    }
  };

  const handleSelectTask = (id: string | null) => {
    setCurrentTaskId(id);
    storage.setCurrentTask(id);
  };

  const handleSaveSettings = (newSettings: SettingsType) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
    
    // Sync with background worker if running as extension
    if (isExtension.current) {
      chrome.runtime.sendMessage({ action: 'updateSettings', settings: newSettings });
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>
            <span className="tomato-tiny">🍅</span>
            <span className="tomato-small">🍅</span>
            <span className="tomato-medium">🍅</span>
            <span className="tomato-large">🍅</span>
            <span className="tomato-medium">🍅</span>
            <span className="tomato-small">🍅</span>
            <span className="tomato-tiny">🍅</span>
          </h1>
        </div>
      </header>

      <div className="quotes-bar">
        <div className="quote-content">
          <span className="quote-text">"{currentQuote.text}"</span>
          <span className="quote-author">— {currentQuote.author}</span>
        </div>
      </div>

      <nav className="main-nav">
        <button onClick={() => setView('timer')} className={view === 'timer' ? 'active' : ''}>
          Timer
        </button>
        <button onClick={() => setView('tasks')} className={view === 'tasks' ? 'active' : ''}>
          Tasks
        </button>
        <button onClick={() => setView('history')} className={view === 'history' ? 'active' : ''}>
          History
        </button>
        <button onClick={() => setView('settings')} className={view === 'settings' ? 'active' : ''}>
          Settings
        </button>
      </nav>

      <div className="view-container">
        {view === 'timer' && (
          <div className="timer-view">
            <h2>Timer</h2>

          <div className="controls">
            <button onClick={toggleTimer} className="control-btn primary">
              {isRunning ? '⏸' : '▶'}
            </button>
            <button onClick={resetTimer} className="control-btn">↻</button>
          </div>

          <div className="timer">
            {formatTime(timeLeft)}
          </div>

          <div className="task-selector">
            <select 
              value={currentTaskId || ''} 
              onChange={(e) => handleSelectTask(e.target.value || null)}
            >
              <option value="">No Task</option>
              {tasks.map(task => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mode-buttons">
            <button 
              className={mode === 'work' ? 'active' : ''} 
              onClick={() => switchMode('work')}
              title="Work"
            >
              💼
            </button>
            <button 
              className={mode === 'break' ? 'active' : ''} 
              onClick={() => switchMode('break')}
              title="Break"
            >
              ☕
            </button>
          </div>

          <div className="sessions">
            Sessions completed: {sessions}
          </div>
        </div>
      )}

      {view === 'tasks' && (
        <Tasks
          tasks={tasks}
          currentTaskId={currentTaskId}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          onSelectTask={handleSelectTask}
        />
      )}

      {view === 'history' && (
        <History history={history} tasks={tasks} />
      )}

      {view === 'settings' && (
        <Settings settings={settings} onSave={handleSaveSettings} />
      )}
      </div>
    </div>
  );
}

export default App;
