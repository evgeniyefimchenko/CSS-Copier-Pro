/**
 * CSS Copier Pro - Единый конфигурационный файл
 * Версия: 2.0.0
 * 
 * Этот файл содержит все константы и настройки для синхронизации между модулями
 */

// Базовый список полезных CSS свойств (короткая версия для content.js)
const SHORTER_USEFUL_PROPS_REFERENCE = [
    'position', 'display', 'float', 'clear',
    'top', 'right', 'bottom', 'left', 'z-index',
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'margin', 'padding',
    'border', 'border-radius',
    'background', 'background-color', 'background-image',
    'color', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height',
    'text-align', 'text-decoration', 'text-transform', 'vertical-align',
    'opacity', 'visibility',
    'overflow', 'overflow-x', 'overflow-y',
    'box-shadow', 'transform', 'transition', 'animation',
    'cursor', 'list-style', '--brand', '--radius', '--gap'
];

// Полный список полезных CSS свойств (для options.js и background.js)
const DEFAULT_USEFUL_PROPS_LIST = [
    'position', 'display', 'float', 'clear',
    'top', 'right', 'bottom', 'left', 'z-index',
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'margin', 'padding',
    'border', 'border-radius',
    'background', 'background-color', 'background-image',
    'color', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height',
    'text-align', 'text-decoration', 'text-transform', 'vertical-align',
    'opacity', 'visibility',
    'overflow', 'overflow-x', 'overflow-y',
    'box-shadow', 'transform', 'transition', 'animation',
    'cursor', 'list-style',
    'flex', 'flex-grow', 'flex-shrink', 'flex-basis',
    'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-content', 'align-self',
    'order',
    'grid', 'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row',
    'grid-auto-flow', 'grid-gap', 'gap', '--brand', '--radius', '--gap'
];

// Строгие значения по умолчанию для браузеров
const STRICT_DEFAULTS = {
    'position': 'static',
    'top': 'auto',
    'right': 'auto',
    'bottom': 'auto',
    'left': 'auto',
    'margin-top': '0px',
    'margin-right': '0px',
    'margin-bottom': '0px',
    'margin-left': '0px',
    'padding-top': '0px',
    'padding-right': '0px',
    'padding-bottom': '0px',
    'padding-left': '0px',
    'border-top-width': '0px',
    'border-right-width': '0px',
    'border-bottom-width': '0px',
    'border-left-width': '0px',
    'transform-origin': '50% 50%',
    'transform': 'matrix(1, 0, 0, 1, 0, 0)',
    'opacity': '1',
    'font-style': 'normal',
    'text-decoration-line': 'none',
    'vertical-align': 'baseline',
    'min-width': '0px',
    'min-height': '0px',
    'text-decoration': 'none solid rgb(0,0,0)',
    'overflow': 'visible',
    'overflow-x': 'visible',
    'overflow-y': 'visible'
};

// Поддерживаемые псевдоэлементы
const SUPPORTED_PSEUDO_ELEMENTS = [':before', ':after', ':first-letter', ':first-line'];

// Расширенные псевдоклассы для будущего расширения
const SUPPORTED_PSEUDO_CLASSES = [':hover', ':focus', ':active', ':visited', ':focus-within'];

// Форматы экспорта
const EXPORT_FORMATS = {
    CSS: 'css',
    SCSS: 'scss',
    JSON: 'json',
    TAILWIND: 'tailwind'
};

// Настройки по умолчанию
const DEFAULT_SETTINGS = {
    userUsefulProps: DEFAULT_USEFUL_PROPS_LIST,
    useUsefulPropsFiltering: true,
    exportFormat: EXPORT_FORMATS.CSS,
    includePseudoElements: true,
    includeMediaQueries: false,
    copyHistoryEnabled: true,
    maxHistoryItems: 10
};

// Версия плагина
const PLUGIN_VERSION = '2.0.0';

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SHORTER_USEFUL_PROPS_REFERENCE,
        DEFAULT_USEFUL_PROPS_LIST,
        STRICT_DEFAULTS,
        SUPPORTED_PSEUDO_ELEMENTS,
        SUPPORTED_PSEUDO_CLASSES,
        EXPORT_FORMATS,
        DEFAULT_SETTINGS,
        PLUGIN_VERSION
    };
}
