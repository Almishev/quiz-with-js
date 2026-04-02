import { isQuestionVisible } from './logic.js';
import { dom } from './dom.js';

/**
 * След отговор на Q1: tried/own_pair → 7 стъпки, иначе 6.
 * @param {{ answers: Record<number, unknown> }} state
 */
export function getTotalStepsLabel(state) {
    const a1 = state.answers[1];
    if (a1 === undefined) return null;
    const showComfort = ['tried', 'own_pair'].includes(String(a1));
    return showComfort ? 7 : 6;
}

/**
 * @param {{ questions: unknown[], currentIndex: number, answers: Record<number, unknown> }} state
 */
export function getCurrentStepNumber(state) {
    let n = 0;
    for (let i = 0; i < state.currentIndex; i += 1) {
        if (isQuestionVisible(state.questions[i], state.answers)) n += 1;
    }
    return n + 1;
}

/** @param {{ questions: unknown[], currentIndex: number, answers: Record<number, unknown> }} state */
export function updateProgress(state) {
    const step = getCurrentStepNumber(state);
    const total = getTotalStepsLabel(state);

    dom.progressText.textContent =
        total === null ? `Стъпка ${step}` : `Стъпка ${step} от ${total}`;

    const widthPct =
        total === null
            ? Math.min(100, step * 25)
            : Math.min(100, (step / total) * 100);

    dom.progressBarFull.style.width = `${widthPct}%`;
}
