import { totalPoints } from './app.js';

const noPointsSound = new Audio('game-sounds/need-points.m4a');

export function animatePointsDecrement(pointsDisplayId) {
    const pointsDisplay = document.getElementById(pointsDisplayId);
    if (pointsDisplay) {
        pointsDisplay.classList.add('decrement');
        setTimeout(() => {
            pointsDisplay.classList.remove('decrement');
        }, 500); // Match this to the animation duration in CSS
    } else {
        console.error(`Points display element with id '${pointsDisplayId}' not found`);
    }
}

export function showOutOfPointsMessage(messageElementId) {
    const message = document.getElementById(messageElementId);
    if (message) {
        message.classList.add('show');
        setTimeout(() => {
            message.classList.remove('show');
        }, 1500);
        playNoPointsSound();
    } else {
        console.error(`Message element with id '${messageElementId}' not found`);
    }
}

export function checkSufficientPoints() {
    return totalPoints > 0;
}

export function updateCardImage(card, category, gameType, imageId) {
    const cardImage = document.getElementById(imageId);

    if (!cardImage) {
        console.error(`Card image element with id '${imageId}' not found.`);
        return;
    }

    if (!card) {
        console.error('No card selected. Unable to update card image.');
        return;
    }

    const imagePath = `card-images/${card}`;
    console.log(`Setting ${gameType} card image src to:`, imagePath);
    cardImage.src = imagePath;
    cardImage.alt = `Card from ${category}`;

    cardImage.onload = () => {
        console.log('Image loaded successfully');
    };

    cardImage.onerror = () => {
        console.error('Failed to load image:', imagePath);
        cardImage.src = 'path/to/default-or-error-image.png';
        cardImage.alt = 'Error loading card image';
    };
}

export function selectRandomCard(categoryData) {
    try {
        console.log('Selecting random card from category data:', categoryData);
        if (!categoryData || !categoryData.cards || categoryData.cards.length === 0) {
            console.error('Invalid category data or no cards available');
            return null;
        }
        const cards = categoryData.cards;
        console.log('Available cards:', cards);
        const selectedCard = cards[Math.floor(Math.random() * cards.length)];
        console.log('Selected card:', selectedCard);
        return selectedCard;
    } catch (error) {
        console.error('Error selecting random card:', error);
        return null;
    }
}

export function saveWonCard(currentCard, currentCategory) {
    const wonCards = JSON.parse(localStorage.getItem('wonCards') || '{}');
    if (!wonCards[currentCategory]) {
        wonCards[currentCategory] = [];
    }
    if (!wonCards[currentCategory].includes(currentCard)) {
        wonCards[currentCategory].push(currentCard);
        localStorage.setItem('wonCards', JSON.stringify(wonCards));
    }
}

export function saveProgress(gameType, progressData) {
    localStorage.setItem(`${gameType}Progress`, JSON.stringify(progressData));
    console.log(`${gameType} progress saved:`, progressData);
}

function playNoPointsSound() {
    noPointsSound.currentTime = 0; // Reset to start of the audio
    noPointsSound.play().catch(error => console.error('Error playing audio:', error));
}
