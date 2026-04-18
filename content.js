let isCssCopierSelectionModeActive = false;
let cssCopierHighlightedElement = null;
let cssCopierUserSettings = null;

// Используем константы из config.js
const shorterUsefulPropsReference = SHORTER_USEFUL_PROPS_REFERENCE;
const fallbackDefaultUsefulProps = shorterUsefulPropsReference;

async function loadCssCopierUserSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get({
            userUsefulProps: fallbackDefaultUsefulProps,
            useUsefulPropsFiltering: true
        }, (items) => {
            if (!Array.isArray(items.userUsefulProps) || items.userUsefulProps.length !== shorterUsefulPropsReference.length) {
                console.warn(
                    `ВНИМАНИЕ! Загруженный 'userUsefulProps' из хранилища содержит ${items.userUsefulProps ? items.userUsefulProps.length : 'N/A'} элементов или не является массивом. Это расходится с эталонным коротким списком из ${shorterUsefulPropsReference.length} элементов. Будет использован эталонный короткий список в текущей сессии.`
                );
                cssCopierUserSettings = {
                    userUsefulProps: shorterUsefulPropsReference,
                    useUsefulPropsFiltering: items.useUsefulPropsFiltering === undefined ? true : items.useUsefulPropsFiltering
                };
            } else {
                cssCopierUserSettings = items;
            }
            resolve(cssCopierUserSettings);
        });
    });
}

// только то, что реально дефолт для большинства браузеров
const STRICT_DEFAULTS_LOCAL = STRICT_DEFAULTS;

function shouldSkipComputedSize(prop, value, element) {
  let authoredFound = false;
  for (const sheet of document.styleSheets) {
    let rules = [];
    try { rules = [...(sheet.cssRules || [])]; } catch (e) { continue; }
    for (const rule of rules) {
      if (rule.selectorText && element.matches(rule.selectorText)) {
        const authored = rule.style.getPropertyValue(prop);
        if (authored) {
          authoredFound = true;
          if (/%|auto|em|rem|fr|min-content|max-content|fit-content|calc|min|max/i.test(authored)) {
            return true;
          }
        }
      }
    }
  }
  if (!authoredFound && (/^\d+(\.\d+)?px$/.test(value) || value === 'auto')) {
    return true;
  }
  return false;
}

function isDefaultLikeValue(tag, pseudo, prop, value, styles) {
    // 1. точное совпадение с браузерным дефолтом
    if (STRICT_DEFAULTS_LOCAL[prop] === value) return true;
	if (prop === 'text-decoration' && value.startsWith('none')) return true;
    // 2. border-color при border-width:0
    if (prop.endsWith('-color')) {
        const side = prop.slice(0, -6);
        const w = styles.getPropertyValue(`${side}-width`);
        const s = styles.getPropertyValue(`${side}-style`);
        if (w === '0px' || s === 'none') return true;
    }
    return false;
}

/* --------------------------------------------
 * 2.  Очищенная версия getCleanStyles
 * -------------------------------------------*/
/* --------------------------------------------
 *   mergeShorthands()  –  удаляет дублирующие
 *   лонг‑хэнды, если уже есть шорт‑хенд
 * -------------------------------------------*/
function mergeShorthands(stylesObj) {
    // 1. background
    if (stylesObj['background']) {
        delete stylesObj['background-color'];
        delete stylesObj['background-image'];
        delete stylesObj['background-size'];
        delete stylesObj['background-position'];
        delete stylesObj['background-repeat'];
    }

    // 2. border
    if (stylesObj['border']) {
        const borderLonghands = Object.keys(stylesObj)
            .filter(k => k.startsWith('border-') && k !== 'border-radius');
        borderLonghands.forEach(k => delete stylesObj[k]);
    }

	if (/^0(px)?\s+none/i.test(stylesObj['border'] || '')) {
	  delete stylesObj['border'];
	}

    // 3. overflow
    if (stylesObj['overflow']) {
        delete stylesObj['overflow-x'];
        delete stylesObj['overflow-y'];
    }

    // 4. font
    if (stylesObj['font']) {
        ['font-size', 'font-weight', 'font-style', 'line-height',
            'font-family', 'font-variant', 'font-stretch'
        ].forEach(k => delete stylesObj[k]);
    }

    return stylesObj;
}

function getCleanStyles(element, pseudoSelector = null) {
    const computed = window.getComputedStyle(element, pseudoSelector);

    /*---------------------------------------
      0.  Стили родителя, чтобы отбросить
          наследуемые значения
    ---------------------------------------*/
    const parent = element.parentElement
        ? window.getComputedStyle(element.parentElement)
        : window.getComputedStyle(document.documentElement);

    const result = Object.create(null);

    /*---------------------------------------
      1.  Какие свойства вообще проверяем
    ---------------------------------------*/
    const propsToCheck = cssCopierUserSettings?.useUsefulPropsFiltering
        ? cssCopierUserSettings.userUsefulProps
        : Array.from(computed);

    /*---------------------------------------
      2.  «Подозрительные» размеры и координаты
    ---------------------------------------*/
    const sizePropsToSkip = [
        'width', 'height',
        'min-width', 'min-height',
        'max-width', 'max-height',
        'flex-basis', 'top', 'right', 'bottom', 'left'
    ];

    for (const prop of propsToCheck) {
        const value = computed.getPropertyValue(prop).trim();
        if (!value) continue;                       // пустое

        /* 2.1  Браузерный дефолт → skip */
        if (
            isDefaultLikeValue(
                element.tagName.toLowerCase(),
                pseudoSelector,
                prop,
                value,
                computed
            )
        ) continue;

        /* 2.2  Вычисленный px‑размер или auto,
                если автор не задавал явное правило */
        if (
            sizePropsToSkip.includes(prop) &&
            shouldSkipComputedSize(prop, value, element)
        ) continue;

        /* 2.3  Нулевые margin/padding/border-radius (засоряют выдачу) */
        if (
            ['margin', 'padding', 'border-radius'].includes(prop) &&
            /^0($|px|%)$/.test(value)
        ) continue;

        /* 2.4  Совпадает с родительским (унаследованное) */
        if (parent && parent.getPropertyValue(prop) === value) continue;

        /* 2.5  Всё прошло фильтры — записываем */
        result[prop] = value;
    }

    /*---------------------------------------
      3.  Склеиваем шорт‑/лонг‑хэнды
    ---------------------------------------*/
    mergeShorthands(result);

    /*---------------------------------------
      4.  Убираем служебный хайлайт
    ---------------------------------------*/
    if (result.outline && result.outline.includes('dashed'))
        delete result.outline;
    if (
        result['box-shadow'] &&
        result['box-shadow'].includes('9999px')
    )
        delete result['box-shadow'];

    return result;
}

function formatStyles(styles) {
    return Object.entries(styles)
        .map(([prop, value]) => `  ${prop}: ${value};`)
        .join('\n');
}

function getFullSelector(element, parentSelectorChain = null) {
    if (!element || !(element instanceof Element)) return "unknown";
    const tagName = element.tagName.toLowerCase();
    let baseSelector = tagName;
    if (element.id) {
        baseSelector = `#${element.id.trim().replace(/\s+/g, '-')}`;
    } else if (element.classList && element.classList.length > 0) {
        const classList = Array.from(element.classList).filter(Boolean).join('.');
        if (classList) {
            baseSelector = `${tagName}.${classList}`;
        }
    } else {
        if (element.parentElement) {
            let index = 1;
            let sibling = element.previousElementSibling;
            while (sibling) {
                if (sibling.tagName === element.tagName) {
                    index++;
                }
                sibling = sibling.previousElementSibling;
            }
            baseSelector = `${tagName}:nth-of-type(${index})`;
        }
    }
    return parentSelectorChain ? `${parentSelectorChain} > ${baseSelector}` : baseSelector;
}

function extractElementInfo(element, currentParentSelector = null) {
    const ownSelector = getFullSelector(element, currentParentSelector);
    const info = {
        selector: ownSelector,
        styles: getCleanStyles(element),
        children: []
    };
    // Используем расширенный список псевдоэлементов из конфига
    const pseudoElements = SUPPORTED_PSEUDO_ELEMENTS || [':before', ':after', ':first-letter', ':first-line'];
    for (const pseudo of pseudoElements) {
        const pseudoStyles = getCleanStyles(element, pseudo);
		if (pseudo && Object.keys(pseudoStyles).length === 1 && pseudoStyles.background)
			continue;		
        if (Object.keys(pseudoStyles).length > 0) {
            info.children.push({
                selector: `${ownSelector}${pseudo}`,
                styles: pseudoStyles,
                children: []
            });
        }
    }
    
    // Рекурсивная обработка Shadow DOM
    if (element.shadowRoot) {
        for (const child of element.shadowRoot.children) {
            info.children.push(extractElementInfo(child, ownSelector));
        }
    } else {
        // Обычные дочерние элементы
        for (const child of element.children) {
            info.children.push(extractElementInfo(child, ownSelector));
        }
    }
	
    return info;
}

function generateOutput(elementInfo, depth = 0) {
    let output = '';
    const indent = '  '.repeat(depth);
    if (Object.keys(elementInfo.styles).length > 0) {
        output += `${indent}${elementInfo.selector} {\n`;
        output += formatStyles(elementInfo.styles);
        output += `\n${indent}}\n\n`;
    }
    for (const child of elementInfo.children) {
        output += generateOutput(child, depth + 1);
    }
    return output;
}

// Генерация SCSS вывода с вложенностью
function generateSCSSOutput(elementInfo, depth = 0) {
    let output = '';
    const indent = '  '.repeat(depth);
    
    if (Object.keys(elementInfo.styles).length > 0) {
        // Проверяем, является ли селектор псевдоэлементом
        const isPseudo = elementInfo.selector.match(/::?(before|after|first-letter|first-line)$/);
        
        if (isPseudo) {
            // Для псевдоэлементов используем вложенный синтаксис SCSS
            const parentSelector = elementInfo.selector.replace(/::?(before|after|first-letter|first-line)$/, '');
            output += `${indent}${parentSelector} {\n`;
            output += `${indent}  &${isPseudo[0]} {\n`;
            output += formatStyles(elementInfo.styles).split('\n').map(line => `${indent}    ${line}`).join('\n');
            output += `\n${indent}  }\n`;
            
            // Обрабатываем детей псевдоэлемента
            for (const child of elementInfo.children) {
                output += generateSCSSOutput(child, depth + 2);
            }
            output += `${indent}}\n\n`;
        } else {
            output += `${indent}${elementInfo.selector} {\n`;
            output += formatStyles(elementInfo.styles);
            
            // Обрабатываем детей с вложенностью
            const regularChildren = elementInfo.children.filter(child => 
                !child.selector.match(/::?(before|after|first-letter|first-line)$/)
            );
            const pseudoChildren = elementInfo.children.filter(child => 
                child.selector.match(/::?(before|after|first-letter|first-line)$/)
            );
            
            if (regularChildren.length > 0) {
                output += '\n';
                for (const child of regularChildren) {
                    // Извлекаем только часть селектора после родителя
                    const childSelectorPart = child.selector.replace(elementInfo.selector + ' > ', '');
                    output += `\n${indent}  ${childSelectorPart} {\n`;
                    output += formatStyles(child.styles).split('\n').map(line => `${indent}    ${line}`).join('\n');
                    
                    // Рекурсивно для grandchildren
                    for (const grandChild of child.children) {
                        output += generateSCSSOutput(grandChild, depth + 2);
                    }
                    output += `\n${indent}  }`;
                }
            }
            
            output += `\n${indent}}\n\n`;
            
            // Псевдоэлементы обрабатываем отдельно
            for (const pseudo of pseudoChildren) {
                output += generateSCSSOutput(pseudo, depth);
            }
        }
    } else {
        // Если нет стилей у текущего элемента, обрабатываем только детей
        for (const child of elementInfo.children) {
            output += generateSCSSOutput(child, depth);
        }
    }
    
    return output;
}

// Генерация JSON вывода
function generateJSONOutput(elementInfo) {
    const result = {
        selector: elementInfo.selector,
        styles: elementInfo.styles,
        children: elementInfo.children.map(child => generateJSONOutput(child))
    };
    return JSON.stringify(result, null, 2);
}

// Простая маппинг CSS свойств в Tailwind классы
const TAILWIND_MAPPING = {
    'display': { 'block': 'block', 'flex': 'flex', 'grid': 'grid', 'none': 'hidden', 'inline-block': 'inline-block' },
    'position': { 'absolute': 'absolute', 'relative': 'relative', 'fixed': 'fixed', 'static': 'static' },
    'flex-direction': { 'row': 'flex-row', 'column': 'flex-col' },
    'justify-content': { 'center': 'justify-center', 'flex-start': 'justify-start', 'flex-end': 'justify-end', 'space-between': 'justify-between' },
    'align-items': { 'center': 'items-center', 'flex-start': 'items-start', 'flex-end': 'items-end', 'stretch': 'items-stretch' },
    'text-align': { 'center': 'text-center', 'left': 'text-left', 'right': 'text-right' },
    'font-weight': { 'bold': 'font-bold', 'normal': 'font-normal', '300': 'font-light', '700': 'font-bold' },
    'text-decoration': { 'none': 'no-underline', 'underline': 'underline' },
    'overflow': { 'hidden': 'overflow-hidden', 'auto': 'overflow-auto', 'scroll': 'overflow-scroll' },
    'cursor': { 'pointer': 'cursor-pointer', 'default': 'cursor-default' }
};

function convertToTailwind(styles) {
    const tailwindClasses = [];
    
    for (const [prop, value] of Object.entries(styles)) {
        if (TAILWIND_MAPPING[prop] && TAILWIND_MAPPING[prop][value]) {
            tailwindClasses.push(TAILWIND_MAPPING[prop][value]);
        } else if (prop === 'width' || prop === 'height') {
            // Преобразуем px в rem для Tailwind
            const match = value.match(/^(\d+)px$/);
            if (match) {
                const remValue = Math.round(parseInt(match[1]) / 4);
                tailwindClasses.push(`w-${remValue}`);
            }
        } else if (prop === 'margin' || prop === 'padding') {
            const match = value.match(/^(\d+)px$/);
            if (match) {
                const remValue = Math.round(parseInt(match[1]) / 4);
                const prefix = prop === 'margin' ? 'm' : 'p';
                tailwindClasses.push(`${prefix}-${remValue}`);
            }
        } else if (prop === 'background-color' || prop === 'color') {
            // Простейшая обработка цветов
            if (value.startsWith('#')) {
                tailwindClasses.push(prop === 'background-color' ? `bg-[${value}]` : `text-[${value}]`);
            }
        } else if (prop === 'border-radius') {
            if (value === '4px') tailwindClasses.push('rounded');
            else if (value === '8px') tailwindClasses.push('rounded-lg');
            else if (value === '9999px') tailwindClasses.push('rounded-full');
        }
    }
    
    return tailwindClasses.join(' ');
}

function generateTailwindOutput(elementInfo, depth = 0) {
    let output = '';
    const indent = '  '.repeat(depth);
    
    if (Object.keys(elementInfo.styles).length > 0) {
        const tailwindClasses = convertToTailwind(elementInfo.styles);
        if (tailwindClasses) {
            output += `${indent}<!-- ${elementInfo.selector} -->\n`;
            output += `${indent}<div class="${tailwindClasses}">\n`;
            
            for (const child of elementInfo.children) {
                output += generateTailwindOutput(child, depth + 1);
            }
            
            output += `${indent}</div>\n\n`;
        }
    } else {
        for (const child of elementInfo.children) {
            output += generateTailwindOutput(child, depth);
        }
    }
    
    return output;
}

async function activateSelectionMode() {
    if (isCssCopierSelectionModeActive) return;
    await loadCssCopierUserSettings();
    isCssCopierSelectionModeActive = true;
    document.body.style.cursor = 'crosshair';
    document.addEventListener('mouseover', handleMouseOverForHighlight);
    document.addEventListener('mouseout', handleMouseOutOfHighlight);
    document.addEventListener('click', handlePageClickForSelection, {
        capture: true
    });
    document.addEventListener('keydown', handleKeyDownForEscape);
}

function deactivateSelectionMode() {
    isCssCopierSelectionModeActive = false;
    document.body.style.cursor = '';
    if (cssCopierHighlightedElement) {
        cssCopierHighlightedElement.classList.remove('css-copier-highlight');
        cssCopierHighlightedElement = null;
    }
    document.removeEventListener('mouseover', handleMouseOverForHighlight);
    document.removeEventListener('mouseout', handleMouseOutOfHighlight);
    document.removeEventListener('click', handlePageClickForSelection, {
        capture: true
    });
    document.removeEventListener('keydown', handleKeyDownForEscape);
}

function handleMouseOverForHighlight(e) {
    if (!isCssCopierSelectionModeActive) return;
    if (cssCopierHighlightedElement) {
        cssCopierHighlightedElement.classList.remove('css-copier-highlight');
    }
    cssCopierHighlightedElement = e.target;
    cssCopierHighlightedElement.classList.add('css-copier-highlight');
}

function handleMouseOutOfHighlight() {
    if (cssCopierHighlightedElement) {
        cssCopierHighlightedElement.classList.remove('css-copier-highlight');
        cssCopierHighlightedElement = null;
    }
}

function handlePageClickForSelection(e) {
    if (!isCssCopierSelectionModeActive || !cssCopierUserSettings) return;
    e.preventDefault();
    e.stopPropagation();
    const clickedElement = e.target;
    deactivateSelectionMode();
    if (clickedElement) {
        const elementInfo = extractElementInfo(clickedElement, null);
        
        // Получаем формат экспорта из настроек
        const exportFormat = cssCopierUserSettings.exportFormat || 'css';
        
        let output;
        switch(exportFormat) {
            case 'scss':
                output = generateSCSSOutput(elementInfo);
                break;
            case 'json':
                output = generateJSONOutput(elementInfo);
                break;
            case 'tailwind':
                output = generateTailwindOutput(elementInfo);
                break;
            default:
                output = generateOutput(elementInfo);
        }
        
        const cleanCSS = output;
        
        // Сохраняем в историю копирования
        saveToCopyHistory(cleanCSS, exportFormat);
        
        navigator.clipboard.writeText(cleanCSS).then(() => {
            showTemporaryNotification(chrome.i18n.getMessage("copiedToClipboardMsg"));
            console.info(cleanCSS);
        }).catch(err => {
            console.error(err, cleanCSS);
            showTemporaryNotification(chrome.i18n.getMessage("errorCopiedToClipboardMsg"), true);
        });
    }
}

// Функция сохранения истории копирования
function saveToCopyHistory(content, format) {
    if (!cssCopierUserSettings.copyHistoryEnabled) return;
    
    const historyItem = {
        id: Date.now(),
        content: content,
        format: format,
        timestamp: new Date().toISOString(),
        url: window.location.href
    };
    
    chrome.storage.local.get({ copyHistory: [] }, (items) => {
        let history = items.copyHistory || [];
        history.unshift(historyItem);
        
        // Ограничиваем количество записей
        const maxItems = cssCopierUserSettings.maxHistoryItems || 10;
        if (history.length > maxItems) {
            history = history.slice(0, maxItems);
        }
        
        chrome.storage.local.set({ copyHistory: history });
    });
}

function handleKeyDownForEscape(e) {
    if (e.key === "Escape" && isCssCopierSelectionModeActive) {
        deactivateSelectionMode();
        showTemporaryNotification(chrome.i18n.getMessage("selectionCancelledMsg"), false, 1500);
    }
}

function showTemporaryNotification(message, isError = false, duration = 3000) {
    const notificationId = 'css-copier-notification';
    let existingNotification = document.getElementById(notificationId);
    if (existingNotification) existingNotification.remove();
    const notification = document.createElement('div');
    notification.id = notificationId;
    Object.assign(notification.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        padding: '16px 30px',
        backgroundColor: isError ? '#e74c3c' : '#2ecc71',
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 5px 20px rgba(0,0,0,0.25)',
        zIndex: '2147483647',
        fontSize: '16px',
        fontWeight: '500',
        textAlign: 'center',
        opacity: '0',
        transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'
    });
    notification.textContent = message;
    document.body.appendChild(notification);
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translate(-50%, -50%) scale(1.05)';
        setTimeout(() => {
            notification.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 150);
    });
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translate(-50%, -50%) scale(0.9)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "initCSSExtraction") {
        if (isCssCopierSelectionModeActive) {
            deactivateSelectionMode();
            sendResponse({
                status: "selectionModeToggled",
                isActive: isCssCopierSelectionModeActive
            });
        } else {
            activateSelectionMode().then(() => {
                sendResponse({
                    status: "selectionModeToggled",
                    isActive: isCssCopierSelectionModeActive
                });
            }).catch(error => {
                console.error("CSS Copier Content V1.6.4: Error activating selection mode:", error);
                sendResponse({
                    status: "error",
                    message: error.message
                });
            });
        }
        return true;
    }
});