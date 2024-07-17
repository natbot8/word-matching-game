import { showScreen } from './app.js';
import { initCardReveal } from './card-reveal.js';

let words = {};
export const levels = [];
export let letterSounds = {};
export const WORDS_PER_ROUND = 10;
export let points = 0; 
export let totalPoints = 0;
export let numImages = 2;
export let currentLevel = 0;
export let isProcessing = false;
export let selectedCategory = '';
export let selectedDifficulty = '';

// Fetch word categories from JSON file
async function fetchWordCategories() {
    try {
        const response = await fetch('word-categories.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching word categories:', error);
        return null;
    }
}

// Fetch word categories from JSON file
async function fetchLetterSounds() {
    try {
        const response = await fetch('letter-sounds.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching letter sounds:', error);
        return null;
    }
}

// Function to start the game based on the selected difficulty
export async function initializeGame() {
    selectedCategory = localStorage.getItem('selectedCategory');
    selectedDifficulty = localStorage.getItem('selectedDifficulty');

    console.log('Selected Category:', selectedCategory);
    console.log('Selected Difficulty:', selectedDifficulty);

    if (!selectedCategory || !selectedDifficulty) {
        console.error('Category or difficulty not selected');
        // You might want to redirect to the home page or show an error message
        return;
    }

    // Load total points from localStorage
    totalPoints = parseInt(localStorage.getItem('points') || '0');
    console.log('Loaded total points:', totalPoints);
    updateTotalPointsDisplay();

    // Fetch word categories
    try {
      words = await fetchWordCategories();
      if (!words) {
          throw new Error('Failed to fetch word categories');
      }
      console.log('Fetched word categories:', words);
  
      // Load letter sounds
      letterSounds = await fetchLetterSounds();
      if (!letterSounds) {
          throw new Error('Failed to fetch letter sounds');
      }
      console.log('Fetched letter sounds:', letterSounds);
    } catch (error) {
      console.error('Error loading data:', error);
      return;
    }

    // Set the difficulty based on the selected value
    if (selectedDifficulty === 'easy') {
        numImages = 3;
    } else if (selectedDifficulty === 'hard') {
        numImages = 4;
    } else if (selectedDifficulty === 'superhard') {
        numImages = 6;
    } else if (selectedDifficulty === 'superduperhard') {
        numImages = 12;
    }

    // Shuffle words and create levels
    const categoryWords = words[selectedCategory].words;
    if (!Array.isArray(categoryWords) || categoryWords.length === 0) {
        console.error('No words found for the selected category');
        return;
    }

    shuffleArray(categoryWords);
    levels.length = 0; // Clear previous levels
    for (let i = 0; i < Math.min(WORDS_PER_ROUND, categoryWords.length); i++) {
        const word = categoryWords[i];
        const level = {
            word: word.toUpperCase(),
            image: `./images/${word}.jpg`,
        };
        levels.push(level);
    }

    // Reset currentLevel and points
    currentLevel = 0;
    points = 0;

    // Start the game with the selected difficulty
    loadLevel();

    // Make sure the game container is visible
    document.getElementById('level-container').style.display = 'block';
}

// Load the initial level
export function loadLevel() {
  const currentLevelData = levels[currentLevel];
  const levelContainer = document.getElementById('level-container');
  levelContainer.innerHTML = ''; // Clear previous elements

  // Create and append the points display
  const pointsDisplay = document.createElement('div');
  pointsDisplay.className = 'points-display';
  pointsDisplay.innerHTML = `
    <span id="total-points-value">${totalPoints}</span>
    <img src="icons/coin.png" alt="Total Points">
  `;
  levelContainer.appendChild(pointsDisplay);

  // Create and append the word display
  const wordDisplay = document.createElement('div');
  wordDisplay.id = 'word-display';
  levelContainer.appendChild(wordDisplay);

  // Create and append the confetti container
  const confettiContainer = document.createElement('div');
  confettiContainer.id = 'confetti-container';
  levelContainer.appendChild(confettiContainer);

  // Create and append the score container
  const scoreContainer = document.createElement('div');
  scoreContainer.id = 'score-container';
  scoreContainer.innerHTML = `
    <div id="current-points">Points Won: <span id="current-points-value">${points}</span></div>
    <div id="coin-container"></div>
  `;
  levelContainer.appendChild(scoreContainer);

  // Create and append the letter container
  const letterContainer = document.createElement('div');
  letterContainer.id = 'letter-container';
  levelContainer.appendChild(letterContainer);

  // Create and append the image container
  const imageContainer = document.createElement('div');
  imageContainer.id = 'image-container';
  levelContainer.appendChild(imageContainer);

  // Populate letter buttons
  const word = currentLevelData.word.toLowerCase();
  let i = 0;
  while (i < word.length) {
    let soundUnit = word[i];
    let j = i + 1;

    // Check for letter combinations
    if (letterSounds && letterSounds.letterCombinations) {
      for (let combo of Object.keys(letterSounds.letterCombinations)) {
        if (word.slice(i).startsWith(combo)) {
          soundUnit = combo;
          j = i + combo.length;
          break;
        }
      }
    }

    const letterButton = document.createElement('button');
    letterButton.innerText = soundUnit.toUpperCase();
    letterButton.className = 'letter-button';
    letterButton.onclick = () => playLetterSound(soundUnit);
    letterContainer.appendChild(letterButton);

    i = j;
  }

  // Adjust letter container alignment
  if (letterContainer.scrollWidth > letterContainer.clientWidth) {
    letterContainer.style.justifyContent = 'flex-start'; // Left align when overflow
  } else {
    letterContainer.style.justifyContent = 'center'; // Center align when no overflow
  }

  // Populate image options
  const images = [...getRandomImages(currentLevelData)];
  const shuffledImages = shuffleArray(images);

  for (const imgSrc of shuffledImages) {
    const imgElement = document.createElement('img');
    imgElement.src = imgSrc;
    imgElement.alt = 'Word Image';
    imgElement.classList.add('image-option');
    imgElement.onclick = () => checkImage(imgElement, currentLevelData);
    imageContainer.appendChild(imgElement);
  }

  // Update coin icons
  updateCoinIcons();
}

// Shuffle array function
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// get sound files from https://www.readnaturally.com/article/audio-examples-of-phonics-sounds
export function playLetterSound(soundUnit) {
  let soundFile;
  soundUnit = soundUnit.toLowerCase();

  if (letterSounds.letterCombinations && letterSounds.letterCombinations[soundUnit]) {
    soundFile = letterSounds.letterCombinations[soundUnit];
  } else if (letterSounds.singleLetters && letterSounds.singleLetters[soundUnit]) {
    soundFile = letterSounds.singleLetters[soundUnit];
  } else {
    console.warn(`No sound file found for: ${soundUnit}`);
    return;
  }

  const audio = new Audio(`./letter-sounds/${soundFile}`);
  audio.play().catch(error => console.error('Error playing audio:', error));
}

function getRandomImages(currentLevelData) {
  if (!words || !words[selectedCategory] || !Array.isArray(words[selectedCategory].words)) {
    console.error('Invalid word data structure');
    return [];
  }

  const randomImages = [];
  const categoryWords = words[selectedCategory].words;
  const wordIndex = categoryWords.findIndex(word => word.trim().toLowerCase() === currentLevelData.word.toLowerCase().trim());

  if (wordIndex === -1) {
    console.error('Current word not found in category words');
    return [];
  }

  // Get the word's image
  randomImages.push(currentLevelData.image);

  // Remove the word from the category words array temporarily to prevent repetition
  const tempWords = categoryWords.slice(0); // Copy the words array
  tempWords.splice(wordIndex, 1); // Remove the word

  // Shuffle the tempWords array
  const shuffledWords = shuffleArray(tempWords);

  // Get unique random images from the shuffled words array
  while (randomImages.length < numImages && shuffledWords.length > 0) {
    const randomWord = shuffledWords.pop();
    if (randomWord) {
      const randomImage = `./images/${encodeURIComponent(randomWord)}.jpg`;
      if (!randomImages.includes(randomImage)) {
        randomImages.push(randomImage);
      }
    }
  }

  return randomImages;
}

export function checkImage(imgElement, currentLevelData) {
  if (isProcessing) {
    return; 
  }

  isProcessing = true; 

  const wordDisplay = currentLevelData.word.toLowerCase();
  const currentImageSrc = imgElement.src.toLowerCase();
  const currentWord = decodeURIComponent(currentImageSrc.substring(currentImageSrc.lastIndexOf('/') + 1, currentImageSrc.lastIndexOf('.')));
  const correctSound = new Audio('game-sounds/nice-2.m4a')
  const wrongSound = new Audio('game-sounds/try-again.m4a')

  if (currentWord === wordDisplay) {
    updatePoints(true); // Pass true for correct answer
    correctSound.play();

    // Show confetti animation
    showConfetti();

    showResultText('Congratulations!', 1500);
    setTimeout(() => {
      nextLevel();
      isProcessing = false; 
    }, 1500);
  } else {
    updatePoints(false); 
    wrongSound.play();
    showResultText('Try again', 1500);
    isProcessing = false;
  }
}

function updatePoints(correctAnswer) {
    if (correctAnswer) {
        points++;
    } else {
        if (points > 0) {
            points--;
        }
    }
    console.log('Current Points:', points);
    updateCoinIcons();
    document.getElementById('current-points-value').innerText = points;
}

function updateCoinIcons() {
    const coinContainer = document.getElementById('coin-container');
    coinContainer.innerHTML = ''; // Clear existing coins

    for (let i = 0; i < points; i++) {
        const coinIcon = document.createElement('img');
        coinIcon.src = 'icons/coin.png';
        coinIcon.alt = 'Coin';
        coinIcon.classList.add('coin-icon');
        coinContainer.appendChild(coinIcon);
    }
}

function updateTotalPointsDisplay() {
    const totalPointsDisplay = document.getElementById('total-points-value');
    if (totalPointsDisplay) {
        totalPointsDisplay.textContent = totalPoints;
    }
}

export function nextLevel() {
    currentLevel++;
    if (currentLevel < WORDS_PER_ROUND) {
        loadLevel();
    } else {
        totalPoints += points;
        localStorage.setItem('points', totalPoints.toString());
        alert(`Congratulations! You completed all ${WORDS_PER_ROUND} words. Your total points: ${totalPoints}`);
        showScreen('card-reveal-screen');
        initCardReveal(totalPoints, selectedCategory);
    }
}

// Function to show result text and clear it after a specified duration
function showResultText(text, duration) {
  const resultText = document.createElement('p');
  resultText.style.fontSize = '20px';
  resultText.style.fontWeight = 'bold';
  resultText.style.marginTop = '10px';
  resultText.innerText = text;
  const levelContainer = document.getElementById('level-container');
  levelContainer.appendChild(resultText);
  setTimeout(() => {
    levelContainer.removeChild(resultText);
  }, duration);
}



