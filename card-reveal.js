let pointsLeft = 0;
let revealedBlocks = 0;
const totalBlocks = 16;
let currentCardCategory = '';
let currentCard = '';
let isCardFullyRevealed = false;

async function initCardReveal(initialPoints, category) {
  console.log('Initializing Card Reveal with', initialPoints, 'points and category:', category);
  currentCardCategory = category;
  const progress = JSON.parse(localStorage.getItem('cardRevealProgress'));

  if (progress) {
    console.log('Found saved progress:', progress);
    pointsLeft = initialPoints;
    revealedBlocks = progress.revealedBlocks;
    currentCard = progress.currentCard;
    isCardFullyRevealed = progress.isCardFullyRevealed || false;
  } else {
    console.log('No saved progress found');
    pointsLeft = initialPoints;
    revealedBlocks = 0;
    isCardFullyRevealed = false;
    await selectRandomCard();
  }

  console.log('Current state:', { pointsLeft, revealedBlocks, currentCard, currentCardCategory, isCardFullyRevealed });

  const cardRevealContainer = document.getElementById('card-reveal-container');
  cardRevealContainer.style.display = 'block';

  const levelContainer = document.getElementById('level-container');
  levelContainer.style.display = 'none';

  updateCardImage();
  createCardBoard();
  updatePointsDisplay();
  applyProgress();
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

function createCardBoard() {
  const cardBoard = document.getElementById('card-board');
  cardBoard.innerHTML = '';

  for (let i = 0; i < totalBlocks; i++) {
    const block = document.createElement('div');
    block.className = 'card-block';
    block.addEventListener('click', () => revealBlock(block, i));
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
    alert('Congratulations! You revealed the entire card!');
    // Remove all blocks to fully show the card
    const blocks = document.querySelectorAll('.card-block');
    blocks.forEach(block => block.style.display = 'none');
    // Update the points display
    updatePointsDisplay();
    // Save the progress
    saveProgress();
  } else if (pointsLeft === 0 && !isCardFullyRevealed) {
    alert('You ran out of points! Play more word games to earn more points.');
  }
}

function saveProgress() {
  const progress = {
    pointsLeft: pointsLeft,
    revealedBlocks: revealedBlocks,
    currentCard: currentCard,
    isCardFullyRevealed: isCardFullyRevealed
  };
  localStorage.setItem('cardRevealProgress', JSON.stringify(progress));
  console.log('Progress saved:', progress);
}

function returnHome() {
  const cardRevealContainer = document.getElementById('card-reveal-container');
  cardRevealContainer.style.display = 'none';

  saveProgress();
  savePoints();

  // Reset the card reveal game state for the next play
  resetCardRevealState();

  window.location.href = 'index.html';
}

function resetCardRevealState() {
  if (isCardFullyRevealed) {
    revealedBlocks = 0;
    isCardFullyRevealed = false;
    selectRandomCard().then(() => {
      updateCardImage();
      createCardBoard();
      updatePointsDisplay();
    });
  }
}

function savePoints() {
  localStorage.setItem('savedPoints', pointsLeft.toString());
  console.log('Saved points:', pointsLeft);
}

function resetCardRevealProgress() {
  localStorage.removeItem('cardRevealProgress');
  localStorage.removeItem('savedPoints');
  revealedBlocks = 0;
  pointsLeft = 0;
  selectRandomCard().then(() => {
    updateCardImage();
    createCardBoard();
    updatePointsDisplay();
  });
  console.log('Card reveal progress reset');
}