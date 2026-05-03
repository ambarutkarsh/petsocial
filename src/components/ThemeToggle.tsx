import React, { useState } from 'react';
import { MdWbSunny, MdNightsStay } from 'react-icons/md';

const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(false);

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.body.classList.toggle('dark-theme', !isDark);
    };

    return (
        <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
            {isDark ? <MdWbSunny size={24} /> : <MdNightsStay size={24} />}
        </button>
    );
};

export default ThemeToggle;