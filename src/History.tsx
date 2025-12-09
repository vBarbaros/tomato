import { useState } from 'react';
import type { HistoryEntry, Task } from './types';

type Props = {
  history: HistoryEntry[];
  tasks: Task[];
};

type TimePeriod = 'month' | 'quarter' | 'half' | 'year' | string; // string for year values like '2025'

export default function History({ history, tasks }: Props) {
  const currentYear = new Date().getFullYear();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('year');

  const getTaskColor = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task?.color || '#999';
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  const getTaskStats = () => {
    const stats: Record<string, { name: string; count: number; total: number; color: string }> = {};
    
    history.forEach(entry => {
      if (entry.mode === 'work') {
        if (!stats[entry.taskId]) {
          stats[entry.taskId] = {
            name: entry.taskName,
            count: 0,
            total: 0,
            color: getTaskColor(entry.taskId)
          };
        }
        stats[entry.taskId].count++;
        stats[entry.taskId].total += entry.duration;
      }
    });

    return Object.values(stats).sort((a, b) => b.count - a.count);
  };

  const getDateRange = () => {
    const today = new Date();
    const startDate = new Date(today);
    
    if (timePeriod === 'month') {
      startDate.setMonth(today.getMonth() - 1);
    } else if (timePeriod === 'quarter') {
      startDate.setMonth(today.getMonth() - 3);
    } else if (timePeriod === 'half') {
      startDate.setMonth(today.getMonth() - 6);
    } else if (timePeriod === 'year') {
      startDate.setFullYear(today.getFullYear() - 1);
    } else {
      // Specific year value
      const year = parseInt(timePeriod);
      startDate.setFullYear(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      return { startDate, endDate };
    }
    
    return { startDate, endDate: today };
  };

  const getHeatmapData = () => {
    const { startDate, endDate } = getDateRange();
    
    const dayMap: Record<string, number> = {};
    
    history.forEach(entry => {
      if (entry.mode === 'work') {
        const date = new Date(entry.completedAt);
        const dateKey = date.toISOString().split('T')[0];
        dayMap[dateKey] = (dayMap[dateKey] || 0) + 1;
      }
    });

    const weeks: { date: Date; count: number }[][] = [];
    const monthLabels: { month: string; weekIndex: number }[] = [];
    let currentWeek: { date: Date; count: number }[] = [];
    let lastMonth = -1;
    
    const start = new Date(startDate);
    start.setDate(start.getDate() - start.getDay());
    
    const totalDays = Math.ceil((endDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 7;
    
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      
      const dateKey = date.toISOString().split('T')[0];
      const count = dayMap[dateKey] || 0;
      
      currentWeek.push({ date, count });
      
      if (currentWeek.length === 7) {
        const weekMonth = currentWeek[0].date.getMonth();
        if (weekMonth !== lastMonth && weeks.length > 0) {
          monthLabels.push({
            month: currentWeek[0].date.toLocaleDateString('en-US', { month: 'short' }),
            weekIndex: weeks.length
          });
          lastMonth = weekMonth;
        } else if (weeks.length === 0) {
          monthLabels.push({
            month: currentWeek[0].date.toLocaleDateString('en-US', { month: 'short' }),
            weekIndex: 0
          });
          lastMonth = weekMonth;
        }
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        const lastDate = currentWeek[currentWeek.length - 1].date;
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + 1);
        currentWeek.push({ date: nextDate, count: 0 });
      }
      weeks.push(currentWeek);
    }
    
    return { weeks, monthLabels };
  };

  const getIntensityColor = (count: number) => {
    if (count === 0) return '#ebedf0';
    if (count <= 2) return '#c6e48b';
    if (count <= 4) return '#7bc96f';
    if (count <= 6) return '#239a3b';
    return '#196127';
  };

  const totalSessions = history.filter(h => h.mode === 'work').length;
  const totalTime = history.reduce((sum, h) => h.mode === 'work' ? sum + h.duration : sum, 0);
  const { weeks: heatmapData, monthLabels } = getHeatmapData();

  return (
    <div className="view">
      <h2>History</h2>
      
      <div className="stats">
        <div className="stat-card">
          <div className="stat-value">{totalSessions}</div>
          <div className="stat-label">Total Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{Math.floor(totalTime / 60)}m</div>
          <div className="stat-label">Total Time</div>
        </div>
      </div>

      <div className="heatmap-header">
        <h3>Activity Heatmap</h3>
        <div className="period-controls">
          <button className={timePeriod === 'month' ? 'active' : ''} onClick={() => setTimePeriod('month')}>
            Month
          </button>
          <button className={timePeriod === 'quarter' ? 'active' : ''} onClick={() => setTimePeriod('quarter')}>
            Quarter
          </button>
          <button className={timePeriod === 'half' ? 'active' : ''} onClick={() => setTimePeriod('half')}>
            Half Year
          </button>
          <button className={timePeriod === 'year' ? 'active' : ''} onClick={() => setTimePeriod('year')}>
            Year
          </button>
          <select 
            value={timePeriod.match(/^\d{4}$/) ? timePeriod : ''} 
            onChange={(e) => setTimePeriod(e.target.value)}
          >
            <option value="" disabled>Select Year</option>
            <option value={currentYear.toString()}>{currentYear}</option>
            <option value={(currentYear - 1).toString()}>{currentYear - 1}</option>
            <option value={(currentYear - 2).toString()}>{currentYear - 2}</option>
          </select>
        </div>
      </div>

      <div className="heatmap-container">
        <div className="heatmap-months">
          {monthLabels.map((label, idx) => (
            <div
              key={idx}
              className="month-label"
              style={{ left: `${label.weekIndex * 13}px` }}
            >
              {label.month}
            </div>
          ))}
        </div>
        <div className="heatmap-grid">
          <div className="heatmap-days">
            <div className="day-label"></div>
            <div className="day-label">Mon</div>
            <div className="day-label"></div>
            <div className="day-label">Wed</div>
            <div className="day-label"></div>
            <div className="day-label">Fri</div>
            <div className="day-label"></div>
          </div>
          <div className="heatmap">
            {heatmapData.map((week, weekIdx) => (
              <div key={weekIdx} className="heatmap-week">
                {week.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="heatmap-day"
                    style={{ backgroundColor: getIntensityColor(day.count) }}
                    title={`${day.date.toLocaleDateString()}: ${day.count} sessions`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="heatmap-legend">
          <span>Less</span>
          <div className="legend-box" style={{ backgroundColor: '#ebedf0' }} />
          <div className="legend-box" style={{ backgroundColor: '#c6e48b' }} />
          <div className="legend-box" style={{ backgroundColor: '#7bc96f' }} />
          <div className="legend-box" style={{ backgroundColor: '#239a3b' }} />
          <div className="legend-box" style={{ backgroundColor: '#196127' }} />
          <span>More</span>
        </div>
      </div>

      <h3>By Task</h3>
      <div className="task-stats">
        {getTaskStats().map(stat => (
          <div key={stat.name} className="task-stat">
            <div className="task-color" style={{ backgroundColor: stat.color }} />
            <div className="task-stat-info">
              <div className="task-stat-name">{stat.name}</div>
              <div className="task-stat-details">
                {stat.count} sessions · {Math.floor(stat.total / 60)}m
              </div>
            </div>
          </div>
        ))}
      </div>

      <h3>Recent Activity</h3>
      <div className="history-list">
        {history.slice(0, 50).map(entry => (
          <div key={entry.id} className="history-item">
            <div className="task-color" style={{ backgroundColor: getTaskColor(entry.taskId) }} />
            <div className="history-info">
              <div className="history-task">{entry.taskName}</div>
              <div className="history-meta">
                {entry.mode} · {formatDuration(entry.duration)} · {formatDate(entry.completedAt)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
