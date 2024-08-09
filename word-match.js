import { showScreen } from "./app.js";
import { initCardReveal } from "./card-reveal.js";
import { initPlinkoGame } from "./plinko.js";
import { updatePoints, totalPoints, updatePointsDisplay } from "./app.js";
import { wordCategories, fetchWordCategories } from "./app.js";
import {
  animatePointsDecrement,
  animatePointsIncrement,
} from "./mini-game-common.js";
import { StorageService } from "./storage-service.js";
import { showConfettiCannon } from "./confetti.js";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

let words = {};
export const levels = [];
export let letterSounds = {};
export const WORDS_PER_ROUND = 10;
export let gamePoints = 0;
export let numImages = 2;
export let currentLevel = 0;
export let isProcessing = false;
export let selectedCategory = "Simple Words";
export let selectedDifficulty = "Hard";

const correctSounds = [
  new Audio("game-sounds/nice.m4a"),
  new Audio("game-sounds/oo-nice.m4a"),
  new Audio("game-sounds/good-job.m4a"),
  new Audio("game-sounds/great.m4a"),
];

const incorrectSounds = [
  new Audio("game-sounds/try-again.m4a"),
  new Audio("game-sounds/oops.m4a"),
];

// Fetch letter sounds from JSON file
async function fetchLetterSounds() {
  try {
    const response = await fetch("letter-sounds.json");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching letter sounds:", error);
    return null;
  }
}

// Function to start the game based on the selected difficulty
export async function initializeGame() {
  selectedCategory = await StorageService.getItem("selectedCategory");
  selectedDifficulty = await StorageService.getItem("selectedDifficulty");

  console.log("Selected Category:", selectedCategory);
  console.log("Selected Difficulty:", selectedDifficulty);

  if (!selectedCategory || !selectedDifficulty) {
    console.error("Category or difficulty not selected");
    return;
  }

  // Load total points from localStorage (handled in app.js)
  updateTotalPointsDisplay();

  // Pre-load audio
  preloadAudio();

  // Fetch word categories
  try {
    words = await fetchWordCategories();
    if (!words) {
      throw new Error("Failed to fetch word categories");
    }
    console.log("Fetched word categories:", words);

    // Load letter sounds
    letterSounds = await fetchLetterSounds();
    if (!letterSounds) {
      throw new Error("Failed to fetch letter sounds");
    }
    console.log("Fetched letter sounds:", letterSounds);
  } catch (error) {
    console.error("Error loading data:", error);
    return;
  }

  // Set the difficulty based on the selected value
  if (selectedDifficulty === "easy") {
    numImages = 2;
  } else if (selectedDifficulty === "hard") {
    numImages = 4;
  } else if (selectedDifficulty === "superhard") {
    numImages = 6;
  } else if (selectedDifficulty === "superduperhard") {
    numImages = 8;
  }

  // Shuffle words and create levels
  const categoryWords = words[selectedCategory].words;
  if (!Array.isArray(categoryWords) || categoryWords.length === 0) {
    console.error("No words found for the selected category");
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
  gamePoints = 0;

  // Start the game with the selected difficulty
  loadLevel();

  // Make sure the game container is visible
  document.getElementById("level-container").style.display = "block";
}

// Load the level
export function loadLevel() {
  const currentLevelData = levels[currentLevel];
  const levelContainer = document.getElementById("level-container");
  const letterContainer = document.getElementById("letter-container");
  levelContainer.innerHTML = "";
  letterContainer.innerHTML = "";

  resetDisabledImages();

  const confettiGameContainer = document.createElement("div");
  confettiGameContainer.id = "confetti-container";
  levelContainer.appendChild(confettiGameContainer);

  const imageContainer = document.createElement("div");
  imageContainer.id = "image-container";
  levelContainer.appendChild(imageContainer);

  const word = currentLevelData.word.toLowerCase();
  const soundUnits = getSoundUnits(word);
  const disabledUnits = getDisabledSoundUnits(soundUnits);

  soundUnits.forEach((soundUnit, index) => {
    const letterButton = document.createElement("button");
    letterButton.innerText = soundUnit.toUpperCase();
    letterButton.className = "letter-button";

    if (disabledUnits.includes(index)) {
      letterButton.classList.add("disabled");
    } else {
      letterButton.onclick = () => playLetterSound(soundUnit);
    }

    letterContainer.appendChild(letterButton);
  });

  // Adjust letter container alignment
  if (letterContainer.scrollWidth > letterContainer.clientWidth) {
    letterContainer.style.justifyContent = "flex-start";
    letterContainer.style.paddingLeft = "20px";
  } else {
    letterContainer.style.justifyContent = "center";
  }

  updateFadeEffect();
  letterContainer.addEventListener("scroll", updateFadeEffect);

  // Populate image options
  const images = [...getRandomImages(currentLevelData)];
  const shuffledImages = shuffleArray(images);

  for (const imgSrc of shuffledImages) {
    const imgElement = document.createElement("img");
    imgElement.src = imgSrc;
    imgElement.alt = "Word Image";
    imgElement.classList.add("image-option");
    imgElement.onclick = () => checkImage(imgElement, currentLevelData);
    imageContainer.appendChild(imgElement);
  }
}

// Functions get sound units for a word
function getSoundUnits(word) {
  const soundUnits = [];
  let i = 0;
  while (i < word.length) {
    let soundUnit = word[i];
    let j = i + 1;

    if (letterSounds && letterSounds.letterCombinations) {
      for (let combo of Object.keys(letterSounds.letterCombinations)) {
        if (word.slice(i).startsWith(combo)) {
          soundUnit = combo;
          j = i + combo.length;
          break;
        }
      }
    }

    soundUnits.push(soundUnit);
    i = j;
  }
  return soundUnits;
}

// Function to set disabled sound units (for certain difficulty levels)
function getDisabledSoundUnits(soundUnits) {
  const totalUnits = soundUnits.length;
  let disabledUnits = [];

  if (selectedDifficulty === "superhard") {
    const numDisabled = totalUnits < 5 ? 1 : 2;
    while (disabledUnits.length < numDisabled) {
      const randomIndex = Math.floor(Math.random() * totalUnits);
      if (!disabledUnits.includes(randomIndex)) {
        disabledUnits.push(randomIndex);
      }
    }
  } else if (selectedDifficulty === "superduperhard") {
    const numEnabled = totalUnits < 5 ? 1 : 2;
    const numDisabled = totalUnits - numEnabled;

    // Create an array of all indices
    const allIndices = Array.from({ length: totalUnits }, (_, i) => i);

    // Randomly select indices to disable
    for (let i = 0; i < numDisabled; i++) {
      const randomIndex = Math.floor(Math.random() * allIndices.length);
      disabledUnits.push(allIndices[randomIndex]);
      allIndices.splice(randomIndex, 1);
    }
  }

  return disabledUnits;
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

  if (
    letterSounds.letterCombinations &&
    letterSounds.letterCombinations[soundUnit]
  ) {
    soundFile = letterSounds.letterCombinations[soundUnit];
  } else if (
    letterSounds.singleLetters &&
    letterSounds.singleLetters[soundUnit]
  ) {
    soundFile = letterSounds.singleLetters[soundUnit];
  } else {
    console.warn(`No sound file found for: ${soundUnit}`);
    return;
  }

  const audio = new Audio(`./letter-sounds/${soundFile}`);
  audio.play().catch((error) => console.error("Error playing audio:", error));
}

function getRandomImages(currentLevelData) {
  if (
    !words ||
    !words[selectedCategory] ||
    !Array.isArray(words[selectedCategory].words)
  ) {
    console.error("Invalid word data structure");
    return [];
  }

  const randomImages = [];
  const categoryWords = words[selectedCategory].words;
  const wordIndex = categoryWords.findIndex(
    (word) =>
      word.trim().toLowerCase() === currentLevelData.word.toLowerCase().trim()
  );

  if (wordIndex === -1) {
    console.error("Current word not found in category words");
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

export async function checkImage(imgElement, currentLevelData) {
  if (isProcessing || imgElement.classList.contains("disabled")) {
    return;
  }

  isProcessing = true;

  const wordDisplay = currentLevelData.word.toLowerCase();
  const currentImageSrc = imgElement.src.toLowerCase();
  const currentWord = decodeURIComponent(
    currentImageSrc.substring(
      currentImageSrc.lastIndexOf("/") + 1,
      currentImageSrc.lastIndexOf(".")
    )
  );

  // Trigger haptic feedback
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (error) {
    console.error("Error triggering haptics:", error);
  }

  if (currentWord === wordDisplay) {
    updateGamePoints(true); // Pass true for correct answer
    playRandomSound(correctSounds);

    // Show confetti animation
    showConfettiCannon();

    setTimeout(() => {
      nextLevel();
      isProcessing = false;
    }, 1000);
  } else {
    updateGamePoints(false);
    playRandomSound(incorrectSounds);
    imgElement.classList.add("disabled");
    isProcessing = false;
  }
}

function updateGamePoints(correctAnswer) {
  if (correctAnswer) {
    gamePoints++;
    updatePoints(1); // Update total points in app.js
    animatePointsIncrement();
  } else {
    if (gamePoints > 0) {
      gamePoints--;
      updatePoints(-1); // Update total points in app.js
      animatePointsDecrement();
    }
  }
  console.log("Current Game Points:", gamePoints);
  updateCoinIcons();
}

function updateCoinIcons() {
  const coinContainer = document.getElementById("coin-container");
  coinContainer.innerHTML = ""; // Clear existing coins

  for (let i = 0; i < gamePoints; i++) {
    const coinIcon = document.createElement("img");
    coinIcon.src = "icons/coin.png";
    coinIcon.alt = "Coin";
    coinIcon.classList.add("coin-icon");
    coinContainer.appendChild(coinIcon);
  }
}

function updateTotalPointsDisplay() {
  const totalPointsDisplay = document.getElementById("total-points-value");
  if (totalPointsDisplay) {
    totalPointsDisplay.textContent = totalPoints;
  }
}

export function nextLevel() {
  currentLevel++;
  if (currentLevel < WORDS_PER_ROUND) {
    loadLevel();
  } else {
    showResultsScreen();
  }
}

// Function to show results screen after completing round of word game
function showResultsScreen() {
  const resultsMessage = document.getElementById("results-message");
  resultsMessage.textContent = `You earned ${gamePoints} points!`;

  const homeButton = document.getElementById("home-button");
  const cardRevealButton = document.getElementById("card-reveal-button");
  const plinkoButton = document.getElementById("plinko-button");

  homeButton.onclick = () => {
    showScreen("home-screen");
    updatePointsDisplay();
  };

  cardRevealButton.onclick = () => {
    showScreen("card-reveal-screen");
    initCardReveal(selectedCategory, wordCategories[selectedCategory]);
  };

  plinkoButton.onclick = () => {
    showScreen("plinko-screen");
    initPlinkoGame(selectedCategory, wordCategories[selectedCategory]);
  };

  showScreen("results-screen");
}

// Function to play random sound file
function playRandomSound(soundArray) {
  const randomIndex = Math.floor(Math.random() * soundArray.length);
  const sound = soundArray[randomIndex];
  sound.currentTime = 0; // Reset to start of the audio
  sound.play().catch((error) => console.error("Error playing audio:", error));
}

// Reset disabled images when next level loads
function resetDisabledImages() {
  const disabledImages = document.querySelectorAll(".image-option.disabled");
  disabledImages.forEach((img) => img.classList.remove("disabled"));
}

function preloadAudio() {
  [...correctSounds, ...incorrectSounds].forEach((sound) => {
    sound.load();
  });
}

// Add this function to check and update the fade effect
function updateFadeEffect() {
  const letterContainer = document.getElementById("letter-container");
  const firstLetterButton = letterContainer.querySelector(".letter-button");
  const rect = firstLetterButton.getBoundingClientRect();
  let fadeElement = document.querySelector(".letter-fade");

  if (!fadeElement) {
    const fade = document.createElement("div");
    fade.className = "letter-fade";
    letterContainer.appendChild(fade);
    fadeElement = fade;
  }

  // Update position of the fade element to match the letter container
  fadeElement.style.top = `${rect.top}px`;
  fadeElement.style.height = `${rect.height}px`;

  // Check if scrolling is possible
  if (letterContainer.scrollWidth > letterContainer.clientWidth) {
    // Calculate the maximum scroll position
    const maxScroll = letterContainer.scrollWidth - letterContainer.clientWidth;

    // Show fade if not scrolled all the way to the right
    if (Math.ceil(letterContainer.scrollLeft) < maxScroll) {
      fadeElement.style.opacity = "1";
    } else {
      fadeElement.style.opacity = "0";
    }
  } else {
    // Hide fade if no scrolling is needed
    fadeElement.style.opacity = "0";
  }
}
