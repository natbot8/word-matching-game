let wordCategories = {};

async function initHomeScreen() {
    try {
        const response = await fetch('word-categories.json');
        wordCategories = await response.json();
        createCategoryTiles();
        setupDifficultySelector();
        updatePointsDisplay();
    } catch (error) {
        console.error('Error loading word categories:', error);
    }
}

function createCategoryTiles() {
    const container = document.getElementById('category-container');
    
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
        playButton.onclick = () => startGame(category);
        
        tile.appendChild(cardsContainer);
        tile.appendChild(title);
        tile.appendChild(playButton);
        container.appendChild(tile);
    }
}

function startGame(category) {
    const difficulty = document.getElementById('difficulty-dropdown').value;
    // Here you would typically navigate to the game screen or initialize the game
    console.log(`Starting game with category: ${category}, difficulty: ${difficulty}`);
    // You might want to use localStorage to pass these values to the game screen
    localStorage.setItem('selectedCategory', category);
    localStorage.setItem('selectedDifficulty', difficulty);
    window.location.href = 'game.html';
}

// Set up difficulty selector
function setupDifficultySelector() {
    const difficultyDropdown = document.getElementById('difficulty-dropdown');
    difficultyDropdown.addEventListener('change', (event) => {
        const difficulty = event.target.value;
        localStorage.setItem('selectedDifficulty', difficulty);
        playDifficultySound(difficulty);
    });
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
    if (soundFile) {
        const audio = new Audio(`game-sounds/${soundFile}`);
        audio.play();
    }
}

// Update points display
function updatePointsDisplay() {
    const pointsValue = localStorage.getItem('savedPoints') || '0';
    const pointsDisplay = document.getElementById('points-value');
    if (pointsDisplay) {
        pointsDisplay.textContent = pointsValue;
    }
}

document.addEventListener('DOMContentLoaded', initHomeScreen);
