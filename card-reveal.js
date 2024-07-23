import { updatePoints, totalPoints, updatePointsDisplay } from './app.js';
import { showWonCard } from './show-won-card.js';
import { animatePointsDecrement, showOutOfPointsMessage, checkSufficientPoints } from './mini-game-common.js';

export let revealedBlocks = 0;
export const totalBlocks = 16;
export let currentCardCategory = '';
export let currentCard = '';
let needNewCard = true;
export let isCardFullyRevealed = false;

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
        needNewCard = progress.needNewCard;
    } else {
        console.log('No saved progress or card was fully revealed. Starting new card.');
        revealedBlocks = 0;
        isCardFullyRevealed = false;
        needNewCard = true;
    }
    if (needNewCard) {
        currentCard = selectRandomCard(categoryData);
        needNewCard = false;
        saveProgress();
    }

    // Reset DOM elements
    const cardBoard = document.getElementById('card-board');
    cardBoard.style.display = 'grid';
    cardBoard.innerHTML = '';

    updateCardImage();
    createCardBoard();
    updatePointsDisplay();
    applyProgress();
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

export function updateCardImage(card = currentCard, category = currentCardCategory, gameType = 'cardReveal') {
    const imageId = gameType === 'plinko' ? 'plinko-card-image' : 'card-reveal-image';
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
    if (checkSufficientPoints() && block.style.opacity !== '0') {
        block.style.opacity = '0';
        updatePoints(-1); // This will decrease totalPoints and update localStorage
        animatePointsDecrement('card-reveal-points');
        revealedBlocks++;
        saveProgress();
        checkGameState();
        console.log('Block revealed, current state:', { totalPoints, revealedBlocks });
    } else if (!checkSufficientPoints()) {
        showOutOfPointsMessage('out-of-points-message');
    }
}

function checkGameState() {
    if (revealedBlocks === totalBlocks && !isCardFullyRevealed) {
        isCardFullyRevealed = true;
        needNewCard = true;
        saveWonCard();
        saveProgress();
        showWonCard(`card-images/${currentCard}`, 'card-reveal');
    }
}

function saveProgress() {
    const progress = {
        revealedBlocks: revealedBlocks,
        currentCard: currentCard,
        isCardFullyRevealed: isCardFullyRevealed, 
        needNewCard: needNewCard
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