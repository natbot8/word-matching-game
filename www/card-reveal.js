import { updatePoints, totalPoints, updatePointsDisplay } from './app.js';
import { showWonCard } from './show-won-card.js';
import { 
    animatePointsDecrement, 
    showOutOfPointsMessage, 
    checkSufficientPoints, 
    updateCardImage, 
    selectRandomCard, 
    saveWonCard, 
    saveProgress 
} from './mini-game-common.js';

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
        saveProgress('cardReveal', {
            revealedBlocks,
            currentCard,
            isCardFullyRevealed,
            needNewCard
        });
    }

    // Reset DOM elements
    const cardBoard = document.getElementById('card-board');
    cardBoard.style.display = 'grid';
    cardBoard.innerHTML = '';

    updateCardImage(currentCard, currentCardCategory, 'cardReveal', 'card-reveal-image');
    createCardBoard();
    updatePointsDisplay();
    applyProgress();
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
        saveProgress('cardReveal', {
            revealedBlocks,
            currentCard,
            isCardFullyRevealed,
            needNewCard
        });
        checkGameState();
        console.log('Block revealed, current state:', { totalPoints, revealedBlocks });
    } else if (!checkSufficientPoints()) {
        showOutOfPointsMessage('card-reveal-out-of-points-message');
    }
}

function checkGameState() {
    if (revealedBlocks === totalBlocks && !isCardFullyRevealed) {
        isCardFullyRevealed = true;
        needNewCard = true;
        saveWonCard(currentCard, currentCardCategory);
        saveProgress('cardReveal', {
            revealedBlocks,
            currentCard,
            isCardFullyRevealed,
            needNewCard
        });
        showWonCard(currentCard, 'card-reveal');
    }
}