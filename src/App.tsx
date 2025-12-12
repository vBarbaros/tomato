/// <reference types="chrome" />
import { useState, useEffect, useRef, useCallback } from 'react';
import type { TimerMode, Task, HistoryEntry, Settings as SettingsType } from './types';
import { storage } from './storage';
import { playSound } from './audio';
import Tasks from './Tasks';
import History from './History';
import Settings from './Settings';
import About from './About';
import CyclePrompt from './CyclePrompt';
import quotes from './assets/quotes.json';
import './App.css';

type View = 'timer' | 'tasks' | 'history' | 'settings' | 'about' | 'cyclePrompt';

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

    // Check if this is a new tab opened for cycle completion
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('cycleComplete') === 'true') {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => setView('cyclePrompt'), 0);
    }

    // Check if opened from context menu with target view
    if (isExtension.current) {
      chrome.storage.local.get(['targetView'], (result: { targetView?: string }) => {
        if (result.targetView) {
          setTimeout(() => setView(result.targetView as View), 0);
          chrome.storage.local.remove('targetView');
        }
      });

      // Listen for storage changes to update history
      const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: chrome.storage.AreaName) => {
        if (areaName === 'local') {
          if (changes.pomodoro_history && changes.pomodoro_history.newValue) {
            localStorage.setItem('pomodoro_history', changes.pomodoro_history.newValue as string);
            setHistory(JSON.parse(changes.pomodoro_history.newValue as string));
          }
          if (changes.pomodoro_tasks && changes.pomodoro_tasks.newValue) {
            localStorage.setItem('pomodoro_tasks', changes.pomodoro_tasks.newValue as string);
            setTasks(JSON.parse(changes.pomodoro_tasks.newValue as string));
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
          // Batch state updates to avoid cascading renders
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

      // Sync every second, but only update when background timer is running
      const syncInterval = setInterval(() => {
        chrome.runtime.sendMessage({ action: 'getState' }, (response: { mode: TimerMode; timeLeft: number; isRunning: boolean; sessions: number; settings: SettingsType } | undefined) => {
          if (response) {
            // Always sync mode, timeLeft, and sessions
            setMode(response.mode);
            setTimeLeft(response.timeLeft);
            setSessions(response.sessions);
            
            // Always sync isRunning state to handle completion properly
            setIsRunning(response.isRunning);
            
            // Update hasStarted based on current state
            const durations = {
              work: response.settings?.workDuration * 60 || settings.workDuration * 60,
              break: response.settings?.breakDuration * 60 || settings.breakDuration * 60,
              longBreak: response.settings?.longBreakDuration * 60 || settings.longBreakDuration * 60
            };
            setHasStarted(response.timeLeft < durations[response.mode]);
          }
        });
      }, 1000);

      return () => clearInterval(syncInterval);
    }
  }, []); // Only sync once on mount

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setCurrentQuote(quotes[randomIndex]);
  };

  const handleTabManagement = useCallback(() => {
    if (!isExtension.current || !settings.openTabOnComplete) return;

    // Don't open tab if auto-start is enabled
    if ((mode === 'work' && settings.autoStartBreaks) ||
        (mode !== 'work' && settings.autoStartWork)) {
      return;
    }

    // Check if timer tab already exists
    chrome.tabs.query({ url: chrome.runtime.getURL('index.html') }, (tabs: chrome.tabs.Tab[]) => {
      if (tabs.length > 0) {
        // Focus existing tab
        chrome.tabs.update(tabs[0].id!, { active: true });
        chrome.windows.update(tabs[0].windowId!, { focused: true });
      } else {
        // Create new tab with cycle completion flag
        chrome.tabs.create({
          url: chrome.runtime.getURL('index.html?cycleComplete=true'),
          active: true
        });
      }
    });
  }, [mode, settings, isExtension]);

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
        taskName: task?.name || 'Generic',
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

    // Handle tab management for extensions
    handleTabManagement();
  }, [mode, tasks, currentTaskId, sessions, settings, handleTabManagement]);

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
      // Immediately update local state to prevent sync override
      setIsRunning(false);
      const durations = {
        work: settings.workDuration * 60,
        break: settings.breakDuration * 60,
        longBreak: settings.longBreakDuration * 60
      };
      setTimeLeft(durations[mode]);
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

  const handleStartCycle = (selectedMode: TimerMode) => {
    setMode(selectedMode);
    const durations = {
      work: settings.workDuration * 60,
      break: settings.breakDuration * 60,
      longBreak: settings.longBreakDuration * 60
    };
    setTimeLeft(durations[selectedMode]);
    setIsRunning(true);
    setHasStarted(true);
    if (isExtension.current) {
      chrome.runtime.sendMessage({ action: 'switchMode', mode: selectedMode });
      chrome.runtime.sendMessage({ action: 'start' });
    }
  };

  const handleGoToTimer = () => {
    // Check if we're in a cycle completion tab
    const urlParams = new URLSearchParams(window.location.search);
    const isCycleCompleteTab = urlParams.get('cycleComplete') === 'true';

    if (isCycleCompleteTab && isExtension.current) {
      // Remove the cycle complete parameter and navigate to timer
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }

    setView('timer');
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
        <button onClick={() => setView('about')} className={view === 'about' ? 'active' : ''}>
          About
        </button>
      </nav>

      <div className="view-container">
        {view === 'timer' && (
          <div className="timer-view">
          <div className="controls">
            <button onClick={toggleTimer} className="control-btn primary">
              {isRunning ? '⏸' : '▶'}
            </button>
            <button onClick={resetTimer} className="control-btn">↻</button>
          </div>

          <div className="timer" onDoubleClick={resetTimer}>
            {formatTime(timeLeft)}
          </div>

          <div className="task-selector">
            <select
              value={currentTaskId || ''}
              onChange={(e) => handleSelectTask(e.target.value || null)}
            >
              <option value="">Generic</option>
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
          history={history}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          onSelectTask={handleSelectTask}
        />
      )}

      {view === 'history' && (
        <History history={history} tasks={tasks} settings={settings} />
      )}

      {view === 'settings' && (
        <Settings settings={settings} onSave={handleSaveSettings} />
      )}

      {view === 'about' && (
        <About />
      )}

      {view === 'cyclePrompt' && (
        <CyclePrompt
          onStartCycle={handleStartCycle}
          onGoToTimer={handleGoToTimer}
          settings={settings}
          nextMode={mode}
          sessions={sessions}
        />
      )}
      </div>
    </div>
  );
}

export default App;
