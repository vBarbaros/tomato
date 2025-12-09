import type { Settings as SettingsType } from './types';

type Props = {
  settings: SettingsType;
  onSave: (settings: SettingsType) => void;
};

export default function Settings({ settings, onSave }: Props) {
  const handleChange = (key: keyof SettingsType, value: number | boolean) => {
    onSave({ ...settings, [key]: value });
  };

  return (
    <div className="view">
      <div className="settings-group">
        <h3>Timer Durations (minutes)</h3>
        
        <div className="setting-item">
          <label>Work Duration</label>
          <input
            type="number"
            min="1"
            max="60"
            value={settings.workDuration}
            onChange={(e) => handleChange('workDuration', parseInt(e.target.value) || 25)}
          />
        </div>

        <div className="setting-item">
          <label>Break Duration</label>
          <input
            type="number"
            min="1"
            max="30"
            value={settings.breakDuration}
            onChange={(e) => handleChange('breakDuration', parseInt(e.target.value) || 5)}
          />
        </div>

        <div className="setting-item">
          <label>Long Break Duration</label>
          <input
            type="number"
            min="1"
            max="60"
            value={settings.longBreakDuration}
            onChange={(e) => handleChange('longBreakDuration', parseInt(e.target.value) || 15)}
          />
        </div>
      </div>

      <div className="settings-group">
        <h3>Auto-Start</h3>
        
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.autoStartBreaks}
              onChange={(e) => handleChange('autoStartBreaks', e.target.checked)}
            />
            Auto-start breaks
          </label>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.autoStartWork}
              onChange={(e) => handleChange('autoStartWork', e.target.checked)}
            />
            Auto-start work sessions
          </label>
        </div>
      </div>

      <div className="settings-group">
        <h3>Sound Effects</h3>
        
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => handleChange('soundEnabled', e.target.checked)}
            />
            Enable completion sounds
          </label>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.tickSoundEnabled}
              onChange={(e) => handleChange('tickSoundEnabled', e.target.checked)}
            />
            Enable tick sound
          </label>
        </div>
      </div>

      <div className="disclaimer">
        Pomodoro® and The Pomodoro Technique® are trademarks of Francesco Cirillo. Tomato Timer is not affiliated or associated with or endorsed by Pomodoro®, The Pomodoro Technique® or Francesco Cirillo.
      </div>
    </div>
  );
}
