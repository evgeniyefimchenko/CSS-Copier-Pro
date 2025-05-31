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
      chrome.tabs.sendMessage(tabs[0].id, { action: "initCSSExtraction" }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn("CSS Copier (popup): Error sending message - ", chrome.runtime.lastError.message);
        } else if (response && (response.status === "selectionModeActivated" || response.status === "selectionModeToggled")) {
          window.close();
        } else if (response && response.status === "error") {
          console.error("CSS Copier (popup): Error from content script - ", response.message);
        }
      });
    } else {
      console.warn("CSS Copier (popup): No active tab found.");
    }
  });
});

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