import { API_URL } from './config.js';
import { surveyState } from './state.js';
import { dom } from './dom.js';
import {
    clearDynamicUi,
    clearError,
    setChoiceUiVisible,
    showError,
} from './ui.js';

export function buildPayload() {
    const answersOut = {};
    Object.keys(surveyState.answers).forEach((id) => {
        answersOut[`q${id}`] = surveyState.answers[id];
    });

    return {
        respondentId: surveyState.respondentId,
        sample: surveyState.sampleGroup,
        answers: answersOut,
    };
}

export async function submitSurvey() {
    if (surveyState.submitted) return;
    surveyState.submitted = true;

    surveyState.acceptingChoice = false;
    clearDynamicUi();
    setChoiceUiVisible(false);

    const payload = buildPayload();
    const body = JSON.stringify({ type: 'survey', ...payload });

    dom.progressBarFull.style.width = '100%';
    dom.progressText.textContent = 'Изпращане…';
    dom.questionEl.textContent = 'Изпращаме отговорите…';
    clearError();

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            body: body,
        });
        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(text.slice(0, 200) || 'Невалиден отговор от сървъра');
        }
        if (!data.ok) {
            throw new Error(data.error || 'Записът неуспешен');
        }
        dom.questionEl.textContent = 'Благодарим! Анкетата е изпратена.';
        dom.progressText.textContent = 'Готово';
    } catch (err) {
        console.error(err);
        dom.questionEl.textContent =
            'Анкетата приключи, но записът в таблицата неуспешен. Опитайте отново по-късно.';
        dom.progressText.textContent = 'Грешка';
        showError(String(err.message || err));
        console.info('Локално копие на payload:', payload);
    }

    dom.homeLink.style.display = 'inline-block';
}
