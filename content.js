let isCssCopierSelectionModeActive = false;
let cssCopierHighlightedElement = null;
let cssCopierUserSettings = null;

const shorterUsefulPropsReference = [ 
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
  'cursor', 'list-style'
];
const fallbackDefaultUsefulProps = shorterUsefulPropsReference;


async function loadCssCopierUserSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get({
            userUsefulProps: fallbackDefaultUsefulProps,
            useUsefulPropsFiltering: true
        }, (items) => {
            if (!Array.isArray(items.userUsefulProps) || items.userUsefulProps.length !== shorterUsefulPropsReference.length) {
                console.warn(`CSS Copier Content V1.6.4: WARNING! Loaded 'userUsefulProps' from storage has ${items.userUsefulProps ? items.userUsefulProps.length : 'N/A'} items, or is not an array. This differs from the reference short list count of ${shorterUsefulPropsReference.length}. Forcing use of reference short list as the current session's effective list.`);
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

function isDefaultLikeValue(elementTag, pseudoSelector, property, value, computedStylesOfElement) {
    if (value === null || value === undefined || value === '') return true;
    const baseDefaultsRegex = /^(0px|0%|none|auto|normal|transparent|rgba\(0,\s*0,\s*0,\s*0\))$/i;
    if (baseDefaultsRegex.test(value)) {
        return true;
    }

    if (property.includes('border') && property.endsWith('color')) {
        const stylePropPart = property.substring(0, property.lastIndexOf('-color')); 
        const borderStyle = computedStylesOfElement.getPropertyValue(`${stylePropPart}-style`);
        const borderWidth = computedStylesOfElement.getPropertyValue(`${stylePropPart}-width`);
        if (borderStyle === 'none' || borderWidth === '0px') {
            return true;
        }
    }
    
    if (property === 'position' && value === 'static') return true;
    if (pseudoSelector && property === 'display' && value === 'inline') return true;
    if (property.startsWith('animation') && value === '0s ease 0s 1 normal none running') return true;
    if (property.startsWith('transition') && value === 'all 0s ease 0s') return true;
    if (property === 'text-decoration-line' && value === 'none') return true;
    if (property === 'text-decoration' && value.startsWith('none')) return true;
    if (property === 'vertical-align' && value === 'baseline') return true;
    if (property === 'font-size-adjust' && value === 'none') return true;
    if (property === 'font-synthesis' && value === 'weight style') return true;
    if (property === 'text-underline-position' && value === 'auto') return true;

    return false;
}

function getCleanStyles(element, pseudoSelector = null) {
    if (!cssCopierUserSettings || !cssCopierUserSettings.userUsefulProps || !Array.isArray(cssCopierUserSettings.userUsefulProps)) {
        console.error("CSS Copier Content V1.6.4: CRITICAL - User settings or userUsefulProps not available/valid. Aborting getCleanStyles.");
        return {}; 
    }
    
    const currentUsefulProps = cssCopierUserSettings.userUsefulProps;
    const useFilteringEnabled = cssCopierUserSettings.useUsefulPropsFiltering;

    const styles = window.getComputedStyle(element, pseudoSelector);
    const result = {};
    const referenceStyles = pseudoSelector ? window.getComputedStyle(element) : (element.parentElement ? window.getComputedStyle(element.parentElement) : {});
    
    const elementIdForLog = `${element.tagName}${pseudoSelector || ''}[class="${element.className}" id="${element.id}"]`;
    
    const specificShorthands = ['border', 'padding', 'margin', 'font', 'animation', 'transition', 'background'];
    const addedShorthandGroups = new Set();

    if (useFilteringEnabled) {
        for (const basePropFromConfig of currentUsefulProps) {
            if (addedShorthandGroups.has(basePropFromConfig)) { // Если шорткат уже обработан, пропускаем его дальнейшие проверки
                continue;
            }

            if (specificShorthands.includes(basePropFromConfig)) {
                const shorthandValue = styles.getPropertyValue(basePropFromConfig);
                if (shorthandValue && shorthandValue.trim() !== "" && shorthandValue !== "medium none currentColor") {
                    const referenceShorthandValue = referenceStyles.getPropertyValue ? referenceStyles.getPropertyValue(basePropFromConfig) : null;
                    const isDefaultShorthand = isDefaultLikeValue(element.tagName, pseudoSelector, basePropFromConfig, shorthandValue, styles);
                    
                    if (!isDefaultShorthand && shorthandValue !== referenceShorthandValue) {
                        result[basePropFromConfig] = shorthandValue;
                        addedShorthandGroups.add(basePropFromConfig); // Помечаем, что эта группа шорткатов обработана
                        continue; // Переходим к следующему свойству из usefulProps
                    }
                }
            }

            // Если не обработали как шорткат ИЛИ это не специфический шорткат, обрабатываем свойство и его возможные длинные формы
            const propsToCheckThisIteration = [basePropFromConfig];
            if (!basePropFromConfig.includes('-')) { // Если это потенциальный шорткат (не специфический или специфический, но не добавленный)
                for(let i=0; i < styles.length; i++) { 
                    const currentStyleProp = styles[i];
                    if(currentStyleProp.startsWith(basePropFromConfig + "-")) {
                        propsToCheckThisIteration.push(currentStyleProp);
                    }
                }
            }
            
            const uniquePropsThisIteration = [...new Set(propsToCheckThisIteration)];

            for (const styleProp of uniquePropsThisIteration) {
                // Пропускаем длинные свойства, если их шорткат-группа уже была добавлена
                let skipBecauseShorthandAdded = false;
                for (const addedShorthand of addedShorthandGroups) {
                    if (styleProp.startsWith(addedShorthand + "-")) {
                        skipBecauseShorthandAdded = true;
                        break;
                    }
                }
                if (skipBecauseShorthandAdded) continue;

                const value = styles.getPropertyValue(styleProp);
                if (value === null || value === "") continue;

                const referenceValue = referenceStyles.getPropertyValue ? referenceStyles.getPropertyValue(styleProp) : null;
                const isDefault = isDefaultLikeValue(element.tagName, pseudoSelector, styleProp, value, styles);
                const differsFromRef = value !== referenceValue;

                if (!isDefault && differsFromRef) {
                    result[styleProp] = value;
                }
            }
        }
    } else { 
        for (let i = 0; i < styles.length; i++) {
            const styleProp = styles[i];
            const value = styles.getPropertyValue(styleProp);
            if (value === null || value === "") continue;

            const referenceValue = referenceStyles.getPropertyValue ? referenceStyles.getPropertyValue(styleProp) : null;
            const isDefault = isDefaultLikeValue(element.tagName, pseudoSelector, styleProp, value, styles);
            const differsFromRef = value !== referenceValue;

            if (!isDefault && differsFromRef) {
                result[styleProp] = value;
            }
        }
    }
    return result;
}

// --- Остальные функции (formatStyles, getFullSelector, и т.д.) остаются такими же, как в V1.6.3 ---
// Я их включу для полноты файла, но изменения только в getCleanStyles и связанных константах/логах.

function formatStyles(styles) {
  let css = '';
  for (const [prop, value] of Object.entries(styles)) {
    css += `  ${prop}: ${value};\n`;
  }
  return css;
}

function getFullSelector(element, parentSelectorChain = null) {
    if (!element || !(element instanceof Element)) return "unknown";
    const tagName = element.tagName.toLowerCase();
    let baseSelector = tagName;
    if (element.id) {
        baseSelector = `#${element.id.trim().replace(/\s+/g, '-')}`;
    } else if (element.classList && element.classList.length > 0) {
        const classList = Array.from(element.classList).filter(Boolean).join('.');
        if (classList) { baseSelector = `${tagName}.${classList}`; }
    } else {
        if (element.parentElement) {
            let index = 1;
            let sibling = element.previousElementSibling;
            while (sibling) {
                if (sibling.tagName === element.tagName) { index++; }
                sibling = sibling.previousElementSibling;
            }
            baseSelector = `${tagName}:nth-of-type(${index})`;
        }
    }
    return parentSelectorChain ? `${parentSelectorChain} > ${baseSelector}` : baseSelector;
}

function extractElementInfo(element, currentParentSelector = null) {
  const ownSelector = getFullSelector(element, currentParentSelector);
  const info = { selector: ownSelector, styles: getCleanStyles(element), children: [] };
  const pseudoElements = [':before', ':after'];
  for (const pseudo of pseudoElements) {
    const pseudoStyles = getCleanStyles(element, pseudo);
    if (Object.keys(pseudoStyles).length > 0) {
      info.children.push({ selector: `${ownSelector}${pseudo}`, styles: pseudoStyles, children: [] });
    }
  }
  for (const child of element.children) {
    info.children.push(extractElementInfo(child, ownSelector)); 
  }
  return info;
}

function generateOutput(elementInfo, depth = 0) {
  let output = '';
  const indent = '  '.repeat(depth);
  if (Object.keys(elementInfo.styles).length > 0) {
    output += `${indent}${elementInfo.selector} {\n`;
    output += formatStyles(elementInfo.styles);
    output += `${indent}}\n\n`;
  }
  for (const child of elementInfo.children) {
     output += generateOutput(child, depth + 1 );
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
  document.addEventListener('click', handlePageClickForSelection, { capture: true });
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
  document.removeEventListener('click', handlePageClickForSelection, { capture: true });
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
    const cleanCSS = generateOutput(elementInfo);
    navigator.clipboard.writeText(cleanCSS).then(() => {
      showTemporaryNotification(chrome.i18n.getMessage("copiedToClipboardMsg"));
	  console.info(cleanCSS);
    }).catch(err => {
		console.error(err, cleanCSS);
      showTemporaryNotification(chrome.i18n.getMessage("errorCopiedToClipboardMsg"), true);
    });
  }
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
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    padding: '16px 30px', backgroundColor: isError ? '#e74c3c' : '#2ecc71', color: 'white',
    borderRadius: '8px', boxShadow: '0 5px 20px rgba(0,0,0,0.25)', zIndex: '2147483647',
    fontSize: '16px', fontWeight: '500', textAlign: 'center', opacity: '0',
    transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'
  });
  notification.textContent = message;
  document.body.appendChild(notification);
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translate(-50%, -50%) scale(1.05)';
     setTimeout(() => { notification.style.transform = 'translate(-50%, -50%) scale(1)'; }, 150);
  });
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translate(-50%, -50%) scale(0.9)';
    setTimeout(() => { notification.remove(); }, 300);
  }, duration);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "initCSSExtraction") {
    if (isCssCopierSelectionModeActive) {
        deactivateSelectionMode();
         sendResponse({ status: "selectionModeToggled", isActive: isCssCopierSelectionModeActive });
    } else {
        activateSelectionMode().then(() => {
            sendResponse({ status: "selectionModeToggled", isActive: isCssCopierSelectionModeActive });
        }).catch(error => {
            console.error("CSS Copier Content V1.6.4: Error activating selection mode:", error);
            sendResponse({ status: "error", message: error.message });
        });
    }
    return true; 
  }
});