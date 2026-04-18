// CSS Copier Pro - Options Page
// Использует константы из config.js

const usefulPropsTextarea = document.getElementById('usefulPropsTextarea');
const useUsefulPropsToggle = document.getElementById('useUsefulPropsToggle');
const saveButton = document.getElementById('saveOptions');
const restoreButton = document.getElementById('restoreDefaults');
const statusDiv = document.getElementById('status');

// Элементы для новых настроек
const exportFormatSelect = document.getElementById('exportFormat');
const includePseudoElementsToggle = document.getElementById('includePseudoElements');
const copyHistoryEnabledToggle = document.getElementById('copyHistoryEnabled');
const maxHistoryItemsInput = document.getElementById('maxHistoryItems');


function setLocalizedText() {
    document.title = chrome.i18n.getMessage("optionsTitle");
    document.getElementById("optionsTitleHeading").textContent = chrome.i18n.getMessage("optionsTitle");
    document.getElementById("usefulPropsListLabel").textContent = chrome.i18n.getMessage("usefulPropsListLabel");
    document.getElementById("enableUsefulPropsLabel").textContent = chrome.i18n.getMessage("enableUsefulPropsLabel");
    document.getElementById("enableUsefulPropsLabel").title = chrome.i18n.getMessage("usefulPropsTooltip");
    saveButton.textContent = chrome.i18n.getMessage("saveSettingsBtn");
    restoreButton.textContent = chrome.i18n.getMessage("restoreDefaultsBtn");
}

function saveOptions() {
    const customPropsString = usefulPropsTextarea.value.trim();
    const customPropsArray = customPropsString ? customPropsString.split('\n').map(prop => prop.trim()).filter(Boolean) : DEFAULT_USEFUL_PROPS_LIST;
    const useFiltering = useUsefulPropsToggle.checked;
    
    // Получаем новые настройки
    const exportFormat = exportFormatSelect ? exportFormatSelect.value : 'css';
    const includePseudo = includePseudoElementsToggle ? includePseudoElementsToggle.checked : true;
    const copyHistory = copyHistoryEnabledToggle ? copyHistoryEnabledToggle.checked : true;
    const maxHistory = maxHistoryItemsInput ? parseInt(maxHistoryItemsInput.value) : 10;

    chrome.storage.sync.set({
        userUsefulProps: customPropsArray,
        useUsefulPropsFiltering: useFiltering,
        exportFormat: exportFormat,
        includePseudoElements: includePseudo,
        copyHistoryEnabled: copyHistory,
        maxHistoryItems: maxHistory
    }, () => {
        statusDiv.textContent = chrome.i18n.getMessage("statusSettingsSaved");
        statusDiv.style.color = '#27ae60';
        setTimeout(() => { statusDiv.textContent = ''; }, 2500);
    });
}

function loadOptions() {
    chrome.storage.sync.get({
        userUsefulProps: DEFAULT_USEFUL_PROPS_LIST,
        useUsefulPropsFiltering: true,
        exportFormat: 'css',
        includePseudoElements: true,
        copyHistoryEnabled: true,
        maxHistoryItems: 10
    }, (items) => {
        usefulPropsTextarea.value = items.userUsefulProps.join('\n');
        useUsefulPropsToggle.checked = items.useUsefulPropsFiltering;
        
        // Загружаем новые настройки
        if (exportFormatSelect) exportFormatSelect.value = items.exportFormat || 'css';
        if (includePseudoElementsToggle) includePseudoElementsToggle.checked = items.includePseudoElements !== false;
        if (copyHistoryEnabledToggle) copyHistoryEnabledToggle.checked = items.copyHistoryEnabled !== false;
        if (maxHistoryItemsInput) maxHistoryItemsInput.value = items.maxHistoryItems || 10;
        
         if (items.userUsefulProps.length !== DEFAULT_USEFUL_PROPS_LIST.length && items.userUsefulProps.join(',') !== DEFAULT_USEFUL_PROPS_LIST.join(',')) {
            console.warn("CSS Copier Options V2.0: Loaded props from storage differ from current script's default list.");
        }
    });
}

function restoreDefaultOptions() {
    usefulPropsTextarea.value = DEFAULT_USEFUL_PROPS_LIST.join('\n');
    useUsefulPropsToggle.checked = true;
    
    // Восстанавливаем настройки по умолчанию
    if (exportFormatSelect) exportFormatSelect.value = 'css';
    if (includePseudoElementsToggle) includePseudoElementsToggle.checked = true;
    if (copyHistoryEnabledToggle) copyHistoryEnabledToggle.checked = true;
    if (maxHistoryItemsInput) maxHistoryItemsInput.value = 10;
    
    statusDiv.textContent = chrome.i18n.getMessage("statusSettingsRestored") + " " + (chrome.i18n.getMessage("clickSavePrompt") || "Нажмите 'Сохранить'.");
    statusDiv.style.color = '#2980b9';
}

document.addEventListener('DOMContentLoaded', () => {
    setLocalizedText();
    loadOptions();
});
saveButton.addEventListener('click', saveOptions);
restoreButton.addEventListener('click', restoreDefaultOptions);