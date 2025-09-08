function setLocalizedTextPopup() {
    const selectButton = document.getElementById('copyStylesBtn');
    if (selectButton) {
        selectButton.textContent = chrome.i18n.getMessage("selectElementBtnPopup") || "Select Element";
    }
    const optionsLink = document.getElementById('openOptionsPage');
    if (optionsLink) {
        optionsLink.textContent = chrome.i18n.getMessage("settingsBtnPopup") || "Settings";
    }
    const docLink = document.getElementById('openDocumentationPage'); // Новая ссылка
    if (docLink) {
        docLink.textContent = chrome.i18n.getMessage("documentationLinkText") || "Documentation";
    }
}

document.addEventListener('DOMContentLoaded', setLocalizedTextPopup);

document.getElementById('copyStylesBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: initCSSExtractionFromPopup
      }, () => {
        if (chrome.runtime.lastError) {
          console.warn("CSS Copier (popup): Error executing script - ", chrome.runtime.lastError.message);
        } else {
          window.close();
        }
      });
    } else {
      console.warn("CSS Copier (popup): No active tab found.");
    }
  });
});

function initCSSExtractionFromPopup() {
  if (typeof activateSelectionMode === 'function') {
    activateSelectionMode();
  } else {
    console.error("CSS Copier (popup): Function activateSelectionMode is not defined in content script.");
  }
}

document.getElementById('openOptionsPage').addEventListener('click', (e) => {
    e.preventDefault();
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
        window.open(chrome.runtime.getURL('options.html'));
    }
    window.close();
});

document.getElementById('openDocumentationPage').addEventListener('click', (e) => { // Новый обработчик
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL("documentation.html") });
    window.close(); 
});