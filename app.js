// Import functionality from other JS files
import * as HomeScreen from './home-screen.js';
import * as Game from './word-match.js';
import * as CardReveal from './card-reveal.js';
import * as PlinkoGame from './plinko.js';
import * as ShowWonCard from './show-won-card.js';

// Global state
let currentScreen = 'home';
export let totalPoints = 0;
export let wordCategories = {};

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
    document.getElementById('plinko-screen').style.display = 'none';
    document.getElementById('show-won-card-screen').style.display = 'none';

    // Show the selected screen
    document.getElementById(screenId).style.display = 
        ['results-screen', 'plinko-screen', 'show-won-card-screen'].includes(screenId) ? 'flex' : 'block';

    currentScreen = screenId.replace('-screen', '');
    updateNavHighlight(screenId);

    // Update points display when switching screens
    updatePointsDisplay();

    // Cleanup functions
    ShowWonCard.resetWonCardScreen();

    // Additional logic for specific screens
    if (screenId === 'home-screen') {
        console.log('Updating points display for home screen');
        HomeScreen.initHomeScreen();
    } else if (screenId === 'plinko-screen') {
        const savedCategory = localStorage.getItem('selectedCategory');
        if (savedCategory && wordCategories[savedCategory]) {
            PlinkoGame.initPlinkoGame(savedCategory, wordCategories[savedCategory]);
        } else {
            console.error('Invalid category for Plinko game:', savedCategory);
            alert('Error loading Plinko game. Please try again.');
            showScreen('home-screen'); // Redirect to home screen on error
        }
    } else if (screenId === 'card-reveal-screen') {
        const savedCategory = localStorage.getItem('selectedCategory');
        if (savedCategory && wordCategories[savedCategory]) {
            CardReveal.initCardReveal(savedCategory, wordCategories[savedCategory]);
        } else {
            console.error('Invalid category for card reveal:', savedCategory);
            alert('Error loading card reveal. Please try again.');
            showScreen('home-screen'); // Redirect to home screen on error
        }
    } else if (screenId === 'show-won-card-screen') {
        // No initialization needed for this screen
        // The showWonCard function will handle the display
    }
}

// Fetch word categories
export async function fetchWordCategories() {
    try {
        const response = await fetch('word-categories.json');
        wordCategories = await response.json();
        return wordCategories;
    } catch (error) {
        console.error('Error fetching word categories:', error);
        return null;
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
        // Only update the text content if it's different
        if (display.textContent !== totalPoints.toString()) {
            display.textContent = totalPoints;
        }
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
        await fetchWordCategories();
        loadPoints();
        HomeScreen.initHomeScreen();
        initializePoints();
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

// export { totalPoints };
