import { useState, useEffect, useRef } from 'react';
import type { Task, HistoryEntry } from './types';

type Props = {
  tasks: Task[];
  currentTaskId: string | null;
  history: HistoryEntry[];
  onAddTask: (name: string, color: string) => void;
  onDeleteTask: (id: string) => void;
  onSelectTask: (id: string | null) => void;
};

const COLORS = [
  { value: '#e74c3c', label: 'Critical' },
  { value: '#f39c12', label: 'Urgent' },
  { value: '#50c878', label: 'Important' },
  { value: '#9b59b6', label: 'Good-to-have' }
];

export default function Tasks({ tasks, currentTaskId, history, onAddTask, onDeleteTask, onSelectTask }: Props) {
  const [newTaskName, setNewTaskName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate task statistics
  const getTaskStats = (taskId: string | null) => {
    const taskEntries = history.filter(entry => 
      entry.mode === 'work' && entry.taskId === (taskId || 'none')
    );
    
    const sessions = taskEntries.length;
    const totalTime = taskEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const hours = totalTime > 0 ? Math.round(totalTime / 3600 * 10) / 10 : 0;
    
    const lastUsed = taskEntries.length > 0 
      ? Math.max(...taskEntries.map(e => e.completedAt))
      : null;
    
    return { sessions, hours, lastUsed };
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowColorDropdown(false);
      }
    };

    if (showColorDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorDropdown]);

  const handleAdd = () => {
    if (newTaskName.trim()) {
      onAddTask(newTaskName.trim(), selectedColor);
      setNewTaskName('');
    }
  };

  const selectedColorLabel = COLORS.find(c => c.value === selectedColor)?.label || 'Critical';
  const genericStats = getTaskStats(null);

  return (
    <div className="view tasks-view">
      <div className="task-form-card">
        <h3>Add New Task</h3>
        <div className="task-input-wrapper">
          <div className="color-dropdown" ref={dropdownRef}>
            <button
              type="button"
              className="color-select"
              style={{ backgroundColor: selectedColor }}
              onClick={() => setShowColorDropdown(!showColorDropdown)}
              title={selectedColorLabel}
            >
              🍅
            </button>
            {showColorDropdown && (
              <div className="color-dropdown-menu">
                {COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    className="color-option"
                    style={{ backgroundColor: color.value }}
                    onClick={() => {
                      setSelectedColor(color.value);
                      setShowColorDropdown(false);
                    }}
                  >
                    {color.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="text"
            placeholder="Enter task name..."
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            className="task-name-input"
          />
          <button onClick={handleAdd} className="add-task-btn">
            Add Task
          </button>
        </div>
      </div>

      <div className="tasks-grid">
        {/* Generic Task Card */}
        <div 
          className={`task-card ${currentTaskId === null ? 'selected' : ''}`}
          onClick={() => onSelectTask(null)}
        >
          <div className="task-card-header">
            <div className="task-color-indicator generic" />
            <div className="task-info">
              <h4>Generic</h4>
              <p>Default task for quick sessions</p>
            </div>
          </div>
          <div className="task-stats">
            <div className="stat-item">
              <span className="stat-value">{genericStats.sessions}</span>
              <span className="stat-label">sessions</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{genericStats.hours}h</span>
              <span className="stat-label">total time</span>
            </div>
          </div>
          {genericStats.lastUsed && (
            <div className="last-used">
              Last used: {new Date(genericStats.lastUsed).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Custom Task Cards */}
        {tasks.map(task => {
          const stats = getTaskStats(task.id);
          return (
            <div 
              key={task.id}
              className={`task-card ${currentTaskId === task.id ? 'selected' : ''}`}
              onClick={() => onSelectTask(task.id)}
              style={{ borderLeftColor: task.color }}
            >
              <div className="task-card-header">
                <div 
                  className="task-color-indicator" 
                  style={{ backgroundColor: task.color }}
                />
                <div className="task-info">
                  <h4>{task.name}</h4>
                  <p>Created {new Date(task.createdAt).toLocaleDateString()}</p>
                </div>
                <button 
                  className="delete-task-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete "${task.name}"?`)) {
                      onDeleteTask(task.id);
                    }
                  }}
                  title="Delete task"
                >
                  ×
                </button>
              </div>
              <div className="task-stats">
                <div className="stat-item">
                  <span className="stat-value">{stats.sessions}</span>
                  <span className="stat-label">sessions</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.hours}h</span>
                  <span className="stat-label">total time</span>
                </div>
              </div>
              {stats.lastUsed && (
                <div className="last-used">
                  Last used: {new Date(stats.lastUsed).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <div className="empty-state">
          <p>No custom tasks yet. Create your first task above to get started!</p>
        </div>
      )}
    </div>
  );
}
