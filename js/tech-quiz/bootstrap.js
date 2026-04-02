import { QUESTION_URL } from './config.js';
import { surveyState } from './state.js';
import { dom } from './dom.js';
import {
    revealSurveyUi,
    clearError,
    setChoiceUiVisible,
    showError,
} from './ui.js';
import { advanceToNextVisible } from './logic.js';
import { renderCurrentQuestion } from './render.js';

function wireChoiceClicks() {
    dom.choiceTexts.forEach((el) => {
        el.addEventListener('click', (e) => {
            if (!surveyState.acceptingChoice || surveyState.submitted) return;

            const q = surveyState.questions[surveyState.currentIndex];
            if (!q || q.type !== 'single') return;

            surveyState.acceptingChoice = false;
            clearError();

            const value = e.currentTarget.dataset.value;
            if (!value) {
                surveyState.acceptingChoice = true;
                return;
            }

            surveyState.answers[q.id] = value;
            surveyState.currentIndex += 1;
            advanceToNextVisible(surveyState);
            surveyState.acceptingChoice = true;
            renderCurrentQuestion();
        });
    });
}

export function initSurvey() {
    dom.homeLink.style.display = 'none';
    wireChoiceClicks();

    fetch(QUESTION_URL)
        .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then((data) => {
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('Празен или невалиден questions.json');
            }
            surveyState.questions = data;
            surveyState.currentIndex = 0;
            revealSurveyUi();
            renderCurrentQuestion();
        })
        .catch((err) => {
            console.error(err);
            revealSurveyUi();
            dom.questionEl.textContent =
                'Неуспешно зареждане на въпросите. Проверете questions.json и сървъра.';
            showError(String(err.message || err));
            setChoiceUiVisible(false);
            dom.homeLink.style.display = 'inline-block';
        });
}
