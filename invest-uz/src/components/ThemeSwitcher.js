import React from 'react';
import { useTheme } from '../ThemeContext';

function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();

  const themeLabels = {
    light: 'Oq Tema',
    dark: 'Qora Tema',
    blue: 'Ko\'k Tema',
    sunset: 'Qizil-Sariq Tema'
  };

  return (
    <div className="theme-switcher">
      <select 
        value={theme} 
        onChange={(e) => setTheme(e.target.value)}
        className="theme-select"
        title="Tema tanlang"
      >
        {themes.map(t => (
          <option key={t} value={t}>
            {themeLabels[t]}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ThemeSwitcher;
