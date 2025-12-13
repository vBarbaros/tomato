import { useState } from 'react';
import type { HistoryEntry, Task, Settings } from './types';
import { storage } from './storage';

type Props = {
  history: HistoryEntry[];
  tasks: Task[];
  settings: Settings;
};

type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'half' | 'year' | string; // string for year values like '2025'

// Helper function to get start of day timestamp
const getStartOfDay = (timestamp: number) => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

// Helper function to calculate current streak
const calculateCurrentStreak = (history: HistoryEntry[]) => {
  if (history.length === 0) return 0;

  const workSessions = history.filter(entry => entry.mode === 'work');
  if (workSessions.length === 0) return 0;

  // Group sessions by day
  const sessionsByDay = new Map<number, number>();
  workSessions.forEach(entry => {
    const dayStart = getStartOfDay(entry.completedAt);
    sessionsByDay.set(dayStart, (sessionsByDay.get(dayStart) || 0) + 1);
  });

  const today = getStartOfDay(Date.now());
  const yesterday = today - 24 * 60 * 60 * 1000;

  // Check if there's a session today or yesterday (streak can continue from yesterday)
  if (!sessionsByDay.has(today) && !sessionsByDay.has(yesterday)) {
    return 0;
  }

  let streak = 0;
  let currentDay = sessionsByDay.has(today) ? today : yesterday;

  // Count consecutive days backwards
  while (sessionsByDay.has(currentDay)) {
    streak++;
    currentDay -= 24 * 60 * 60 * 1000;
  }

  return streak;
};

// Helper function to calculate longest streak
const calculateLongestStreak = (history: HistoryEntry[]) => {
  if (history.length === 0) return 0;

  const workSessions = history.filter(entry => entry.mode === 'work');
  if (workSessions.length === 0) return 0;

  // Group sessions by day
  const sessionsByDay = new Map<number, number>();
  workSessions.forEach(entry => {
    const dayStart = getStartOfDay(entry.completedAt);
    sessionsByDay.set(dayStart, (sessionsByDay.get(dayStart) || 0) + 1);
  });

  const sortedDays = Array.from(sessionsByDay.keys()).sort((a, b) => a - b);
  
  let maxStreak = 0;
  let currentStreak = 0;
  let expectedDay = sortedDays[0];

  for (const day of sortedDays) {
    if (day === expectedDay) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
    expectedDay = day + 24 * 60 * 60 * 1000;
  }

  return maxStreak;
};

// Helper function to get weekly comparison data
const getWeeklyComparison = (history: HistoryEntry[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Get start of current week (Monday)
  const currentWeekStart = new Date(today);
  const dayOfWeek = currentWeekStart.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  currentWeekStart.setDate(currentWeekStart.getDate() - daysToMonday);
  
  // Get start of previous week
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekEnd.getDate() + 7);
  
  const previousWeekEnd = new Date(previousWeekStart);
  previousWeekEnd.setDate(previousWeekEnd.getDate() + 7);
  
  // Filter sessions for each week
  const currentWeekSessions = history.filter(entry => {
    const entryDate = new Date(entry.completedAt);
    return entryDate >= currentWeekStart && entryDate < currentWeekEnd && entry.mode === 'work';
  });
  
  const previousWeekSessions = history.filter(entry => {
    const entryDate = new Date(entry.completedAt);
    return entryDate >= previousWeekStart && entryDate < previousWeekEnd && entry.mode === 'work';
  });
  
  const currentSessions = currentWeekSessions.length;
  const currentHours = Math.round(currentWeekSessions.reduce((sum, entry) => sum + entry.duration, 0) / 3600 * 10) / 10;
  
  const previousSessions = previousWeekSessions.length;
  const previousHours = Math.round(previousWeekSessions.reduce((sum, entry) => sum + entry.duration, 0) / 3600 * 10) / 10;
  
  const sessionChange = previousSessions === 0 ? (currentSessions > 0 ? 100 : 0) : 
    Math.round(((currentSessions - previousSessions) / previousSessions) * 100);
  
  const hourChange = previousHours === 0 ? (currentHours > 0 ? 100 : 0) : 
    Math.round(((currentHours - previousHours) / previousHours) * 100);
  
  return {
    current: { sessions: currentSessions, hours: currentHours },
    previous: { sessions: previousSessions, hours: previousHours },
    sessionChange,
    hourChange
  };
};

// Helper function to get goal progress
const getGoalProgress = (history: HistoryEntry[], settings: any) => {
  const now = Date.now();
  const today = getStartOfDay(now);
  
  // Daily progress
  const todaySessions = history.filter(entry => {
    return getStartOfDay(entry.completedAt) === today && entry.mode === 'work';
  }).length;
  
  // Weekly progress (Monday to Sunday)
  const currentDate = new Date(now);
  const dayOfWeek = currentDate.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - daysToMonday);
  const weekStartDay = getStartOfDay(weekStart.getTime());
  
  const weekSessions = history.filter(entry => {
    const entryDay = getStartOfDay(entry.completedAt);
    return entryDay >= weekStartDay && entryDay <= today && entry.mode === 'work';
  }).length;
  
  // Monthly progress
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthStartDay = getStartOfDay(monthStart.getTime());
  
  const monthSessions = history.filter(entry => {
    const entryDay = getStartOfDay(entry.completedAt);
    return entryDay >= monthStartDay && entryDay <= today && entry.mode === 'work';
  }).length;
  
  return {
    daily: {
      current: todaySessions,
      goal: settings.dailyGoal || 4,
      percentage: Math.round((todaySessions / (settings.dailyGoal || 4)) * 100)
    },
    weekly: {
      current: weekSessions,
      goal: settings.weeklyGoal || 20,
      percentage: Math.round((weekSessions / (settings.weeklyGoal || 20)) * 100)
    },
    monthly: {
      current: monthSessions,
      goal: settings.monthlyGoal || 80,
      percentage: Math.round((monthSessions / (settings.monthlyGoal || 80)) * 100)
    }
  };
};

// Helper function to export history to CSV
const exportToCSV = (history: HistoryEntry[], tasks: Task[]): void => {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  
  const csvContent = [
    'id,taskId,taskName,taskColor,mode,duration,completedAt',
    ...history.map(entry => {
      const task = taskMap.get(entry.taskId);
      return [
        entry.id,
        entry.taskId || 'none',
        `"${entry.taskName.replace(/"/g, '""')}"`, // Escape quotes
        task?.color || '#c44540',
        entry.mode,
        entry.duration,
        entry.completedAt
      ].join(',');
    })
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `tomato-history-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// CSV Import Security Functions
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ENTRIES = 10000;

const validateFile = (file: File): boolean => {
  const allowedTypes = ['text/csv', 'application/csv', 'text/plain'];
  const allowedExtensions = ['.csv'];
  return allowedTypes.includes(file.type) && 
         allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext)) &&
         file.size <= MAX_FILE_SIZE;
};

const validateCSVFormat = (csvText: string): boolean => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return false;
  
  const expectedHeader = 'id,taskId,taskName,taskColor,mode,duration,completedAt';
  if (lines[0].trim() !== expectedHeader) return false;
  
  for (const line of lines) {
    if (line.trim() && ((line.match(/,/g) || []).length !== 6 || 
        line.includes(';') || line.includes('\t') || line.includes('|'))) {
      return false;
    }
  }
  return true;
};

const sanitizeCell = (cell: string): string => {
  if (!cell) return '';
  if (cell.startsWith('=') || cell.startsWith('+') || 
      cell.startsWith('-') || cell.startsWith('@')) {
    return `'${cell}`;
  }
  return cell.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
             .replace(/[<>]/g, '').trim().substring(0, 200);
};

const sanitizeColor = (color: string): string => {
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;
  return hexPattern.test(color) ? color : '#c44540';
};

const parseCSVLine = (line: string): any => {
  const result: any = {};
  const headers = ['id', 'taskId', 'taskName', 'taskColor', 'mode', 'duration', 'completedAt'];
  const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
  
  headers.forEach((header, index) => {
    if (values[index]) {
      result[header] = values[index].replace(/^"|"$/g, '');
    }
  });
  return result;
};

const validateRow = (row: any): any => {
  try {
    if (!row.id || !row.taskName || !row.mode) return null;
    
    const duration = parseInt(row.duration);
    const completedAt = parseInt(row.completedAt);
    
    if (isNaN(duration) || isNaN(completedAt) || duration < 0 || duration > 7200) return null;
    if (!['work', 'break', 'longBreak'].includes(row.mode)) return null;
    
    const now = Date.now();
    const twoYearsAgo = now - (2 * 365 * 24 * 60 * 60 * 1000);
    const oneDayFuture = now + (24 * 60 * 60 * 1000);
    if (completedAt < twoYearsAgo || completedAt > oneDayFuture) return null;
    
    return {
      id: sanitizeCell(row.id.toString()),
      taskId: sanitizeCell(row.taskId?.toString()) || 'none',
      taskName: sanitizeCell(row.taskName.toString()),
      taskColor: sanitizeColor(row.taskColor?.toString()),
      mode: row.mode,
      duration,
      completedAt
    };
  } catch {
    return null;
  }
};

let lastImportTime = 0;
const checkRateLimit = (): boolean => {
  const now = Date.now();
  if (now - lastImportTime < 5000) return false;
  lastImportTime = now;
  return true;
};

export default function History({ history, tasks, settings }: Props) {
  const currentYear = new Date().getFullYear();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('year');

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const startTime = Date.now();
    const TIMEOUT_MS = 30000; // 30 second timeout

    try {
      if (!checkRateLimit()) {
        alert('Please wait before importing again');
        return;
      }

      if (!validateFile(file)) {
        console.warn('Import failed: Invalid file format', { fileName: file.name, fileSize: file.size, fileType: file.type });
        alert('Invalid file format. Please upload a CSV file under 5MB.');
        return;
      }

      const text = await file.text();
      if (!validateCSVFormat(text)) {
        console.warn('Import failed: Invalid CSV format', { fileName: file.name });
        alert('Invalid CSV format. Please ensure the file uses comma separators and has the correct header.');
        return;
      }

      const lines = text.split('\n').filter(line => line.trim());
      const validEntries: any[] = [];
      const taskMap = new Map(tasks.map(t => [t.id, t]));
      const newTasks: Task[] = [];
      let processedCount = 0;

      console.info('Starting CSV import', { fileName: file.name, totalLines: lines.length - 1 });

      // Process entries in chunks with timeout check
      for (let i = 1; i < lines.length && validEntries.length < MAX_ENTRIES; i++) {
        // Check timeout
        if (Date.now() - startTime > TIMEOUT_MS) {
          console.error('Import timeout exceeded', { processedCount, fileName: file.name });
          alert('Import timeout. File too large or complex to process.');
          return;
        }

        const row = parseCSVLine(lines[i]);
        const validRow = validateRow(row);
        if (validRow) {
          // Generate unique ID for imported entry
          validRow.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Create task if it doesn't exist
          if (validRow.taskId !== 'none' && !taskMap.has(validRow.taskId)) {
            const newTask: Task = {
              id: validRow.taskId,
              name: validRow.taskName,
              color: validRow.taskColor,
              createdAt: Date.now()
            };
            taskMap.set(validRow.taskId, newTask);
            newTasks.push(newTask);
          }
          validEntries.push(validRow);
        }
        processedCount++;

        // Yield control every 100 entries
        if (i % 100 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      // Remove duplicates using composite key (taskId + completedAt + duration)
      const existingKeys = new Set(
        history.map(e => `${e.taskId}-${e.completedAt}-${e.duration}-${e.mode}`)
      );
      const newEntries = validEntries.filter(entry => 
        !existingKeys.has(`${entry.taskId}-${entry.completedAt}-${entry.duration}-${entry.mode}`)
      );

      console.info('Import processing complete', { 
        processedCount, 
        validEntries: validEntries.length, 
        newEntries: newEntries.length, 
        newTasks: newTasks.length,
        fileName: file.name 
      });

      if (newEntries.length === 0 && newTasks.length === 0) {
        alert('No new entries found (all entries already exist)');
        return;
      }

      if (newEntries.length > 100) {
        const confirmed = window.confirm(
          `Import ${newEntries.length} entries and ${newTasks.length} new tasks? This action cannot be undone.`
        );
        if (!confirmed) {
          console.info('Import cancelled by user', { fileName: file.name });
          return;
        }
      }

      // Atomic operation: prepare all data first, then save together
      const updatedTasks = newTasks.length > 0 ? [...tasks, ...newTasks] : tasks;
      const updatedHistory = newEntries.length > 0 ? [...history, ...newEntries] : history;

      // Save atomically
      try {
        if (newTasks.length > 0) {
          storage.saveTasks(updatedTasks);
        }
        if (newEntries.length > 0) {
          storage.saveHistory(updatedHistory);
        }
        
        console.info('Import completed successfully', { 
          importedEntries: newEntries.length, 
          createdTasks: newTasks.length,
          fileName: file.name 
        });
        
        alert(`Successfully imported ${newEntries.length} entries and created ${newTasks.length} new tasks`);
        window.location.reload(); // Refresh to show new data
        
      } catch (saveError) {
        console.error('Import failed during save operation', { error: saveError, fileName: file.name });
        alert('Import failed during save operation');
      }

    } catch (error) {
      console.error('Import failed with unexpected error', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        fileName: file.name,
        processingTime: Date.now() - startTime 
      });
      alert('Import failed due to an unexpected error');
    } finally {
      event.target.value = ''; // Reset file input
    }
  };

  const getDateRange = () => {
    const today = new Date();
    const startDate = new Date(today);
    
    if (timePeriod === 'day') {
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    } else if (timePeriod === 'week') {
      startDate.setDate(today.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    } else if (timePeriod === 'month') {
      startDate.setMonth(today.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    } else if (timePeriod === 'quarter') {
      startDate.setMonth(today.getMonth() - 3);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    } else if (timePeriod === 'half') {
      startDate.setMonth(today.getMonth() - 6);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    } else if (timePeriod === 'year') {
      startDate.setFullYear(today.getFullYear(), 0, 1); // January 1st of current year
      const endDate = new Date(today.getFullYear(), 11, 31); // December 31st of current year
      return { startDate, endDate };
    } else {
      // Specific year value
      const year = parseInt(timePeriod);
      startDate.setFullYear(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      return { startDate, endDate };
    }
  };

  const getHeatmapData = () => {
    const { startDate, endDate } = getDateRange();
    
    const dayMap: Record<number, number> = {};
    
    history.forEach(entry => {
      if (entry.mode === 'work') {
        const dayKey = getStartOfDay(entry.completedAt);
        dayMap[dayKey] = (dayMap[dayKey] || 0) + 1;
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
      const dayKey = getStartOfDay(current.getTime());
      const count = dayMap[dayKey] || 0;
      
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
    
    // Add final week if it has content, padding with nulls if needed
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }
    
    // Ensure the final month label is added if we haven't seen it yet
    if (weeks.length > 0) {
      const lastWeek = weeks[weeks.length - 1];
      const lastRealDay = lastWeek.find(day => day !== null);
      if (lastRealDay) {
        const lastMonth = lastRealDay.date.getMonth();
        const hasLastMonthLabel = monthLabels.some(label => {
          const labelDate = new Date(lastRealDay.date.getFullYear(), lastMonth, 1);
          return label.month === labelDate.toLocaleDateString('en-US', { month: 'short' });
        });
        
        if (!hasLastMonthLabel) {
          monthLabels.push({
            month: lastRealDay.date.toLocaleDateString('en-US', { month: 'short' }),
            weekIndex: weeks.length - 1
          });
        }
      }
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

    // Initialize all existing tasks with zero duration
    tasks.forEach(task => {
      taskMap[task.id] = { name: task.name, duration: 0 };
    });
    
    // Add generic task
    taskMap['none'] = { name: 'Generic', duration: 0 };

    // Calculate actual durations from history
    history.forEach(entry => {
      if (entry.mode === 'work') {
        const date = new Date(entry.completedAt);
        if (date >= startDate && date <= endDate) {
          const taskId = entry.taskId || 'none';
          if (taskMap[taskId]) {
            taskMap[taskId].duration += entry.duration;
          } else {
            // Handle tasks that might have been deleted
            taskMap[taskId] = {
              name: entry.taskName,
              duration: entry.duration
            };
          }
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

  const currentStreak = calculateCurrentStreak(history);
  const longestStreak = calculateLongestStreak(history);
  const today = getStartOfDay(Date.now());
  const hasSessionToday = history.some(entry => 
    entry.mode === 'work' && getStartOfDay(entry.completedAt) === today
  );

  return (
    <div className="view">
      {/* Streak Tracking */}
      <div className="streak-section">
        <div className="streak-cards">
          <div className="streak-card">
            <div className="streak-icon">{hasSessionToday ? '🔥' : '⚠️'}</div>
            <div className="streak-value">{currentStreak}</div>
            <div className="streak-label">Current Streak</div>
          </div>
          <div className="streak-card">
            <div className="streak-icon">🏆</div>
            <div className="streak-value">{longestStreak}</div>
            <div className="streak-label">Longest Streak</div>
          </div>
          <div className="streak-card">
            <div className="streak-icon">🗓️</div>
            <div className="streak-value">
              {currentStreak > 0 ? `${currentStreak} days` : 'Start today!'}
            </div>
            <div className="streak-label">
              {currentStreak > 0 ? 'Keep it up!' : 'Begin your streak'}
            </div>
          </div>
        </div>
      </div>

      {/* Goal Progress */}
      <div className="goal-progress">
        <div className="section-header">
          <h3>Goal Progress</h3>
          <div className="import-export-controls">
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              style={{ display: 'none' }}
              id="csv-import"
            />
            <label htmlFor="csv-import" className="import-btn">
              ↑ Import CSV
            </label>
            <button 
              className="export-btn" 
              onClick={() => exportToCSV(history, tasks)}
              title="Export all history to CSV"
            >
              ↓ Export CSV
            </button>
          </div>
        </div>
        {(() => {
          const goalData = getGoalProgress(history, settings);
          
          return (
            <div className="goal-cards">
              <div className="goal-card">
                <div className="goal-header">Daily Goal</div>
                <div className="goal-progress-bar">
                  <div 
                    className="goal-progress-fill" 
                    style={{ 
                      width: `${Math.min(100, goalData.daily.percentage)}%`,
                      backgroundColor: goalData.daily.percentage >= 100 ? '#28a745' : '#c44540'
                    }}
                  />
                </div>
                <div className="goal-stats">
                  <span className="goal-current">{goalData.daily.current}</span>
                  <span className="goal-separator">/</span>
                  <span className="goal-target">{goalData.daily.goal}</span>
                  <span className="goal-percentage">({goalData.daily.percentage}%)</span>
                </div>
              </div>
              
              <div className="goal-card">
                <div className="goal-header">Weekly Goal</div>
                <div className="goal-progress-bar">
                  <div 
                    className="goal-progress-fill" 
                    style={{ 
                      width: `${Math.min(100, goalData.weekly.percentage)}%`,
                      backgroundColor: goalData.weekly.percentage >= 100 ? '#28a745' : '#c44540'
                    }}
                  />
                </div>
                <div className="goal-stats">
                  <span className="goal-current">{goalData.weekly.current}</span>
                  <span className="goal-separator">/</span>
                  <span className="goal-target">{goalData.weekly.goal}</span>
                  <span className="goal-percentage">({goalData.weekly.percentage}%)</span>
                </div>
              </div>
              
              <div className="goal-card">
                <div className="goal-header">Monthly Goal</div>
                <div className="goal-progress-bar">
                  <div 
                    className="goal-progress-fill" 
                    style={{ 
                      width: `${Math.min(100, goalData.monthly.percentage)}%`,
                      backgroundColor: goalData.monthly.percentage >= 100 ? '#28a745' : '#c44540'
                    }}
                  />
                </div>
                <div className="goal-stats">
                  <span className="goal-current">{goalData.monthly.current}</span>
                  <span className="goal-separator">/</span>
                  <span className="goal-target">{goalData.monthly.goal}</span>
                  <span className="goal-percentage">({goalData.monthly.percentage}%)</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

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
                {week.map((day, dayIdx) => {
                  if (day !== null) {
                    const isToday = getStartOfDay(day.date.getTime()) === getStartOfDay(Date.now());
                    return (
                      <div
                        key={dayIdx}
                        className={`heatmap-day ${isToday ? 'current-day' : ''}`}
                        style={{ backgroundColor: getIntensityColor(day.count) }}
                        title={`${day.date.toLocaleDateString()}: ${day.count} sessions`}
                      />
                    );
                  } else {
                    return <div key={dayIdx} className="heatmap-day-empty" />;
                  }
                })}
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

      {/* Weekly Comparison */}
      <div className="weekly-comparison">
        <h3>Weekly Comparison</h3>
        {(() => {
          const weeklyData = getWeeklyComparison(history);
          const getTrendIcon = (change: number) => {
            if (change > 5) return '↑';
            if (change < -5) return '↓';
            return '→';
          };
          const getTrendColor = (change: number) => {
            if (change > 5) return '#28a745';
            if (change < -5) return '#dc3545';
            return '#6c757d';
          };

          return (
            <div className="weekly-cards">
              <div className="weekly-card">
                <div className="weekly-header">This Week</div>
                <div className="weekly-stats">
                  <div className="weekly-stat">
                    <span className="weekly-value">{weeklyData.current.sessions}</span>
                    <span className="weekly-label">sessions</span>
                  </div>
                  <div className="weekly-stat">
                    <span className="weekly-value">{weeklyData.current.hours}h</span>
                    <span className="weekly-label">hours</span>
                  </div>
                </div>
              </div>
              
              <div className="weekly-card">
                <div className="weekly-header">Last Week</div>
                <div className="weekly-stats">
                  <div className="weekly-stat">
                    <span className="weekly-value">{weeklyData.previous.sessions}</span>
                    <span className="weekly-label">sessions</span>
                  </div>
                  <div className="weekly-stat">
                    <span className="weekly-value">{weeklyData.previous.hours}h</span>
                    <span className="weekly-label">hours</span>
                  </div>
                </div>
              </div>
              
              <div className="weekly-card trend-card">
                <div className="weekly-header">Trend</div>
                <div className="trend-stats">
                  <div className="trend-item">
                    <span className="trend-icon">{getTrendIcon(weeklyData.sessionChange)}</span>
                    <span 
                      className="trend-value" 
                      style={{ color: getTrendColor(weeklyData.sessionChange) }}
                    >
                      {weeklyData.sessionChange > 0 ? '+' : ''}{weeklyData.sessionChange}%
                    </span>
                    <span className="trend-label">sessions</span>
                  </div>
                  <div className="trend-item">
                    <span className="trend-icon">{getTrendIcon(weeklyData.hourChange)}</span>
                    <span 
                      className="trend-value" 
                      style={{ color: getTrendColor(weeklyData.hourChange) }}
                    >
                      {weeklyData.hourChange > 0 ? '+' : ''}{weeklyData.hourChange}%
                    </span>
                    <span className="trend-label">hours</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Today's Recent Activity */}
      <div className="recent-activity">
        <h3>Today's Recent Activity</h3>
        {(() => {
          const today = getStartOfDay(Date.now());
          
          const todayEntries = history
            .filter(entry => {
              return getStartOfDay(entry.completedAt) === today;
            })
            .sort((a, b) => b.completedAt - a.completedAt) // Descending order
            .slice(0, 10); // Limit to 10 most recent
          
          if (todayEntries.length === 0) {
            return <p className="no-activity">No sessions completed today yet. Start your first session!</p>;
          }
          
          return (
            <div className="activity-list">
              {todayEntries.map(entry => {
                const task = tasks.find(t => t.id === entry.taskId);
                const time = new Date(entry.completedAt).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });
                const duration = Math.floor(entry.duration / 60);
                
                return (
                  <div key={entry.id} className="activity-item">
                    <div className="activity-time">{time}</div>
                    <div 
                      className="activity-task"
                      style={{ borderLeft: `4px solid ${task?.color || '#c44540'}` }}
                    >
                      <div className="activity-task-name">{entry.taskName}</div>
                      <div className="activity-details">
                        {entry.mode === 'work' ? '💼' : entry.mode === 'longBreak' ? '☕' : '☕'} 
                        {entry.mode} • {duration}m
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
