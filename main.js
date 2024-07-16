let words = {};
const levels = [];
let letterSounds = {};
const WORDS_PER_ROUND = 10;
let points = 0; 
let savedPoints = 0;
let numImages = 2;
let currentLevel = 0;
let isProcessing = false;
let selectedCategory = 'Simple Words';
let selectedDifficulty = '';

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

// Function to start the game based on the selected difficulty
async function initializeGame() {
    const selectedCategory = localStorage.getItem('selectedCategory');
    const selectedDifficulty = localStorage.getItem('selectedDifficulty');

    if (!selectedCategory || !selectedDifficulty) {
        console.error('Category or difficulty not selected');
        return;
    }

    // Fetch word categories
    try {
        words = await fetchWordCategories();
        if (!words) {
            throw new Error('Failed to fetch word categories');
        }
    } catch (error) {
        console.error('Error loading word categories:', error);
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
    shuffleArray(categoryWords);
    levels.length = 0; // Clear previous levels
    for (let i = 0; i < WORDS_PER_ROUND; i++) {
        const word = categoryWords[i];
        const level = {
            word: word.toUpperCase(),
            image: `./images/${word}.jpg`,
        };
        levels.push(level);
    }

    // Reset currentLevel
    currentLevel = 0;

    // Start the game with the selected difficulty
    loadLevel();

    // Make sure the game container is visible
    document.getElementById('level-container').style.display = 'block';
}

// Load the initial level
function loadLevel() {
  const currentLevelData = levels[currentLevel];
  const letterContainer = document.getElementById('letter-container');
  letterContainer.innerHTML = ''; // Clear previous letters

  const confettiContainer = document.getElementById('confetti-container');

  const word = currentLevelData.word.toLowerCase();
  let i = 0;
  while (i < word.length) {
    let soundUnit = word[i];
    let j = i + 1;

    // Check for letter combinations
    if (letterSounds && letterSounds.letterCombinations) {
      while (j < word.length) {
        const potentialCombination = word.slice(i, j + 1);
        if (letterSounds.letterCombinations[potentialCombination]) {
          soundUnit = potentialCombination;
          j++;
        } else {
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

  if (letterContainer.scrollWidth > letterContainer.clientWidth) {
    letterContainer.style.justifyContent = 'flex-start'; // Left align when overflow
  } else {
    letterContainer.style.justifyContent = 'center'; // Center align when no overflow
  }

  const imageContainer = document.getElementById('image-container');
  imageContainer.innerHTML = ''; // Clear previous images

  const images = [...getRandomImages(currentLevelData)];

  // Randomize the order of the images
  const shuffledImages = shuffleArray(images);

  // Create image elements and add them to the container
  for (const imgSrc of shuffledImages) {
    const imgElement = document.createElement('img');
    imgElement.src = imgSrc;
    imgElement.alt = 'Word Image';
    imgElement.classList.add('image-option'); // Use 'image-option' class
    imgElement.onclick = () => checkImage(imgElement, currentLevelData);
    imageContainer.appendChild(imgElement);
  }

  // Get points and red-balls containers
  const pointsContainer = document.getElementById('points-container');
  const pointsElement = document.getElementById('points');
  const redBallsContainer = document.getElementById('red-balls');

  // Append points and red-balls elements within points-container
  pointsContainer.innerHTML = ''; // Clear previous points elements
  pointsContainer.appendChild(pointsElement);
  pointsContainer.appendChild(redBallsContainer);

  // Append containers to the level-container
  const levelContainer = document.getElementById('level-container');
  levelContainer.innerHTML = ''; // Clear previous elements
  levelContainer.appendChild(confettiContainer);
  levelContainer.appendChild(pointsContainer);
  levelContainer.appendChild(letterContainer);
  levelContainer.appendChild(imageContainer);
}

// Load saved points
function loadSavedPoints() {
  const savedPointsData = localStorage.getItem('savedPoints');
  if (savedPointsData) {
    savedPoints = parseInt(savedPointsData, 10);
  } else {
    savedPoints = 0;
  }
  updateSavedPointsDisplay();
}

// Update the saved points display
function updateSavedPointsDisplay() {
  const savedPointsElement = document.getElementById('saved-points');
  if (savedPointsElement) {
    savedPointsElement.textContent = `Saved Points: ${savedPoints}`;
  }
}

// Shuffle array function
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function playLetterSound(soundUnit) {
  // get sound files from https://www.readnaturally.com/article/audio-examples-of-phonics-sounds
  let soundFile;
  if (letterSounds.letterCombinations && letterSounds.letterCombinations[soundUnit]) {
    soundFile = letterSounds.letterCombinations[soundUnit];
  } else if (letterSounds.singleLetters && letterSounds.singleLetters[soundUnit]) {
    soundFile = letterSounds.singleLetters[soundUnit];
  } else {
    console.warn(`No sound file found for: ${soundUnit}`);
    return;
  }

  const audio = new Audio(`./letter-sounds/${soundFile}`);
  audio.play();
}

function getRandomImages(currentLevelData) {
  const randomImages = [];
  const categoryWords = words[selectedCategory].words;
  const wordIndex = categoryWords.findIndex(word => word.trim().toLowerCase() === currentLevelData.word.toLowerCase().trim());

  // Get the word's image
  randomImages.push(currentLevelData.image);

  // Remove the word from the category words array temporarily to prevent repetition
  const tempWords = categoryWords.slice(0); // Copy the words array
  tempWords.splice(wordIndex, 1); // Remove the word

  // Shuffle the tempWords array
  const shuffledWords = shuffleArray(tempWords);

  // Get unique random images from the shuffled words array
  while (randomImages.length < numImages) {
    const randomWord = shuffledWords.pop();
    if (randomWord) {
      const randomImage = `./images/${encodeURIComponent(randomWord)}.jpg`;
      if (!randomImages.includes(randomImage)) {
        randomImages.push(randomImage);
      }
    } else {
      break; // No more unique words available
    }
  }

  return randomImages;
}

function checkImage(imgElement, currentLevelData) {
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
  console.log('Points:', points); // Debugging point
  updateRedBalls();
  document.getElementById('points-value').innerText = points;
}

function updateRedBalls() {
  const redBallsContainer = document.getElementById('red-balls');

  redBallsContainer.innerHTML = ''; // Clear existing red balls

  for (let i = 0; i < points; i++) {
    const redBall = document.createElement('div');
    redBall.classList.add('red-ball');
    redBallsContainer.appendChild(redBall);
  }
}

function nextLevel() {
  currentLevel++;
  if (currentLevel < WORDS_PER_ROUND) {
    loadLevel();
  } else {
    const totalPoints = points + savedPoints;
    alert(`Congratulations! You completed all ${WORDS_PER_ROUND} words. Your total points for the Card Reveal game: ${totalPoints}`);
    startCardRevealGame(totalPoints);
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

// Start card reveal game
function startCardRevealGame(totalPoints) {
  // Load any existing progress before initializing
  const progress = JSON.parse(localStorage.getItem('cardRevealProgress'));
  if (progress) {
    initCardReveal(totalPoints + progress.pointsLeft, selectedCategory);
  } else {
    initCardReveal(totalPoints, selectedCategory);
  }
}

// Call startGame when the game page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeGame().catch(error => {
        console.error('Error initializing the game:', error);
        // You might want to display an error message to the user here
    });
});



