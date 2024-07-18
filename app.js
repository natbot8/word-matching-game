// Import functionality from other JS files
import * as HomeScreen from './home-screen.js';
import * as Game from './word-match.js';
import * as CardReveal from './card-reveal.js';

// Global state
let currentScreen = 'home';

// Function to switch between screens
export function showScreen(screenId) {
    // Save points if navigating away from the game screen
    if (currentScreen === 'game' && screenId !== 'game-screen') {
        saveGamePoints();
    }

    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('results-screen').style.display = 'none';
    document.getElementById('card-reveal-screen').style.display = 'none';
    document.getElementById(screenId).style.display = screenId === 'results-screen' ? 'flex' : 'block';

    currentScreen = screenId.replace('-screen', '');
    updateNavHighlight(screenId);

    // Additional logic for specific screens
    if (screenId === 'home-screen') {
        HomeScreen.updatePointsDisplay();
    } else if (screenId === 'card-reveal-screen') {
        const totalPoints = parseInt(localStorage.getItem('points') || '0');
        CardReveal.initCardReveal(totalPoints, localStorage.getItem('selectedCategory'));
    }
}

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const screenId = item.dataset.screen;
            showScreen(screenId);
        });
    });
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
    showScreen('game-screen');
    Game.initializeGame();
}

function updateNavHighlight(screenId) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.dataset.screen === screenId) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

function saveGamePoints() {
    const currentPoints = Game.points;
    const totalPoints = parseInt(localStorage.getItem('points') || '0') + currentPoints;
    localStorage.setItem('points', totalPoints.toString());
    console.log(`Saved ${currentPoints} points. New total: ${totalPoints}`);
}

// Modified returnHome function
function returnHomeHandler() {
    showScreen('home-screen');
    HomeScreen.updatePointsDisplay();
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    try {
        HomeScreen.initHomeScreen();
        initNavigation();
    } catch (error) {
        console.error('Failed to initialize home screen:', error);
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
