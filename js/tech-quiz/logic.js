/** Видимост и прескачане на условни въпроси. */

export function isQuestionVisible(q, ans) {
    if (!q.showIf) return true;

    const prev = ans[q.showIf.questionId];
    if (prev === undefined) return false;

    if (Array.isArray(q.showIf.value)) {
        return q.showIf.value.includes(String(prev));
    }

    return String(prev) === String(q.showIf.value);
}

export function advanceToNextVisible(state) {
    while (state.currentIndex < state.questions.length) {
        const q = state.questions[state.currentIndex];
        if (isQuestionVisible(q, state.answers)) return;
        state.currentIndex += 1;
    }
}
