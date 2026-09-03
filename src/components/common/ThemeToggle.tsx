import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  id?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  id = 'theme-toggle-btn'
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      id={id}
      type="button"
      onClick={toggleTheme}
      className={`ec-theme-toggle ${className}`}
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      title={isDark ? 'Passer en thème clair (ivoire)' : 'Passer en thème sombre (noir & or)'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
};
