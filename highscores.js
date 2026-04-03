const highScoresList = document.getElementById('highScoresList');
const pageLoader = document.getElementById('pageLoader');

function hidePageLoader() {
    if (pageLoader) {
        pageLoader.classList.add('hidden');
        pageLoader.setAttribute('aria-busy', 'false');
    }
}

const API_URL =
    'https://script.google.com/macros/s/AKfycbxS1z5TIrv6APo2UK13w-NZbhqZap0fTDMjIikBjGji7aihetLtnePLYK_RMm_0_u9ufA/exec';
const latestUsername = (localStorage.getItem('latestUsername') || '').trim().toLowerCase();
const latestScore = Number(localStorage.getItem('latestScore') || NaN);

const loadScores = async () => {
    try {
        const res = await fetch(`${API_URL}?action=scores`);
        const highScores = await res.json();
        const sortedScores = [...highScores].sort((a, b) => Number(b.score) - Number(a.score));

        highScoresList.innerHTML = '';

        if (sortedScores.length === 0) {
            highScoresList.innerHTML = '<li class="high-score">Няма налични резултати.</li>';
            return;
        }

        sortedScores.forEach((score) => {
            const item = document.createElement('li');
            item.className = 'high-score';
            item.textContent = `${score.name} - ${score.score}`;

            const isSameUser =
                String(score.name || '').trim().toLowerCase() === latestUsername;
            const isSameScore = Number(score.score) === latestScore;

            if (isSameUser && isSameScore) {
                item.classList.add('high-score-current');
            }

            highScoresList.appendChild(item);
        });
    } catch (err) {
        console.error('Грешка при зареждане на класацията:', err);
        highScoresList.innerHTML = '<li class="high-score">Няма налични резултати.</li>';
    } finally {
        hidePageLoader();
    }
};

loadScores();