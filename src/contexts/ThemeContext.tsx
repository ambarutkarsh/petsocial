import React, { createContext, useContext, useEffect, useState } from 'react';

// Define the shape of the context state.
interface ThemeContextType {
    theme: string;
    setTheme: (theme: string) => void;
}

// Create the context with a default value.
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider component.
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<string>('light');

    // Load theme from localStorage or detect system preference.
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(savedTheme || (userPrefersDark ? 'dark' : 'light'));
    }, []);

    // Persist the theme to localStorage whenever it changes.
    useEffect(() => {
        localStorage.setItem('theme', theme);
    }, [theme]);

    const value = { theme, setTheme };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Custom hook for using the ThemeContext.
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
