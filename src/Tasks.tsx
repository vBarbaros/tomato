import { useState, useEffect, useRef } from 'react';
import type { Task } from './types';

type Props = {
  tasks: Task[];
  currentTaskId: string | null;
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

export default function Tasks({ tasks, currentTaskId, onAddTask, onDeleteTask, onSelectTask }: Props) {
  const [newTaskName, setNewTaskName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="view">
      <h2>Tasks</h2>
      
      <div className="task-form">
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
            placeholder="New task name"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button onClick={handleAdd} className="add-btn">+</button>
        </div>
      </div>

      <div className="task-list">
        <div 
          className={`task-item ${currentTaskId === null ? 'selected' : ''}`}
          onClick={() => onSelectTask(null)}
        >
          <div className="task-color" style={{ backgroundColor: '#fff', border: '2px solid #ddd' }} />
          <span>No Task</span>
        </div>
        {tasks.map(task => (
          <div 
            key={task.id}
            className={`task-item ${currentTaskId === task.id ? 'selected' : ''}`}
            onClick={() => onSelectTask(task.id)}
          >
            <div className="task-color" style={{ backgroundColor: task.color }} />
            <span>{task.name}</span>
            <button 
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTask(task.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
