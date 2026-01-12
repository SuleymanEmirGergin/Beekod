import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

// Test component to access theme context
function TestComponent() {
    const { theme, toggleTheme } = useTheme();
    return (
        <div>
            <span data-testid="theme-value">{theme}</span>
            <button data-testid="toggle-btn" onClick={toggleTheme}>
                Toggle
            </button>
        </div>
    );
}

describe('ThemeContext', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.classList.remove('dark');
    });

    it('should provide default light theme', () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        expect(screen.getByTestId('theme-value').textContent).toBe('light');
    });

    it('should toggle theme from light to dark', () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        const toggleBtn = screen.getByTestId('toggle-btn');
        fireEvent.click(toggleBtn);

        expect(screen.getByTestId('theme-value').textContent).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should persist theme to localStorage', () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        const toggleBtn = screen.getByTestId('toggle-btn');
        fireEvent.click(toggleBtn);

        expect(localStorage.getItem('beekod-theme')).toBe('dark');
    });

    it('should read theme from localStorage on mount', () => {
        localStorage.setItem('beekod-theme', 'dark');

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        expect(screen.getByTestId('theme-value').textContent).toBe('dark');
    });
});
