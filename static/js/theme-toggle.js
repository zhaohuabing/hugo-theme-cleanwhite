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
        // Check if user wants auto theme based on sunrise/sunset
        const useAutoTheme = document.documentElement.getAttribute('data-auto-theme') === 'true';

        if (useAutoTheme) {
            return getSunriseSunsetTheme();
        }

        // Fall back to system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return THEMES.DARK;
        }
        return THEMES.LIGHT;
    }

    /**
     * Calculate sunrise/sunset times and determine appropriate theme
     */
    function getSunriseSunsetTheme() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentTime = hours + minutes / 60;

        // Simple algorithm for sunrise/sunset based on day of year
        // Approximate values (can be improved with precise calculation)
        const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));

        // Approximate sunrise/sunset times for mid-latitude locations
        // Sunrise ranges from ~6:30 to ~7:30 (varies by season)
        // Sunset ranges from ~16:30 to ~19:30 (varies by season)
        const baseSunrise = 6.5; // 6:30 AM
        const baseSunset = 18.5; // 6:30 PM

        // Seasonal adjustment (±1 hour)
        const seasonalOffset = Math.sin((dayOfYear - 80) / 365 * 2 * Math.PI) * 1;

        const sunriseTime = baseSunrise + seasonalOffset;
        const sunsetTime = baseSunset + seasonalOffset;

        // Dark mode before sunrise or after sunset
        if (currentTime < sunriseTime || currentTime > sunsetTime) {
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
     * Update Giscus theme dynamically
     */
    function updateGiscusTheme(theme) {
        const iframe = document.querySelector('iframe[src*="giscus.app"]');
        if (!iframe) return;

        try {
            // Send postMessage to Giscus iframe to update theme
            iframe.contentWindow.postMessage({
                giscus: {
                    setConfig: {
                        theme: theme
                    }
                }
            }, 'https://giscus.app');
        } catch (e) {
            // If iframe isn't ready yet, retry after a short delay
            console.warn('Failed to update Giscus theme, retrying...', e);
            setTimeout(function() {
                updateGiscusTheme(theme);
            }, 100);
        }
    }

    /**
     * Update the toggle button icon
     */
    function updateToggleIcon(theme) {
        const toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) return;

        const moonIcon = toggleBtn.querySelector('.fa-moon');
        const sunIcon = toggleBtn.querySelector('.fa-sun');

        // Handle new method (both icons present, show/hide)
        if (moonIcon && sunIcon) {
            if (theme === THEMES.DARK) {
                moonIcon.style.display = 'none';
                sunIcon.style.display = 'inline';
                toggleBtn.setAttribute('title', 'Switch to light mode');
            } else {
                moonIcon.style.display = 'inline';
                sunIcon.style.display = 'none';
                toggleBtn.setAttribute('title', 'Switch to dark mode');
            }
            return;
        }

        // Handle old method (single icon, swap classes)
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

        // Check if auto-theme (sunrise/sunset) is enabled
        const useAutoTheme = document.documentElement.getAttribute('data-auto-theme') === 'true';

        if (useAutoTheme && !storedTheme) {
            // Update theme every minute based on sunrise/sunset
            setInterval(function() {
                const newTheme = getSunriseSunsetTheme();
                const currentTheme = document.documentElement.getAttribute('data-theme');
                if (newTheme !== currentTheme) {
                    applyTheme(newTheme);
                }
            }, 60000); // Check every minute
        }

        // Watch for system preference changes (only if user hasn't set a manual preference)
        if (!storedTheme && !useAutoTheme && window.matchMedia) {
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
