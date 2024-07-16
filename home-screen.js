let wordCategories = {};

async function initHomeScreen() {
    try {
        const response = await fetch('word-categories.json');
        wordCategories = await response.json();
        createCategoryTiles();
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

document.addEventListener('DOMContentLoaded', initHomeScreen);
