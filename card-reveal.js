import { updatePoints, totalPoints, updatePointsDisplay } from './app.js';

export let revealedBlocks = 0;
export const totalBlocks = 16;
export let currentCardCategory = '';
export let currentCard = '';
export let isCardFullyRevealed = false;
const noPointsSound = new Audio('game-sounds/need-points.m4a');

export async function initCardReveal(category, categoryData) {
    const currentPoints = parseInt(localStorage.getItem('points') || '0');
    console.log('Initializing Card Reveal with', currentPoints, 'points and category:', category);
    currentCardCategory = category;

    const progress = JSON.parse(localStorage.getItem('cardRevealProgress'));

    if (progress && !progress.isCardFullyRevealed) {
        console.log('Found saved progress:', progress);
        revealedBlocks = progress.revealedBlocks;
        currentCard = progress.currentCard;
        isCardFullyRevealed = false;
    } else {
        console.log('No saved progress or card was fully revealed. Starting new card.');
        revealedBlocks = 0;
        isCardFullyRevealed = false;
        if (!selectRandomCard(categoryData)) {
            console.error('Failed to select a random card. Unable to initialize card reveal.');
            return; // Exit the function if we can't select a card
        }
    }

    // Reset DOM elements
    const cardBoard = document.getElementById('card-board');
    cardBoard.style.display = 'grid';
    cardBoard.innerHTML = '';

    const cardImageContainer = document.querySelector('.card-image-container');
    cardImageContainer.classList.remove('card-revealed');

    // Remove any existing sparkles
    const sparkles = cardImageContainer.querySelectorAll('.sparkle');
    sparkles.forEach(sparkle => sparkle.remove());

    // Preload audio
    noPointsSound.load();

    updateCardImage();
    createCardBoard();
    updatePointsDisplay();
    applyProgress();

    // Show the card reveal container
    const cardRevealContainer = document.getElementById('card-reveal-container');
    cardRevealContainer.style.display = 'block';
}

function selectRandomCard(categoryData) {
    try {
        console.log('Selecting random card from category data:', categoryData);
        if (!categoryData || !categoryData.cards || categoryData.cards.length === 0) {
            console.error('Invalid category data or no cards available');
            return false;
        }
        const cards = categoryData.cards;
        console.log('Available cards:', cards);
        currentCard = cards[Math.floor(Math.random() * cards.length)];
        console.log('Selected card:', currentCard);
        return true;
    } catch (error) {
        console.error('Error selecting random card:', error);
        return false;
    }
}

function updateCardImage() {
    const cardImage = document.getElementById('card-image');
    if (!currentCard) {
        console.error('No card selected. Unable to update card image.');
        return;
    }
    const imagePath = `card-images/${currentCard}`;
    console.log('Setting card image src to:', imagePath);
    cardImage.src = imagePath;
    cardImage.alt = `Card from ${currentCardCategory}`;

    cardImage.onload = () => {
        console.log('Image loaded successfully');
    };

    cardImage.onerror = () => {
        console.error('Failed to load image:', imagePath);
        // Set a default image or show an error message
        cardImage.src = 'path/to/default-or-error-image.png';
        cardImage.alt = 'Error loading card image';
    };
}

export function createCardBoard() {
  const cardBoard = document.getElementById('card-board');
  cardBoard.innerHTML = '';

  for (let i = 0; i < totalBlocks; i++) {
    const block = document.createElement('div');
    block.className = 'card-block';
    block.dataset.index = i;  // Store the index in a data attribute
    block.addEventListener('click', function() {
      revealBlock(this, this.dataset.index);
    });
    cardBoard.appendChild(block);
  }
}

function applyProgress() {
  console.log('Applying progress, revealed blocks:', revealedBlocks);
  const blocks = document.querySelectorAll('.card-block');
  if (isCardFullyRevealed) {
    blocks.forEach(block => block.style.display = 'none');
  } else {
    for (let i = 0; i < revealedBlocks; i++) {
      if (blocks[i]) {
        blocks[i].style.opacity = '0';
      }
    }
  }
}

function revealBlock(block, index) {
    if (totalPoints > 0 && block.style.opacity !== '0') {
        block.style.opacity = '0';
        updatePoints(-1); // This will decrease totalPoints and update localStorage
        animatePointsDecrement();
        revealedBlocks++;
        saveProgress();
        checkGameState();
        console.log('Block revealed, current state:', { totalPoints, revealedBlocks });
    } else if (totalPoints === 0) {
        showOutOfPointsMessage();
        playNoPointsSound();
    }
}

function checkGameState() {
    if (revealedBlocks === totalBlocks && !isCardFullyRevealed) {
        isCardFullyRevealed = true;
        revealCard();
        saveWonCard();
        saveProgress();
    }
}

// Animation when the card is fully revealed
function revealCard() {
    const cardImageContainer = document.querySelector('.card-image-container');
    const cardBoard = document.getElementById('card-board');

    // Hide the card board
    cardBoard.style.display = 'none';

    // Add the revealed class to apply the pop-up effect
    cardImageContainer.classList.add('card-revealed');

    // Add sparkle animation
    addSparkles(cardImageContainer);
}

// Sparkle animation for when the card is revealed
function addSparkles(container) {
    const numSparkles = 20;

    for (let i = 0; i < numSparkles; i++) {
        const sparkle = document.createElement('div');
        sparkle.classList.add('sparkle');

        // Random position within the container
        const left = Math.random() * 100 + '%';
        const top = Math.random() * 100 + '%';

        sparkle.style.left = left;
        sparkle.style.top = top;

        // Random delay and duration for the animation
        const delay = Math.random() * 1000 + 'ms';
        const duration = (Math.random() * 1000 + 1000) + 'ms';

        sparkle.style.animation = `sparkle ${duration} ${delay} infinite`;

        container.appendChild(sparkle);
    }
}

function animatePointsDecrement() {
    const pointsDisplay = document.getElementById('card-reveal-points');
    if (pointsDisplay) {
        pointsDisplay.classList.add('decrement');
        setTimeout(() => {
            pointsDisplay.classList.remove('decrement');
        }, 500); // Match this to the animation duration in CSS
    } else {
        console.error('Points display element not found in card reveal screen');
    }
}

function saveProgress() {
    const progress = {
        revealedBlocks: revealedBlocks,
        currentCard: currentCard,
        isCardFullyRevealed: isCardFullyRevealed
    };
    localStorage.setItem('cardRevealProgress', JSON.stringify(progress));
    console.log('Progress saved:', progress);
}

// Save won cards to local storage
function saveWonCard() {
    const wonCards = JSON.parse(localStorage.getItem('wonCards') || '{}');
    if (!wonCards[currentCardCategory]) {
        wonCards[currentCardCategory] = [];
    }
    if (!wonCards[currentCardCategory].includes(currentCard)) {
        wonCards[currentCardCategory].push(currentCard);
        localStorage.setItem('wonCards', JSON.stringify(wonCards));
    }
}

function showOutOfPointsMessage() {
    const message = document.getElementById('out-of-points-message');
    message.classList.add('show');

    setTimeout(() => {
        message.classList.remove('show');
    }, 1500);
}

function playNoPointsSound() {
    noPointsSound.currentTime = 0; // Reset the audio to the beginning
    noPointsSound.play().catch(error => console.error('Error playing audio:', error));
}