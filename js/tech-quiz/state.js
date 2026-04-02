/** Споделено състояние на анкетата (мутира се от render / submit / init). */
export const surveyState = {
    questions: [],
    currentIndex: 0,
    /** @type {Record<number, string | number | string[]>} */
    answers: {},
    acceptingChoice: true,
    submitted: false,
    respondentId:
        typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `respondent-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sampleGroup: Math.random() < 0.5 ? 'A' : 'B',
};
