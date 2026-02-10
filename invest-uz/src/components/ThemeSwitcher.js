import React from 'react';
import { useTheme } from '../ThemeContext';

function ThemeSwitcher() {
  const { theme, setTheme, themes, addCustomTheme, defaultThemes, customThemes } = useTheme();

  const themeLabels = {
    light: 'Oq Tema',
    dark: 'Qora Tema',
    blue: 'Ko\'k Tema',
    sunset: 'Qizil-Sariq Tema',
    mint: 'Yashil Tema',
    violet: 'Binafsha Tema',
  };

  // Custom theme creation UI
  const [newThemeName, setNewThemeName] = React.useState('');
  const [newBg, setNewBg] = React.useState('#ffffff');
  const [newAccent, setNewAccent] = React.useState('#ff7a59');
  const handleAddTheme = () => {
    if (!newThemeName) return;
    addCustomTheme({ name: newThemeName, label: newThemeName, colors: { bg: newBg, accent: newAccent } });
    setNewThemeName('');
    setNewBg('#ffffff');
    setNewAccent('#ff7a59');
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
            {themeLabels[t] || t}
          </option>
        ))}
      </select>
      <div className="theme-customizer">
        <input
          type="text"
          placeholder="Yangi tema nomi"
          value={newThemeName}
          onChange={e => setNewThemeName(e.target.value)}
        />
        <input
          type="color"
          value={newBg}
          onChange={e => setNewBg(e.target.value)}
          title="Fon rangi"
        />
        <input
          type="color"
          value={newAccent}
          onChange={e => setNewAccent(e.target.value)}
          title="Accent rangi"
        />
        <button onClick={handleAddTheme}>Qo'shish</button>
      </div>
    </div>
  );
}

export default ThemeSwitcher;
