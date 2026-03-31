const username = document.getElementById('username');
const saveScoreBtn = document.getElementById('saveScoreBtn');
const finalScore = document.getElementById('finalScore');
const mostRecentScore = localStorage.getItem('mostRecentScore');

const API_URL =
    'https://script.google.com/macros/s/AKfycbxS1z5TIrv6APo2UK13w-NZbhqZap0fTDMjIikBjGji7aihetLtnePLYK_RMm_0_u9ufA/exec';
let isSaving = false;

finalScore.innerText = mostRecentScore || 0;

username.addEventListener('keyup', () => {
    saveScoreBtn.disabled = isSaving || !username.value.trim();
});

saveHighScore = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    isSaving = true;
    saveScoreBtn.disabled = true;

    const payload = {
        name: username.value.trim(),
        score: Number(mostRecentScore || 0),
    };
    localStorage.setItem('latestUsername', payload.name);
    localStorage.setItem('latestScore', String(payload.score));

    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    } catch (err) {
        console.error('Грешка при запис на резултат:', err);
    }

    window.location.assign('./index.html');
};