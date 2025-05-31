const defaultUsefulPropsList = [ // КОРОТКИЙ СПИСОК ЗДЕСЬ
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
  'grid-auto-flow', 'grid-gap', 'gap'
];

const usefulPropsTextarea = document.getElementById('usefulPropsTextarea');
const useUsefulPropsToggle = document.getElementById('useUsefulPropsToggle');
const saveButton = document.getElementById('saveOptions');
const restoreButton = document.getElementById('restoreDefaults');
const statusDiv = document.getElementById('status');


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
    const customPropsArray = customPropsString ? customPropsString.split('\n').map(prop => prop.trim()).filter(Boolean) : defaultUsefulPropsList;
    const useFiltering = useUsefulPropsToggle.checked;

    chrome.storage.sync.set({
        userUsefulProps: customPropsArray,
        useUsefulPropsFiltering: useFiltering
    }, () => {
        statusDiv.textContent = chrome.i18n.getMessage("statusSettingsSaved");
        statusDiv.style.color = '#27ae60';
        setTimeout(() => { statusDiv.textContent = ''; }, 2500);
    });
}

function loadOptions() {
    chrome.storage.sync.get({
        userUsefulProps: defaultUsefulPropsList,
        useUsefulPropsFiltering: true
    }, (items) => {
        usefulPropsTextarea.value = items.userUsefulProps.join('\n');
        useUsefulPropsToggle.checked = items.useUsefulPropsFiltering;
         if (items.userUsefulProps.length !== defaultUsefulPropsList.length && items.userUsefulProps.join(',') !== defaultUsefulPropsList.join(',')) {
            console.warn("CSS Copier Options V1.5: Loaded props from storage differ from current script's default list.");
        }
    });
}

function restoreDefaultOptions() {
    usefulPropsTextarea.value = defaultUsefulPropsList.join('\n');
    useUsefulPropsToggle.checked = true;
    statusDiv.textContent = chrome.i18n.getMessage("statusSettingsRestored") + " " + (chrome.i18n.getMessage("clickSavePrompt") || "Нажмите 'Сохранить'.");
    statusDiv.style.color = '#2980b9';
}

document.addEventListener('DOMContentLoaded', () => {
    setLocalizedText();
    loadOptions();
});
saveButton.addEventListener('click', saveOptions);
restoreButton.addEventListener('click', restoreDefaultOptions);