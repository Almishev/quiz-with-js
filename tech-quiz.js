'use strict';

const QUESTION_URL = './questions.json';
/** Същият Web App като в game.js / end.js — добави в Apps Script обработка за type: "survey". */
const API_URL =
    'https://script.google.com/macros/s/AKfycbxS1z5TIrv6APo2UK13w-NZbhqZap0fTDMjIikBjGji7aihetLtnePLYK_RMm_0_u9ufA/exec';

const loader = document.getElementById('loader');
const game = document.getElementById('game');
const questionEl = document.getElementById('question');
const dynamicArea = document.getElementById('dynamicArea');
const choiceSlots = Array.from(document.querySelectorAll('[data-choice-slot]'));
const choiceTexts = Array.from(document.querySelectorAll('.choice-text'));
const progressText = document.getElementById('progressText');
const progressBarFull = document.getElementById('progressBarFull');
const surveyError = document.getElementById('surveyError');
const homeLink = document.getElementById('homeLink');

let questions = [];
let currentIndex = 0;

/** @type {Record<number, string | number | string[]>} */
const answers = {};

let acceptingChoice = true;
let submitted = false;

const respondentId =
    typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `respondent-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const sampleGroup = Math.random() < 0.5 ? 'A' : 'B';

/** Скрива спинъра и показва съдържанието на анкетата (стилът е в game.css #loader). */
function revealSurveyUi() {
    if (game) game.classList.remove('hidden');
    if (loader) loader.classList.add('hidden');
}

function showError(message) {
    surveyError.textContent = message;
    surveyError.hidden = false;
}

function clearError() {
    surveyError.hidden = true;
    surveyError.textContent = '';
}

/** Видим ли е въпросът при текущите (частични) отговори? */
function isQuestionVisible(q, ans) {
    if (!q.showIf) return true;

    const prev = ans[q.showIf.questionId];
    if (prev === undefined) return false;

    if (Array.isArray(q.showIf.value)) {
        return q.showIf.value.includes(String(prev));
    }

    return String(prev) === String(q.showIf.value);
}

/** Преминава индекса, докато не стигне до видим въпрос или края */
function advanceToNextVisible() {
    while (currentIndex < questions.length) {
        const q = questions[currentIndex];
        if (isQuestionVisible(q, answers)) return;
        currentIndex += 1;
    }
}

/**
 * След отговор на Q1: ако е tried/own_pair → показваме Q2 → 7 стъпки, иначе 6.
 */
function getTotalStepsLabel() {
    const a1 = answers[1];
    if (a1 === undefined) return null;
    const showComfort = ['tried', 'own_pair'].includes(String(a1));
    return showComfort ? 7 : 6;
}

/** Номер на текущата стъпка (1-based) за прогреса */
function getCurrentStepNumber() {
    let n = 0;
    for (let i = 0; i < currentIndex; i += 1) {
        if (isQuestionVisible(questions[i], answers)) n += 1;
    }
    return n + 1;
}

function updateProgress() {
    const step = getCurrentStepNumber();
    const total = getTotalStepsLabel();

    progressText.textContent =
        total === null ? `Стъпка ${step}` : `Стъпка ${step} от ${total}`;

    const widthPct =
        total === null
            ? Math.min(100, step * 25)
            : Math.min(100, (step / total) * 100);

    progressBarFull.style.width = `${widthPct}%`;
}

function clearDynamicUi() {
    dynamicArea.innerHTML = '';
    dynamicArea.hidden = true;
}

function setChoiceUiVisible(visible) {
    choiceSlots.forEach((slot) => {
        slot.hidden = !visible;
    });
}

function renderSingleQuestionMany(q) {
    clearDynamicUi();
    setChoiceUiVisible(false);
    questionEl.textContent = q.question;

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
            if (!radio.checked || submitted) return;
            clearError();
            answers[q.id] = opt.value;
            currentIndex += 1;
            advanceToNextVisible();
            renderCurrentQuestion();
        });

        row.appendChild(radio);
        row.appendChild(text);
        dynamicArea.appendChild(row);
    });

    dynamicArea.hidden = false;
}

function renderSingleQuestion(q) {
    const list = q.choices || [];
    if (list.length > choiceTexts.length) {
        renderSingleQuestionMany(q);
        return;
    }

    clearDynamicUi();
    setChoiceUiVisible(true);
    questionEl.textContent = q.question;

    choiceTexts.forEach((el, i) => {
        const opt = list[i];
        const row = choiceSlots[i];
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
    questionEl.textContent = q.question;

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
            answers[q.id] = num;
        } else {
            const text = input.value.trim();
            if (!text && !q.optional) {
                showError('Моля, попълнете полето.');
                return;
            }
            answers[q.id] = text;
        }

        currentIndex += 1;
        advanceToNextVisible();
        renderCurrentQuestion();
    });

    dynamicArea.appendChild(input);
    dynamicArea.appendChild(nextBtn);
    dynamicArea.hidden = false;
}

function renderCurrentQuestion() {
    advanceToNextVisible();

    if (currentIndex >= questions.length) {
        submitSurvey();
        return;
    }

    clearError();
    updateProgress();

    const q = questions[currentIndex];

    if (q.type === 'single') {
        renderSingleQuestion(q);
    } else if (q.type === 'multi') {
        renderMultiQuestion(q);
    } else {
        renderInputQuestion(q);
    }
}

function buildPayload() {
    const answersOut = {};
    Object.keys(answers).forEach((id) => {
        answersOut[`q${id}`] = answers[id];
    });

    return {
        respondentId,
        sample: sampleGroup,
        answers: answersOut,
    };
}

async function submitSurvey() {
    if (submitted) return;
    submitted = true;

    acceptingChoice = false;
    clearDynamicUi();
    setChoiceUiVisible(false);

    const payload = buildPayload();
    const body = JSON.stringify({ type: 'survey', ...payload });

    progressBarFull.style.width = '100%';
    progressText.textContent = 'Изпращане…';
    questionEl.textContent = 'Изпращаме отговорите…';
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
        questionEl.textContent = 'Благодарим! Анкетата е изпратена.';
        progressText.textContent = 'Готово';
    } catch (err) {
        console.error(err);
        questionEl.textContent =
            'Анкетата приключи, но записът в таблицата неуспешен. Опитайте отново по-късно.';
        progressText.textContent = 'Грешка';
        showError(String(err.message || err));
        console.info('Локално копие на payload:', payload);
    }

    homeLink.style.display = 'inline-block';
}

choiceTexts.forEach((el) => {
    el.addEventListener('click', (e) => {
        if (!acceptingChoice || submitted) return;

        const q = questions[currentIndex];
        if (!q || q.type !== 'single') return;

        acceptingChoice = false;
        clearError();

        const value = e.currentTarget.dataset.value;
        if (!value) {
            acceptingChoice = true;
            return;
        }

        answers[q.id] = value;
        currentIndex += 1;
        advanceToNextVisible();
        acceptingChoice = true;
        renderCurrentQuestion();
    });
});

function renderMultiQuestion(q) {
    clearDynamicUi();
    setChoiceUiVisible(false);
    questionEl.textContent = q.question;

    const selectedValues = new Set(
        Array.isArray(answers[q.id]) ? answers[q.id].map(String) : []
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
        dynamicArea.appendChild(row);
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

        answers[q.id] = Array.from(selectedValues);

        currentIndex += 1;
        advanceToNextVisible();
        renderCurrentQuestion();
    });

    dynamicArea.appendChild(nextBtn);
    dynamicArea.hidden = false;
}

function init() {
    homeLink.style.display = 'none';

    fetch(QUESTION_URL)
        .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then((data) => {
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('Празен или невалиден questions.json');
            }
            questions = data;
            currentIndex = 0;
            revealSurveyUi();
            renderCurrentQuestion();
        })
        .catch((err) => {
            console.error(err);
            revealSurveyUi();
            questionEl.textContent =
                'Неуспешно зареждане на въпросите. Проверете questions.json и сървъра.';
            showError(String(err.message || err));
            setChoiceUiVisible(false);
            homeLink.style.display = 'inline-block';
        });
}

init();
