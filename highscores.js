const highScoresList = document.getElementById('highScoresList');
const API_URL =
    'https://script.google.com/macros/s/AKfycbxS1z5TIrv6APo2UK13w-NZbhqZap0fTDMjIikBjGji7aihetLtnePLYK_RMm_0_u9ufA/exec';

const loadScores = async () => {
    try {
        const res = await fetch(`${API_URL}?action=scores`);
        const highScores = await res.json();

        highScoresList.innerHTML = highScores
            .map((score) => `<li class="high-score">${score.name} - ${score.score}</li>`)
            .join('');
    } catch (err) {
        console.error('Грешка при зареждане на класацията:', err);
        highScoresList.innerHTML = '<li class="high-score">Няма налични резултати.</li>';
    }
};

loadScores();