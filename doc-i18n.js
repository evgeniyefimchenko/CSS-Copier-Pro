function applyLocalization() {
    const elementsToLocalize = [
        { id: 'docTitle', msgKey: 'documentationPageTitle' },
        { id: 'docIntro', msgKey: 'documentationIntro' },
        { id: 'docUsageHeading', msgKey: 'documentationUsageHeading' },
        { id: 'docUsageStep1', msgKey: 'docUsageStep1' },
        { id: 'docUsageStep1_OptA', msgKey: 'docUsageStep1_OptA' },
        { id: 'docUsageStep1_OptB', msgKey: 'docUsageStep1_OptB' },
        { id: 'docUsageStep1_OptC', msgKey: 'docUsageStep1_OptC' },
        { id: 'docUsageStep2', msgKey: 'docUsageStep2' },
        { id: 'docUsageStep3', msgKey: 'docUsageStep3' },
        { id: 'docUsageStep4', msgKey: 'docUsageStep4' },
        { id: 'docOptionsHeading', msgKey: 'documentationOptionsHeading' },
        { id: 'docOptionsDesc', msgKey: 'docOptionsDesc' },
        { id: 'docOptionsLi1', msgKey: 'docOptionsLi1' },
        { id: 'docOptionsLi2', msgKey: 'docOptionsLi2' },
        { id: 'docOutputHeading', msgKey: 'docOutputHeading' },
        { id: 'docOutputDesc1', msgKey: 'docOutputDesc1' },
        { id: 'docOutputDesc2', msgKey: 'docOutputDesc2' },
        { id: 'docOutputDesc3', msgKey: 'docOutputDesc3' },
        { id: 'docOutputDesc4', msgKey: 'docOutputDesc4' },
        { id: 'docTroubleshootingHeading', msgKey: 'docTroubleshootingHeading' },
        { id: 'docTrouble1Prob', msgKey: 'docTrouble1Prob' },
        { id: 'docTrouble1Sol', msgKey: 'docTrouble1Sol' },
        { id: 'docTrouble2Prob', msgKey: 'docTrouble2Prob' },
        { id: 'docTrouble2Sol', msgKey: 'docTrouble2Sol' },
        { id: 'docShortcutHeading', msgKey: 'docShortcutHeading' },
        { id: 'docShortcutDesc', msgKey: 'docShortcutDesc' }
    ];

    document.title = chrome.i18n.getMessage("documentationPageTitle") || document.title;

    elementsToLocalize.forEach(item => {
        const element = document.getElementById(item.id);
        if (element) {
            const message = chrome.i18n.getMessage(item.msgKey);
            if (message) {
                element.innerHTML = (item.prefix || '') + message; // Используем innerHTML для поддержки тегов в сообщениях, если будут
            } else {
                console.warn("Missing i18n message for key:", item.msgKey, "and ID:", item.id);
            }
        } else {
            console.warn("Missing element for localization ID:", item.id);
        }
    });
}

document.addEventListener('DOMContentLoaded', applyLocalization);