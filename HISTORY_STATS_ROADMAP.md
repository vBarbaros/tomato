# History Statistics & Charts Roadmap

This document outlines additional statistics and visualizations to add below the Activity Heatmap in the History view.

---

## 1. Productivity by Day of Week

### Description
Bar chart showing total sessions and hours completed for each day of the week (Monday-Sunday).

### Purpose
- Identify most/least productive days
- Recognize weekly patterns
- Help users optimize their schedule

### Implementation
1. **Data Processing**
   - Filter history entries by selected time period
   - Group entries by day of week (0=Sunday, 1=Monday, etc.)
   - Calculate total sessions and total hours for each day
   - Calculate average sessions per day of week

2. **Visualization**
   - Vertical bar chart with 7 bars (one per day)
   - X-axis: Day names (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
   - Y-axis: Number of sessions or hours
   - Toggle between "Sessions" and "Hours" view
   - Highlight the most productive day

3. **Code Location**
   - Add to `History.tsx` below the heatmap
   - Create helper function: `getProductivityByDayOfWeek()`

### Settings Page Changes
**None required** - Uses existing data

### Time Period Adaptation
✅ **Must adapt** - Only show data for the selected time period (month, 3 months, 6 months, year)

---

## 2. Productivity by Hour of Day

### Description
Bar chart showing sessions completed by hour or time blocks throughout the day.

### Purpose
- Identify peak productivity hours
- Determine if user is a morning person or night owl
- Optimize work schedule around natural energy peaks

### Implementation
1. **Data Processing**
   - Filter history entries by selected time period
   - Extract hour from `completedAt` timestamp
   - Group into time blocks:
     - Early Morning: 6:00-9:00
     - Morning: 9:00-12:00
     - Afternoon: 12:00-17:00
     - Evening: 17:00-21:00
     - Night: 21:00-24:00
     - Late Night: 0:00-6:00
   - Count sessions per time block

2. **Visualization**
   - Horizontal bar chart with 6 bars (one per time block)
   - Y-axis: Time block names
   - X-axis: Number of sessions
   - Color-code bars by time of day (lighter for morning, darker for night)
   - Show percentage of total sessions

3. **Code Location**
   - Add to `History.tsx` below day-of-week chart
   - Create helper function: `getProductivityByHour()`

### Settings Page Changes
**None required** - Uses existing data

### Time Period Adaptation
✅ **Must adapt** - Only show data for the selected time period

---

## 3. Task Distribution

### Description
Pie chart or horizontal bar chart showing time spent on each task.

### Purpose
- Visualize which tasks consume most time
- Identify task priorities
- Balance workload across tasks

### Implementation
1. **Data Processing**
   - Filter history entries by selected time period
   - Group by `taskId`
   - Sum total duration for each task
   - Calculate percentage of total time
   - Sort by duration (descending)

2. **Visualization**
   - Horizontal bar chart (easier to read than pie for many tasks)
   - Y-axis: Task names
   - X-axis: Hours spent
   - Show percentage next to each bar
   - Use task colors if available
   - Limit to top 10 tasks, group rest as "Other"

3. **Code Location**
   - Add to `History.tsx` below hour-of-day chart
   - Create helper function: `getTaskDistribution()`

### Settings Page Changes
**None required** - Uses existing tasks and data

### Time Period Adaptation
✅ **Must adapt** - Only show data for the selected time period

---

## 4. Streak Tracking

### Description
Display current streak, longest streak, and visual streak calendar.

### Purpose
- Motivate consistency
- Gamify the experience
- Encourage daily habit formation

### Implementation
1. **Data Processing**
   - Calculate current streak: consecutive days with at least 1 completed session
   - Calculate longest streak: maximum consecutive days ever
   - Identify streak start date
   - Check if streak is active (session completed today)

2. **Visualization**
   - Card-based layout with 3 metrics:
     - 🔥 Current Streak: X days
     - 🏆 Longest Streak: Y days
     - 📅 Streak Started: Date
   - Visual indicator: 🔥 if active today, ⚠️ if at risk (no session today)
   - Mini calendar showing last 30 days with streak indicators

3. **Code Location**
   - Add to `History.tsx` as a prominent card at the top
   - Create helper functions: `calculateCurrentStreak()`, `calculateLongestStreak()`

### Settings Page Changes
**Optional Enhancement:**
- Add "Streak Goal" setting (e.g., maintain 30-day streak)
- Add "Minimum Sessions per Day" for streak (default: 1)

### Time Period Adaptation
❌ **Does NOT adapt** - Always shows all-time streaks, but can show "Streak in selected period"

---

## 5. Session Length Analysis

### Description
Statistics about session durations: average, shortest, longest, and distribution.

### Purpose
- Understand session patterns
- Identify if sessions are too short or too long
- Optimize work duration settings

### Implementation
1. **Data Processing**
   - Filter history entries by selected time period
   - Calculate:
     - Average session duration
     - Median session duration
     - Shortest session
     - Longest session
   - Create distribution buckets (e.g., 15-20 min, 20-25 min, 25-30 min)

2. **Visualization**
   - Stats cards showing avg/median/min/max
   - Small histogram showing distribution
   - Compare to configured work duration setting

3. **Code Location**
   - Add to `History.tsx` as a stats row
   - Create helper function: `getSessionLengthStats()`

### Settings Page Changes
**None required** - Uses existing data and settings

### Time Period Adaptation
✅ **Must adapt** - Only analyze sessions in the selected time period

---

## 6. Weekly Comparison

### Description
Compare current week's productivity to previous week with trend indicators.

### Purpose
- Track improvement over time
- Identify positive/negative trends
- Provide actionable feedback

### Implementation
1. **Data Processing**
   - Get current week's sessions and hours
   - Get previous week's sessions and hours
   - Calculate percentage change
   - Determine trend: improving (↑), declining (↓), stable (→)

2. **Visualization**
   - Side-by-side comparison cards:
     - This Week: X sessions, Y hours
     - Last Week: A sessions, B hours
   - Trend indicator with percentage: ↑ +15% or ↓ -10%
   - Color-code: green for improvement, red for decline, gray for stable
   - Line chart showing last 4-8 weeks

3. **Code Location**
   - Add to `History.tsx` as a comparison section
   - Create helper function: `getWeeklyComparison()`

### Settings Page Changes
**None required** - Uses existing data

### Time Period Adaptation
⚠️ **Partial adaptation** - Only show if time period includes at least 2 weeks

---

## 7. Monthly Goals Progress

### Description
Progress bar showing completion towards user-defined monthly goals.

### Purpose
- Set and track concrete goals
- Increase motivation
- Provide clear targets

### Implementation
1. **Data Processing**
   - Get user's goal from settings (sessions per day/week/month)
   - Calculate current progress in selected period
   - Calculate percentage complete
   - Calculate sessions needed to reach goal
   - Project if goal will be met based on current pace

2. **Visualization**
   - Progress bar with percentage
   - Text: "X of Y sessions completed"
   - Projection: "On track to complete Z sessions by end of month"
   - Color-code: green if on track, yellow if behind, red if significantly behind

3. **Code Location**
   - Add to `History.tsx` at the top (high visibility)
   - Create helper function: `getGoalProgress()`

### Settings Page Changes
**Required:**
- Add "Goals" section in Settings
- Add input: "Daily Session Goal" (default: 4)
- Add input: "Weekly Session Goal" (default: 20)
- Add input: "Monthly Session Goal" (default: 80)
- Store in settings: `dailyGoal`, `weeklyGoal`, `monthlyGoal`

### Time Period Adaptation
✅ **Must adapt** - Show goal progress for the selected time period
- Month: Show monthly goal
- 3 months: Show quarterly goal (monthly × 3)
- 6 months: Show semi-annual goal
- Year: Show yearly goal

---

## 8. Focus Score

### Description
Metric showing session completion rate and consistency.

### Purpose
- Measure focus quality
- Track improvement in focus over time
- Identify distractions

### Implementation
1. **Data Processing**
   - Calculate completed sessions (full duration)
   - Calculate interrupted sessions (if tracking is added)
   - Calculate consistency: sessions per day variance
   - Generate focus score: 0-100 based on:
     - Completion rate (50%)
     - Consistency (30%)
     - Streak maintenance (20%)

2. **Visualization**
   - Large circular progress indicator showing score (0-100)
   - Color-coded: 
     - 80-100: Excellent (green)
     - 60-79: Good (blue)
     - 40-59: Fair (yellow)
     - 0-39: Needs Improvement (red)
   - Breakdown showing component scores
   - Tips for improvement

3. **Code Location**
   - Add to `History.tsx` as a prominent card
   - Create helper function: `calculateFocusScore()`

### Settings Page Changes
**Optional Enhancement:**
- Add toggle: "Track Interrupted Sessions" (requires background tracking)
- Add "Focus Goal" (target score)

### Time Period Adaptation
✅ **Must adapt** - Calculate score based on selected time period

---

## Implementation Priority

### Phase 1 (High Impact, Low Complexity)
1. **Productivity by Day of Week** - Simple, highly useful
2. **Streak Tracking** - Motivational, easy to implement
3. **Task Distribution** - Visual, helps with planning

### Phase 2 (Medium Complexity)
4. **Productivity by Hour of Day** - Requires time parsing
5. **Session Length Analysis** - Statistical calculations
6. **Weekly Comparison** - Trend analysis

### Phase 3 (Requires Settings Changes)
7. **Monthly Goals Progress** - Needs settings UI
8. **Focus Score** - Complex algorithm, needs refinement

---

## Technical Notes

### Data Structure Requirements
All features use existing `HistoryEntry` structure:
```typescript
{
  id: string;
  taskId: string;
  taskName: string;
  mode: 'work' | 'break' | 'longBreak';
  duration: number; // seconds
  completedAt: number; // timestamp
}
```

### Settings Schema Updates
Add to `Settings` type in `types.ts`:
```typescript
{
  // ... existing settings
  dailyGoal?: number;
  weeklyGoal?: number;
  monthlyGoal?: number;
  trackInterruptions?: boolean;
  focusGoal?: number;
}
```

### CSS Considerations
- Use consistent chart styling
- Ensure responsive design for all charts
- Add loading states for calculations
- Use color palette consistent with existing design

### Performance
- Memoize expensive calculations
- Use `useMemo` for chart data processing
- Consider pagination for large datasets
- Cache streak calculations

---

## Future Enhancements

- Export charts as images
- Compare multiple time periods side-by-side
- AI-powered insights and recommendations
- Social features (compare with friends)
- Integration with calendar apps
- Predictive analytics (forecast future productivity)
