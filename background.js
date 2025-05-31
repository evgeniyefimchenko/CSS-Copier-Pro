const defaultUsefulPropsForStorage = [ 
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


chrome.runtime.onInstalled.addListener((details) => {
  
  function setDefaults() {
    chrome.storage.sync.set({
        userUsefulProps: defaultUsefulPropsForStorage,
        useUsefulPropsFiltering: true
    }, () => {
        if (chrome.runtime.lastError) {
            console.error("CSS Copier Background V1.6.3: Error setting fresh default settings:", chrome.runtime.lastError.message);
        } else {
        }
    });
  }

  if (details.reason === "install" || details.reason === "update") {
    chrome.storage.sync.remove(['userUsefulProps', 'useUsefulPropsFiltering'], () => {
        if (chrome.runtime.lastError) {
            console.error("CSS Copier Background V1.6.3: Error clearing old settings:", chrome.runtime.lastError.message);
        } else {
        }
        setDefaults(); 
    });
  }
  
  const parentMenuId = "cssCopierParent";
  chrome.contextMenus.removeAll(() => { 
    if (chrome.runtime.lastError) {
        console.warn("CSS Copier Background V1.6.3: Error removing all context menus (often fine if none existed):", chrome.runtime.lastError.message);
    }
    chrome.contextMenus.create({
        id: parentMenuId,
        title: chrome.i18n.getMessage("contextMenuParent") || "CSS Copier",
        contexts: ["all"]
    });
    chrome.contextMenus.create({
        id: "selectElementViaContext",
        parentId: parentMenuId,
        title: chrome.i18n.getMessage("contextMenuSelectElement") || "Select Element",
        contexts: ["all"]
    });
    chrome.contextMenus.create({
        id: "openOptionsViaContext",
        parentId: parentMenuId,
        title: chrome.i18n.getMessage("contextMenuOpenSettings") || "Settings",
        contexts: ["all"]
    });
    chrome.contextMenus.create({ // Новый пункт меню
        id: "openDocumentationViaContext",
        parentId: parentMenuId,
        title: chrome.i18n.getMessage("documentationLinkText") || "Documentation",
        contexts: ["all"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "selectElementViaContext" && tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "initCSSExtraction" }, () => { 
      if (chrome.runtime.lastError) {
        console.warn("CSS Copier (background ctx menu V1.6.3): ", chrome.runtime.lastError.message);
      }
    });
  } else if (info.menuItemId === "openOptionsViaContext") {
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
        window.open(chrome.runtime.getURL('options.html'));
    }
  } else if (info.menuItemId === "openDocumentationViaContext") { // Обработчик для нового пункта
    chrome.tabs.create({ url: chrome.runtime.getURL("documentation.html") });
  }
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "activate_css_copier" && tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "initCSSExtraction" }, () => { 
      if (chrome.runtime.lastError) {
         console.warn("CSS Copier (background command V1.6.3): ", chrome.runtime.lastError.message);
      }
    });
  }
});