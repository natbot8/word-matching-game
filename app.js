// Import functionality from other JS files
import * as HomeScreen from './home-screen.js';
import * as Game from './word-match.js';
import * as CardReveal from './card-reveal.js';

// Global state
let currentScreen = 'home';
export let totalPoints = 0;

// Function to switch between screens
export function showScreen(screenId) {
    // Log the screen we're switching to
    console.log('Switching to screen:', screenId);

    // Update totalPoints from localStorage before switching screens
    totalPoints = parseInt(localStorage.getItem('points') || '0');
    
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('results-screen').style.display = 'none';
    document.getElementById('card-reveal-screen').style.display = 'none';
    document.getElementById(screenId).style.display = screenId === 'results-screen' ? 'flex' : 'block';

    currentScreen = screenId.replace('-screen', '');
    updateNavHighlight(screenId);

    // Update points display when switching screens
    updatePointsDisplay();

    // Additional logic for specific screens
    if (screenId === 'home-screen') {
        console.log('Updating points display for home screen');
        updatePointsDisplay();
    } else if (screenId === 'card-reveal-screen') {
        const savedCategory = localStorage.getItem('selectedCategory');
        CardReveal.initCardReveal(savedCategory);
    }
}


function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const screenId = item.dataset.screen;
            console.log('Navigation clicked:', screenId);
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

// Styling for navigation screen
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

// Function to load points from localStorage
function loadPoints() {
    totalPoints = parseInt(localStorage.getItem('points') || '0');
}

// Function to update points
export function updatePoints(change) {
    console.log('Updating points. Current:', totalPoints, 'Change:', change);
    totalPoints += change;
    localStorage.setItem('points', totalPoints.toString());
    console.log('New total points:', totalPoints);
    updatePointsDisplay();
}

// Function to update points display on all screens
export function updatePointsDisplay() {
    console.log('Updating points display. Current total points:', totalPoints);
    const pointsDisplays = document.querySelectorAll('.points-display span');
    pointsDisplays.forEach(display => {
        display.textContent = totalPoints;
    });
}

function initializePoints() {
    totalPoints = parseInt(localStorage.getItem('points') || '0');
    console.log('Initialized total points:', totalPoints);
    updatePointsDisplay();
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    try {
        loadPoints();
        HomeScreen.initHomeScreen();
        initializePoints();
        initNavigation();
        // updatePointsDisplay();
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

// export { totalPoints };
