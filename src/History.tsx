import { useState } from 'react';
import type { HistoryEntry, Task } from './types';

type Props = {
  history: HistoryEntry[];
  tasks: Task[];
};

type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'half' | 'year' | string; // string for year values like '2025'

export default function History({ history }: Props) {
  const currentYear = new Date().getFullYear();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('year');

  const getDateRange = () => {
    const today = new Date();
    const startDate = new Date(today);
    
    if (timePeriod === 'day') {
      startDate.setHours(0, 0, 0, 0);
      today.setHours(23, 59, 59, 999);
    } else if (timePeriod === 'week') {
      startDate.setDate(today.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    } else if (timePeriod === 'month') {
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

    const weeks: ({ date: Date; count: number } | null)[][] = [];
    const monthLabels: { month: string; weekIndex: number }[] = [];
    let currentWeek: ({ date: Date; count: number } | null)[] = [];
    let lastMonth = -1;
    
    const startDay = startDate.getDay();
    
    // Add null cells for days before the start date in the first week
    for (let i = 0; i < startDay; i++) {
      currentWeek.push(null);
    }
    
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dateKey = current.toISOString().split('T')[0];
      const count = dayMap[dateKey] || 0;
      
      currentWeek.push({ date: new Date(current), count });
      
      if (currentWeek.length === 7) {
        const firstRealDay = currentWeek.find(d => d !== null);
        if (firstRealDay) {
          const weekMonth = firstRealDay.date.getMonth();
          if (weekMonth !== lastMonth && weeks.length > 0) {
            monthLabels.push({
              month: firstRealDay.date.toLocaleDateString('en-US', { month: 'short' }),
              weekIndex: weeks.length
            });
            lastMonth = weekMonth;
          } else if (weeks.length === 0) {
            monthLabels.push({
              month: firstRealDay.date.toLocaleDateString('en-US', { month: 'short' }),
              weekIndex: 0
            });
            lastMonth = weekMonth;
          }
        }
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    // Add remaining days in the last partial week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
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

  const getProductivityByDayOfWeek = () => {
    const { startDate, endDate } = getDateRange();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    const dayHours = [0, 0, 0, 0, 0, 0, 0];

    history.forEach(entry => {
      if (entry.mode === 'work') {
        const date = new Date(entry.completedAt);
        if (date >= startDate && date <= endDate) {
          const dayOfWeek = date.getDay();
          dayCounts[dayOfWeek]++;
          dayHours[dayOfWeek] += entry.duration / 3600;
        }
      }
    });

    const maxCount = Math.max(...dayCounts, 1);

    return dayNames.map((name, index) => ({
      day: name,
      count: dayCounts[index],
      hours: dayHours[index],
      percentage: (dayCounts[index] / maxCount) * 100
    }));
  };

  const getProductivityByHour = () => {
    const { startDate, endDate } = getDateRange();
    const timeBlocks = [
      { name: 'Late Night', range: '0:00-6:00', start: 0, end: 6, color: '#8b1a1a' },
      { name: 'Early Morning', range: '6:00-9:00', start: 6, end: 9, color: '#c53030' },
      { name: 'Morning', range: '9:00-12:00', start: 9, end: 12, color: '#e53e3e' },
      { name: 'Afternoon', range: '12:00-17:00', start: 12, end: 17, color: '#fc8181' },
      { name: 'Evening', range: '17:00-21:00', start: 17, end: 21, color: '#e53e3e' },
      { name: 'Night', range: '21:00-24:00', start: 21, end: 24, color: '#c53030' }
    ];

    const blockCounts = timeBlocks.map(() => 0);

    history.forEach(entry => {
      if (entry.mode === 'work') {
        const date = new Date(entry.completedAt);
        if (date >= startDate && date <= endDate) {
          const hour = date.getHours();
          const blockIndex = timeBlocks.findIndex(block => hour >= block.start && hour < block.end);
          if (blockIndex !== -1) {
            blockCounts[blockIndex]++;
          }
        }
      }
    });

    const totalSessions = blockCounts.reduce((sum, count) => sum + count, 0);
    const maxCount = Math.max(...blockCounts, 1);

    return timeBlocks.map((block, index) => ({
      ...block,
      count: blockCounts[index],
      percentage: totalSessions > 0 ? (blockCounts[index] / totalSessions) * 100 : 0,
      barWidth: (blockCounts[index] / maxCount) * 100
    }));
  };

  const getTaskDistribution = () => {
    const { startDate, endDate } = getDateRange();
    const taskMap: Record<string, { name: string; duration: number }> = {};

    history.forEach(entry => {
      if (entry.mode === 'work') {
        const date = new Date(entry.completedAt);
        if (date >= startDate && date <= endDate) {
          if (!taskMap[entry.taskId]) {
            taskMap[entry.taskId] = {
              name: entry.taskName,
              duration: 0
            };
          }
          taskMap[entry.taskId].duration += entry.duration;
        }
      }
    });

    const taskList = Object.values(taskMap).sort((a, b) => b.duration - a.duration);
    const totalDuration = taskList.reduce((sum, task) => sum + task.duration, 0);

    // Take top 10, group rest as "Other"
    const top10 = taskList.slice(0, 10);
    const rest = taskList.slice(10);
    
    if (rest.length > 0) {
      const otherDuration = rest.reduce((sum, task) => sum + task.duration, 0);
      top10.push({
        name: 'Other',
        duration: otherDuration
      });
    }

    // Red shades from dark to light
    const redShades = [
      '#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444',
      '#f87171', '#fca5a5', '#fecaca', '#fee2e2', '#fef2f2', '#cbd5e0'
    ];

    return top10.map((task, index) => ({
      ...task,
      color: redShades[index],
      percentage: totalDuration > 0 ? (task.duration / totalDuration) * 100 : 0,
      hours: task.duration / 3600
    }));
  };

  const totalSessions = history.filter(h => h.mode === 'work').length;
  const totalTime = history.reduce((sum, h) => h.mode === 'work' ? sum + h.duration : sum, 0);
  const { weeks: heatmapData, monthLabels } = getHeatmapData();

  return (
    <div className="view">
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
          <button className={timePeriod === 'day' ? 'active' : ''} onClick={() => setTimePeriod('day')}>
            Today
          </button>
          <button className={timePeriod === 'week' ? 'active' : ''} onClick={() => setTimePeriod('week')}>
            Week
          </button>
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
                  day !== null ? (
                    <div
                      key={dayIdx}
                      className="heatmap-day"
                      style={{ backgroundColor: getIntensityColor(day.count) }}
                      title={`${day.date.toLocaleDateString()}: ${day.count} sessions`}
                    />
                  ) : (
                    <div key={dayIdx} className="heatmap-day-empty" />
                  )
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

      <div className="day-of-week-chart">
        <h3>Productivity by Day of Week</h3>
        <div className="day-bars">
          {getProductivityByDayOfWeek().map(day => (
            <div key={day.day} className="day-bar-container">
              <div className="day-bar-wrapper">
                <div 
                  className="day-bar"
                  style={{ height: `${day.percentage}%` }}
                  title={`${day.count} sessions, ${day.hours.toFixed(1)} hours`}
                />
              </div>
              <div className="day-label-bottom">{day.day}</div>
              <div className="day-count">{day.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="hour-of-day-chart">
        <h3>Productivity by Time of Day</h3>
        <div className="hour-bars">
          {getProductivityByHour().map(block => (
            <div key={block.name} className="hour-bar-row">
              <div className="hour-label">
                <div className="hour-name">{block.name}</div>
                <div className="hour-range">{block.range}</div>
              </div>
              <div className="hour-bar-container">
                <div 
                  className="hour-bar"
                  style={{ 
                    width: `${block.barWidth}%`,
                    backgroundColor: block.color
                  }}
                  title={`${block.count} sessions (${block.percentage.toFixed(1)}%)`}
                >
                  {block.count > 0 && (
                    <span className="hour-count">{block.count}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="task-distribution-chart">
        <h3>Task Distribution</h3>
        <div className="task-bars">
          {getTaskDistribution().map((task, index) => (
            <div key={index} className="task-bar-row">
              <div className="task-bar-label">
                <div className="task-bar-name">{task.name}</div>
                <div className="task-bar-stats">{task.percentage.toFixed(1)}%</div>
              </div>
              <div className="task-bar-container">
                <div 
                  className="task-bar"
                  style={{ 
                    width: `${task.percentage}%`,
                    backgroundColor: task.color
                  }}
                  title={`${task.hours.toFixed(1)} hours`}
                >
                  {task.hours >= 1 && (
                    <span className="task-bar-hours">{task.hours.toFixed(1)}h</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
