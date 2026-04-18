/**
 * i18n.js - Internationalization helper for CSS Copier Pro
 * Handles dynamic translation of page elements using chrome.i18n API
 */

// Translate all elements with data-i18n attribute
function localizePage() {
    // Translate text content
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (key) {
            const message = chrome.i18n.getMessage(key);
            if (message) {
                element.textContent = message;
            }
        }
    });

    // Translate title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        if (key) {
            const message = chrome.i18n.getMessage(key);
            if (message) {
                element.title = message;
            }
        }
    });

    // Translate placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (key) {
            const message = chrome.i18n.getMessage(key);
            if (message) {
                element.placeholder = message;
            }
        }
    });

    // Translate aria-label attributes
    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
        const key = element.getAttribute('data-i18n-aria');
        if (key) {
            const message = chrome.i18n.getMessage(key);
            if (message) {
                element.setAttribute('aria-label', message);
            }
        }
    });
}

// Get translated message by key
function t(key, placeholders = {}) {
    return chrome.i18n.getMessage(key, placeholders);
}

// Auto-localize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', localizePage);
} else {
    localizePage();
}
