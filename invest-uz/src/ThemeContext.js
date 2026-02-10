import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const savedTheme = localStorage.getItem('app-theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = (themeName) => {
    setThemeState(themeName);
  };

    const defaultThemes = [
      { name: 'light', label: 'Light', colors: { bg: '#fff2d9', accent: '#ff7a59' } },
      { name: 'dark', label: 'Dark', colors: { bg: '#0d0b17', accent: '#ff7a59' } },
      { name: 'blue', label: 'Blue', colors: { bg: '#e3f2fd', accent: '#1976d2' } },
      { name: 'sunset', label: 'Sunset', colors: { bg: '#fff3e0', accent: '#ff6f00' } },
      { name: 'mint', label: 'Mint', colors: { bg: '#e0fff7', accent: '#3ccf91' } },
      { name: 'violet', label: 'Violet', colors: { bg: '#f3e4ff', accent: '#7c4dff' } },
    ];
    const [customThemes, setCustomThemes] = useState([]);
    const themes = [...defaultThemes.map(t => t.name), ...customThemes.map(t => t.name)];

    const addCustomTheme = (themeObj) => {
      setCustomThemes(prev => [...prev, themeObj]);
    };

  return (
      <ThemeContext.Provider value={{ theme, setTheme, themes, addCustomTheme, customThemes, defaultThemes }}>
        {children}
      </ThemeContext.Provider>
  );
};
