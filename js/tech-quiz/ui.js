import { dom } from './dom.js';

export function revealSurveyUi() {
    if (dom.game) dom.game.classList.remove('hidden');
    if (dom.loader) dom.loader.classList.add('hidden');
}

export function showError(message) {
    dom.surveyError.textContent = message;
    dom.surveyError.hidden = false;
}

export function clearError() {
    dom.surveyError.hidden = true;
    dom.surveyError.textContent = '';
}

export function clearDynamicUi() {
    dom.dynamicArea.innerHTML = '';
    dom.dynamicArea.hidden = true;
}

export function setChoiceUiVisible(visible) {
    dom.choiceSlots.forEach((slot) => {
        slot.hidden = !visible;
    });
}
