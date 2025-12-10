import { useState } from 'react';
import type { Settings, TimerMode } from './types';

type Props = {
  onStartCycle: (mode: TimerMode) => void;
  onGoToTimer: () => void;
  settings: Settings;
  nextMode: TimerMode;
  sessions: number;
};

export default function CyclePrompt({ onStartCycle, onGoToTimer, settings, nextMode, sessions }: Props) {
  const [shouldClose, setShouldClose] = useState(settings.autoCloseTab);

  const handleStartCycle = (mode: TimerMode) => {
    onStartCycle(mode);
    if (shouldClose) {
      window.close();
    }
  };

  const handleGoToTimer = () => {
    onGoToTimer();
    // Don't close tab when going to timer view - user wants to use the timer
  };

  const getNextBreakType = () => {
    return sessions % 4 === 0 ? 'Long Break' : 'Break';
  };

  const getModeLabel = (mode: TimerMode) => {
    if (mode === 'work') return 'Work';
    if (mode === 'longBreak') return 'Long Break';
    return 'Break';
  };

  return (
    <div className="cycle-prompt">
      <div className="cycle-prompt-content">
        <h2>🍅 Cycle Complete!</h2>
        <p>Next up: <strong>{getModeLabel(nextMode)}</strong></p>
        
        <div className="cycle-actions">
          <button onClick={() => handleStartCycle('work')} className="cycle-btn">
            💼 Start Work Session
          </button>
          <button onClick={() => handleStartCycle(sessions % 4 === 0 ? 'longBreak' : 'break')} className="cycle-btn">
            ☕ Start {getNextBreakType()}
          </button>
          <button onClick={handleGoToTimer} className="cycle-btn secondary">
            ⚙️ Go to Timer View
          </button>
        </div>

        <div className="close-option">
          <label>
            <input
              type="checkbox"
              checked={shouldClose}
              onChange={(e) => setShouldClose(e.target.checked)}
            />
            Close tab after selection
          </label>
        </div>
      </div>
    </div>
  );
}
