/**
 * Theme Toggle Manager for Hugo CleanWhite Theme
 * Manages dark/light mode switching with system preference detection and localStorage persistence
 */

const ThemeManager = (function() {
    'use strict';

    const STORAGE_KEY = 'cleanwhite-theme';
    const THEMES = {
        LIGHT: 'light',
        DARK: 'dark'
    };

    /**
     * Get the current theme from localStorage or system preference
     */
    function getStoredTheme() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === THEMES.LIGHT || stored === THEMES.DARK) {
                return stored;
            }
        } catch (e) {
            console.warn('Unable to access localStorage:', e);
        }
        return null;
    }

    /**
     * Get system preference for dark mode
     */
    function getSystemPreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return THEMES.DARK;
        }
        return THEMES.LIGHT;
    }

    /**
     * Apply theme to document
     */
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);

        // Update toggle icon if it exists
        updateToggleIcon(theme);

        // Update Giscus theme if it exists
        updateGiscusTheme(theme);
    }

    /**
     * Update Giscus theme to match our site theme
     */
    function updateGiscusTheme(theme) {
        const giscusIframe = document.querySelector('iframe.giscus-frame');
        if (giscusIframe) {
            // Send message to Giscus to update theme
            const message = {
                setConfig: {
                    theme: theme === THEMES.DARK ? 'dark' : 'light'
                }
            };
            giscusIframe.contentWindow.postMessage(message, 'https://giscus.app');
        }
    }

    /**
     * Listen for Giscus messages
     */
    window.addEventListener('message', function(event) {
        if (event.origin !== 'https://giscus.app') return;
        if (typeof event.data !== 'object' || !event.data.giscus) return;

        const giscusData = event.data.giscus;
        // Could add more handlers here if needed
    });

    /**
     * Update the toggle button icon
     */
    function updateToggleIcon(theme) {
        const toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) return;

        const icon = toggleBtn.querySelector('i');
        if (!icon) return;

        // Remove both classes
        icon.classList.remove('fa-moon', 'fa-sun');

        // Add appropriate class
        if (theme === THEMES.DARK) {
            icon.classList.add('fa-sun');
            toggleBtn.setAttribute('title', 'Switch to light mode');
        } else {
            icon.classList.add('fa-moon');
            toggleBtn.setAttribute('title', 'Switch to dark mode');
        }
    }

    /**
     * Set theme and save to localStorage
     */
    function setTheme(theme) {
        // Add theme-switching class to disable transitions
        document.body.classList.add('theme-switching');

        // Apply the theme
        applyTheme(theme);

        // Save to localStorage
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (e) {
            console.warn('Unable to save theme preference:', e);
        }

        // Remove theme-switching class after a brief delay
        setTimeout(() => {
            document.body.classList.remove('theme-switching');
        }, 50);
    }

    /**
     * Toggle between light and dark themes
     */
    function toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || THEMES.LIGHT;
        const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
        setTheme(newTheme);
    }

    /**
     * Initialize theme on page load
     */
    function init() {
        // Get stored theme or system preference
        const storedTheme = getStoredTheme();
        const theme = storedTheme || getSystemPreference();

        // Apply theme immediately
        applyTheme(theme);

        // Set up toggle button
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                toggle();
            });
        }

        // Watch for system preference changes (only if user hasn't set a manual preference)
        if (!storedTheme && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', function(e) {
                    const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
                    applyTheme(newTheme);
                });
            } else if (mediaQuery.addListener) {
                // Fallback for older browsers
                mediaQuery.addListener(function(e) {
                    const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
                    applyTheme(newTheme);
                });
            }
        }
    }

    // Public API
    return {
        init: init,
        setTheme: setTheme,
        getTheme: function() {
            return document.documentElement.getAttribute('data-theme') || THEMES.LIGHT;
        },
        toggle: toggle,
        THEMES: THEMES
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ThemeManager.init);
} else {
    ThemeManager.init();
}

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
