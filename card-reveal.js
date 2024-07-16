let turnsLeft = 0;
let revealedBlocks = 0;
const totalBlocks = 16;
let currentCardCategory = '';
let currentCard = '';
let isCardFullyRevealed = false;

async function initCardReveal(initialTurns, category) {
  console.log('Initializing Card Reveal with', initialTurns, 'turns and category:', category);
  currentCardCategory = category;
  const progress = JSON.parse(localStorage.getItem('cardRevealProgress'));

  if (progress) {
    console.log('Found saved progress:', progress);
    turnsLeft = initialTurns;
    revealedBlocks = progress.revealedBlocks;
    currentCard = progress.currentCard;
    isCardFullyRevealed = progress.isCardFullyRevealed || false;
  } else {
    console.log('No saved progress found');
    turnsLeft = initialTurns;
    revealedBlocks = 0;
    isCardFullyRevealed = false;
    await selectRandomCard();
  }

  console.log('Current state:', { turnsLeft, revealedBlocks, currentCard, currentCardCategory, isCardFullyRevealed });

  const cardRevealContainer = document.getElementById('card-reveal-container');
  cardRevealContainer.style.display = 'block';

  const levelContainer = document.getElementById('level-container');
  levelContainer.style.display = 'none';

  updateCardImage();
  createCardBoard();
  updateTurnsDisplay();
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
  if (turnsLeft > 0 && block.style.opacity !== '0') {
    block.style.opacity = '0';
    turnsLeft--;
    revealedBlocks++;
    updateTurnsDisplay();
    saveProgress();
    checkGameState();
    console.log('Block revealed, current state:', { turnsLeft, revealedBlocks });
  }
}

function updateTurnsDisplay() {
  const turnsLeftElement = document.getElementById('turns-left');
  if (turnsLeftElement) {
    turnsLeftElement.textContent = `Turns left: ${turnsLeft}`;
  }
}

function checkGameState() {
  if (revealedBlocks === totalBlocks && !isCardFullyRevealed) {
    isCardFullyRevealed = true;
    alert('Congratulations! You revealed the entire card!');
    // Remove all blocks to fully show the card
    const blocks = document.querySelectorAll('.card-block');
    blocks.forEach(block => block.style.display = 'none');
    // Update the turns display
    updateTurnsDisplay();
    // Save the progress
    saveProgress();
  } else if (turnsLeft === 0 && !isCardFullyRevealed) {
    alert('You ran out of turns! Play more word games to earn more turns.');
  }
}

function saveProgress() {
  const progress = {
    turnsLeft: turnsLeft,
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

  const difficultyScreen = document.getElementById('difficulty-screen');
  difficultyScreen.style.display = 'flex';

  saveProgress();
  saveTurns();

  // Reset the card reveal game state for the next play
  resetCardRevealState();
}

function resetCardRevealState() {
  if (isCardFullyRevealed) {
    revealedBlocks = 0;
    isCardFullyRevealed = false;
    selectRandomCard().then(() => {
      updateCardImage();
      createCardBoard();
      updateTurnsDisplay();
    });
  }
}

function saveTurns() {
  localStorage.setItem('savedTurns', turnsLeft.toString());
  console.log('Saved turns:', turnsLeft);
}

function resetCardRevealProgress() {
  localStorage.removeItem('cardRevealProgress');
  localStorage.removeItem('savedTurns');
  revealedBlocks = 0;
  turnsLeft = 0;
  selectRandomCard().then(() => {
    updateCardImage();
    createCardBoard();
    updateTurnsDisplay();
  });
  console.log('Card reveal progress reset');
}