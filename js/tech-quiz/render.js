import { surveyState } from './state.js';
import { dom } from './dom.js';
import { advanceToNextVisible } from './logic.js';
import { updateProgress } from './progress.js';
import {
    clearDynamicUi,
    clearError,
    setChoiceUiVisible,
    showError,
} from './ui.js';
import { submitSurvey } from './submit.js';

function renderSingleQuestionMany(q) {
    clearDynamicUi();
    setChoiceUiVisible(false);
    dom.questionEl.textContent = q.question;

    const list = q.choices || [];
    list.forEach((opt, idx) => {
        const row = document.createElement('label');
        row.className = 'survey-radio-row';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `single-q${q.id}`;
        radio.id = `single-q${q.id}-${idx}`;
        radio.value = opt.value;

        const text = document.createElement('span');
        text.className = 'survey-radio-text';
        text.textContent = opt.label;

        radio.addEventListener('change', () => {
            if (!radio.checked || surveyState.submitted) return;
            clearError();
            surveyState.answers[q.id] = opt.value;
            surveyState.currentIndex += 1;
            advanceToNextVisible(surveyState);
            renderCurrentQuestion();
        });

        row.appendChild(radio);
        row.appendChild(text);
        dom.dynamicArea.appendChild(row);
    });

    dom.dynamicArea.hidden = false;
}

function renderSingleQuestion(q) {
    const list = q.choices || [];
    if (list.length > dom.choiceTexts.length) {
        renderSingleQuestionMany(q);
        return;
    }

    clearDynamicUi();
    setChoiceUiVisible(true);
    dom.questionEl.textContent = q.question;

    dom.choiceTexts.forEach((el, i) => {
        const opt = list[i];
        const row = dom.choiceSlots[i];
        if (!opt) {
            row.hidden = true;
            el.textContent = '';
            el.dataset.value = '';
            return;
        }
        row.hidden = false;
        el.textContent = opt.label;
        el.dataset.value = opt.value;
    });
}

function renderInputQuestion(q) {
    clearDynamicUi();
    setChoiceUiVisible(false);
    dom.questionEl.textContent = q.question;

    const input = document.createElement('input');

    if (q.type === 'number') {
        input.type = 'number';
        input.min = String(q.min);
        input.max = String(q.max);
        input.inputMode = 'numeric';
    } else {
        input.type = 'text';
        input.autocomplete = 'off';
    }

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn';
    nextBtn.textContent = 'Напред';

    nextBtn.addEventListener('click', () => {
        clearError();

        if (q.type === 'number') {
            const raw = input.value.trim();
            if (raw === '') {
                showError(`Моля, въведете число между ${q.min} и ${q.max}.`);
                return;
            }
            const num = Number(raw);
            if (Number.isNaN(num) || num < q.min || num > q.max) {
                showError(`Стойността трябва да е между ${q.min} и ${q.max}.`);
                return;
            }
            surveyState.answers[q.id] = num;
        } else {
            const text = input.value.trim();
            if (!text && !q.optional) {
                showError('Моля, попълнете полето.');
                return;
            }
            surveyState.answers[q.id] = text;
        }

        surveyState.currentIndex += 1;
        advanceToNextVisible(surveyState);
        renderCurrentQuestion();
    });

    dom.dynamicArea.appendChild(input);
    dom.dynamicArea.appendChild(nextBtn);
    dom.dynamicArea.hidden = false;
}

export function renderMultiQuestion(q) {
    clearDynamicUi();
    setChoiceUiVisible(false);
    dom.questionEl.textContent = q.question;

    const selectedValues = new Set(
        Array.isArray(surveyState.answers[q.id])
            ? surveyState.answers[q.id].map(String)
            : []
    );

    q.choices.forEach((choice, idx) => {
        const row = document.createElement('div');
        row.className = 'survey-multi-row';

        const cbId = `multi-q${q.id}-${choice.value}-${idx}`;
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = cbId;
        checkbox.value = choice.value;
        checkbox.checked = selectedValues.has(choice.value);

        const label = document.createElement('label');
        label.htmlFor = cbId;
        label.textContent = choice.label;

        if (checkbox.checked) row.classList.add('survey-multi-row--selected');

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                selectedValues.add(choice.value);
            } else {
                selectedValues.delete(choice.value);
            }
            row.classList.toggle('survey-multi-row--selected', checkbox.checked);
        });

        row.appendChild(checkbox);
        row.appendChild(label);
        dom.dynamicArea.appendChild(row);
    });

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.textContent = 'Напред';
    nextBtn.className = 'btn';

    nextBtn.addEventListener('click', () => {
        clearError();

        if (selectedValues.size === 0 && !q.optional) {
            showError('Моля, изберете поне една опция.');
            return;
        }

        surveyState.answers[q.id] = Array.from(selectedValues);

        surveyState.currentIndex += 1;
        advanceToNextVisible(surveyState);
        renderCurrentQuestion();
    });

    dom.dynamicArea.appendChild(nextBtn);
    dom.dynamicArea.hidden = false;
}

export function renderCurrentQuestion() {
    advanceToNextVisible(surveyState);

    if (surveyState.currentIndex >= surveyState.questions.length) {
        submitSurvey();
        return;
    }

    clearError();
    updateProgress(surveyState);

    const q = surveyState.questions[surveyState.currentIndex];

    if (q.type === 'single') {
        renderSingleQuestion(q);
    } else if (q.type === 'multi') {
        renderMultiQuestion(q);
    } else {
        renderInputQuestion(q);
    }
}
