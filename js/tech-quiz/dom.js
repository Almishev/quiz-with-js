/** DOM референции (скриптът се зарежда в края на body). */
export const dom = {
    loader: document.getElementById('loader'),
    game: document.getElementById('game'),
    questionEl: document.getElementById('question'),
    dynamicArea: document.getElementById('dynamicArea'),
    choiceSlots: Array.from(document.querySelectorAll('[data-choice-slot]')),
    choiceTexts: Array.from(document.querySelectorAll('.choice-text')),
    progressText: document.getElementById('progressText'),
    progressBarFull: document.getElementById('progressBarFull'),
    surveyError: document.getElementById('surveyError'),
    homeLink: document.getElementById('homeLink'),
};
