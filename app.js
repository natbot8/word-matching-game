// Import functionality from other JS files
import * as HomeScreen from './home-screen.js';
import * as Game from './word-match.js';
import * as CardReveal from './card-reveal.js';

// Global state
let currentScreen = 'home';

// Function to switch between screens
export function showScreen(screenId) {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('results-screen').style.display = 'none';
    document.getElementById('card-reveal-screen').style.display = 'none';
    document.getElementById(screenId).style.display = screenId === 'results-screen' ? 'flex' : 'block';
}


// Modified startGame function
function startGame(category) {
    const difficulty = document.getElementById('difficulty-dropdown').value;
    console.log(`Starting game with category: ${category}, difficulty: ${difficulty}`);

    // Play start game audio
    new Audio('game-sounds/lets-go.m4a').play();

    // Set game parameters
    localStorage.setItem('selectedCategory', category);
    localStorage.setItem('selectedDifficulty', difficulty);

    // Switch to game screen and initialize game
    setTimeout(() => {
        showScreen('game-screen');
        Game.initializeGame();
    }, 1400);
}

// Modified returnHome function
function returnHomeHandler() {
    showScreen('home-screen');
    HomeScreen.updatePointsDisplay();
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await HomeScreen.initHomeScreen();
        document.getElementById('return-home-button').addEventListener('click', returnHomeHandler);
    } catch (error) {
        console.error('Failed to initialize home screen:', error);
        // You might want to display an error message to the user here
    }
});

// Expose necessary functions to global scope
window.startGame = startGame;
window.revealBlock = function(block, index) {
    CardReveal.revealBlock(block, index);
};
window.playLetterSound = function(soundUnit) {
    Game.playLetterSound(soundUnit);
};
window.checkImage = function(imgElement, currentLevelData) {
    Game.checkImage(imgElement, currentLevelData);
};
