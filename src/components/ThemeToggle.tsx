import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(false);

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.body.classList.toggle('dark-theme', !isDark);
    };

    return (
        <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
            {isDark ? <Sun size={24} /> : <Moon size={24} />}
        </button>
    );
};

export default ThemeToggle;