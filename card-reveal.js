import { showScreen } from './app.js';

export let pointsLeft = 0;
export let revealedBlocks = 0;
export const totalBlocks = 16;
export let currentCardCategory = '';
export let currentCard = '';
export let isCardFullyRevealed = false;

export async function initCardReveal(initialPoints, category) {
    console.log('Initializing Card Reveal with', initialPoints, 'points and category:', category);
    currentCardCategory = category;

    const progress = JSON.parse(localStorage.getItem('cardRevealProgress'));
    const savedPoints = parseInt(localStorage.getItem('points') || '0');

    if (progress && !progress.isCardFullyRevealed) {
        console.log('Found saved progress:', progress);
        revealedBlocks = progress.revealedBlocks;
        currentCard = progress.currentCard;
        isCardFullyRevealed = false;
        pointsLeft = savedPoints;  // Use saved points
    } else {
        console.log('No saved progress or card was fully revealed. Starting new card.');
        revealedBlocks = 0;
        isCardFullyRevealed = false;
        pointsLeft = initialPoints;
        document.getElementById('card-board').style.display = 'block';
        await selectRandomCard();
    }

    // Reset DOM elements
    const cardBoard = document.getElementById('card-board');
    cardBoard.style.display = 'grid'; // or whatever the default display value should be
    cardBoard.innerHTML = ''; // Clear existing blocks

    const cardImageContainer = document.querySelector('.card-image-container');
    cardImageContainer.classList.remove('card-revealed');

    // Remove any existing sparkles
    const sparkles = cardImageContainer.querySelectorAll('.sparkle');
    sparkles.forEach(sparkle => sparkle.remove());

    updateCardImage();
    createCardBoard();
    updatePointsDisplay();
    applyProgress();

    // Show the card reveal container
    const cardRevealContainer = document.getElementById('card-reveal-container');
    cardRevealContainer.style.display = 'block';
}

async function selectRandomCard() {
  try {
    console.log('Fetching word categories...');
    const response = await fetch('word-categories.json');
    const categories = await response.json();
    console.log('Fetched categories:', categories);
    console.log('Current category:', currentCardCategory);
    const cards = categories[currentCardCategory].cards;
    console.log('Available cards:', cards);
    currentCard = cards[Math.floor(Math.random() * cards.length)];
    console.log('Selected card:', currentCard);
  } catch (error) {
    console.error('Error selecting random card:', error);
    currentCard = 'default-card.png';
  }
}

function updateCardImage() {
  const cardImage = document.getElementById('card-image');
  const imagePath = `card-images/${currentCard}`;
  console.log('Setting card image src to:', imagePath);
  cardImage.src = imagePath;
  cardImage.alt = `Card from ${currentCardCategory}`;

  cardImage.onload = () => {
    console.log('Image loaded successfully');
  };

  cardImage.onerror = () => {
    console.error('Failed to load image:', imagePath);
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
    if (pointsLeft > 0 && block.style.opacity !== '0') {
        block.style.opacity = '0';
        pointsLeft--;
        revealedBlocks++;
        updatePointsDisplay();
        saveProgress();
        checkGameState();
        console.log('Block revealed, current state:', { pointsLeft, revealedBlocks });
    } else if (pointsLeft === 0) {
        showOutOfPointsMessage();
    }
}

function updatePointsDisplay() {
  const pointsLeftElement = document.getElementById('points-left');
  if (pointsLeftElement) {
    pointsLeftElement.textContent = `Points left: ${pointsLeft}`;
  }
}

function checkGameState() {
    if (revealedBlocks === totalBlocks && !isCardFullyRevealed) {
        isCardFullyRevealed = true;
        revealCard();
        // Save the progress
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


function saveProgress() {
    const progress = {
        revealedBlocks: revealedBlocks,
        currentCard: currentCard,
        isCardFullyRevealed: isCardFullyRevealed
    };
    localStorage.setItem('cardRevealProgress', JSON.stringify(progress));
    localStorage.setItem('points', pointsLeft.toString());
    console.log('Progress saved:', progress);
}

function showOutOfPointsMessage() {
    const message = document.getElementById('out-of-points-message');
    message.classList.add('show');

    setTimeout(() => {
        message.classList.remove('show');
    }, 3000);
}

export function returnHome() {
    saveProgress();
    showScreen('home-screen');
    updatePointsDisplay();
}