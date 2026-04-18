// CSS Copier Pro - Background Service Worker
// Использует константы из config.js

chrome.runtime.onInstalled.addListener((details) => {
  
  function setDefaults() {
    chrome.storage.sync.set({
        userUsefulProps: DEFAULT_USEFUL_PROPS_LIST,
        useUsefulPropsFiltering: true,
        exportFormat: 'css',
        includePseudoElements: true,
        copyHistoryEnabled: true,
        maxHistoryItems: 10
    }, () => {
        if (chrome.runtime.lastError) {
            console.error("CSS Copier Background V2.0: Error setting fresh default settings:", chrome.runtime.lastError.message);
        }
    });
  }

  if (details.reason === "install" || details.reason === "update") {
    chrome.storage.sync.remove(['userUsefulProps', 'useUsefulPropsFiltering'], () => {
        if (chrome.runtime.lastError) {
            console.error("CSS Copier Background V2.0: Error clearing old settings:", chrome.runtime.lastError.message);
        }
        setDefaults(); 
    });
  }
  
  const parentMenuId = "cssCopierParent";
  chrome.contextMenus.removeAll(() => { 
    if (chrome.runtime.lastError) {
        console.warn("CSS Copier Background V2.0: Error removing all context menus:", chrome.runtime.lastError.message);
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
    chrome.contextMenus.create({
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
        console.warn("CSS Copier (background ctx menu V2.0): ", chrome.runtime.lastError.message);
      }
    });
  } else if (info.menuItemId === "openOptionsViaContext") {
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
        window.open(chrome.runtime.getURL('options.html'));
    }
  } else if (info.menuItemId === "openDocumentationViaContext") {
    chrome.tabs.create({ url: chrome.runtime.getURL("documentation.html") });
  }
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "activate_css_copier" && tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "initCSSExtraction" }, () => { 
      if (chrome.runtime.lastError) {
         console.warn("CSS Copier (background command V2.0): ", chrome.runtime.lastError.message);
      }
    });
  }
});