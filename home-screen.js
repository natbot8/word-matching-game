export let wordCategories = {};
let difficultyAudio = null;

// Add this function to fetch word categories
async function fetchWordCategories() {
    try {
        const response = await fetch('word-categories.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching word categories:', error);
        return null;
    }
}

export function initHomeScreen() {
    fetchWordCategories()
        .then(categories => {
            wordCategories = categories;
            createCategoryTiles();
            setupDifficultySelector();
            updatePointsDisplay();
        })
        .catch(error => {
            console.error('Error loading word categories:', error);
        });
}

export function createCategoryTiles() {
    const container = document.getElementById('category-container');

    // Clear existing tiles
    container.innerHTML = '';

    for (const [category, data] of Object.entries(wordCategories)) {
        const tile = document.createElement('div');
        tile.className = 'category-tile';

        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'category-cards';
        data.cards.slice(0, 3).forEach(card => {
            const img = document.createElement('img');
            img.src = `card-images/${card}`;
            img.alt = 'Card';
            cardsContainer.appendChild(img);
        });

        const title = document.createElement('h2');
        title.className = 'category-title';
        title.textContent = category;

        const playButton = document.createElement('button');
        playButton.className = 'play-button';
        playButton.textContent = 'Play';
        playButton.onclick = () => window.startGame(category);

        tile.appendChild(cardsContainer);
        tile.appendChild(title);
        tile.appendChild(playButton);
        container.appendChild(tile);
    }
}

// Set up difficulty selector
export function setupDifficultySelector() {
    const difficultyDropdown = document.getElementById('difficulty-dropdown');

    // Remove any existing event listeners
    difficultyDropdown.removeEventListener('change', handleDifficultyChange);

    // Add the event listener
    difficultyDropdown.addEventListener('change', handleDifficultyChange);
}

function handleDifficultyChange(event) {
    const difficulty = event.target.value;
    localStorage.setItem('selectedDifficulty', difficulty);
    playDifficultySound(difficulty);
}

// Play difficulty sounds
function playDifficultySound(difficulty) {
    const soundMap = {
        'easy': 'easy.m4a',
        'hard': 'hard.m4a',
        'superhard': 'superhard.m4a',
        'superduperhard': 'superduperhard.m4a'
    };
    const soundFile = soundMap[difficulty];

    // Stop any currently playing audio
    if (difficultyAudio) {
        difficultyAudio.pause();
        difficultyAudio.currentTime = 0;
    }

    if (soundFile) {
        difficultyAudio = new Audio(`game-sounds/${soundFile}`);
        difficultyAudio.play().catch(error => console.error('Error playing audio:', error));
    }
}

// Update points display
export function updatePointsDisplay() {
    const pointsValue = localStorage.getItem('points') || '0';
    const pointsDisplay = document.getElementById('points-value');
    if (pointsDisplay) {
        pointsDisplay.textContent = pointsValue;
    }
}
