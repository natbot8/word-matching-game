// Import functionality from other JS files
import * as HomeScreen from "./home-screen.js";
import * as Game from "./word-match.js";
import * as CardReveal from "./card-reveal.js";
import * as PlinkoGame from "./plinko.js";
import * as BubblePopGame from "./bubble-pop.js";
import * as ShowWonCard from "./show-won-card.js";
import { StorageService, migrateStorage } from "./storage-service.js";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { SplashScreen } from "@capacitor/splash-screen";
import { audioService } from "./audio-service.js";
import { initSettingsScreen, showSettingsScreen } from "./settings.js";

// Global state
let currentScreen = "home";
export let totalPoints = 0;
export let wordCategories = {};

// Function to switch between screens
export async function showScreen(screenId) {
  // Log the screen we're switching to
  console.log("Switching to screen:", screenId);

  // Update totalPoints from localStorage before switching screens
  totalPoints = await StorageService.getNumber("points", 0);

  document.getElementById("home-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "none";
  document.getElementById("results-screen").style.display = "none";
  document.getElementById("card-reveal-screen").style.display = "none";
  document.getElementById("plinko-screen").style.display = "none";
  document.getElementById("bubble-pop-screen").style.display = "none";
  document.getElementById("show-won-card-screen").style.display = "none";
  document.getElementById("settings-screen").style.display = "none";

  // Show the selected screen
  document.getElementById(screenId).style.display = [
    "results-screen",
    "plinko-screen",
    "bubble-pop-screen",
    "show-won-card-screen",
    "settings-screen",
  ].includes(screenId)
    ? "flex"
    : "block";

  currentScreen = screenId.replace("-screen", "");
  updateNavHighlight(screenId);

  // Update points display when switching screens
  updatePointsDisplay();

  // Cleanup functions
  ShowWonCard.resetWonCardScreen();

  // Additional logic for specific screens
  if (screenId === "home-screen") {
    console.log("Updating points display for home screen");
    HomeScreen.initHomeScreen();
  } else if (screenId === "plinko-screen") {
    const savedCategory = await StorageService.getItem("selectedCategory");
    if (savedCategory && wordCategories[savedCategory]) {
      PlinkoGame.initPlinkoGame(savedCategory, wordCategories[savedCategory]);
    } else {
      console.log("No saved category or invalid category for Plinko game");
      PlinkoGame.initPlinkoGame("Simple Words", wordCategories["Simple Words"]);
    }
  } else if (screenId === "bubble-pop-screen") {
    const savedCategory = await StorageService.getItem("selectedCategory");
    if (savedCategory && wordCategories[savedCategory]) {
      BubblePopGame.initBubblePopGame(
        savedCategory,
        wordCategories[savedCategory]
      );
    } else {
      console.log("No saved category or invalid category for Bubble Pop game");
      BubblePopGame.initBubblePopGame(
        "Simple Words",
        wordCategories["Simple Words"]
      );
    }
  } else if (screenId === "card-reveal-screen") {
    const savedCategory = await StorageService.getItem("selectedCategory");
    if (savedCategory && wordCategories[savedCategory]) {
      CardReveal.initCardReveal(savedCategory, wordCategories[savedCategory]);
    } else {
      console.log("No saved category or invalid category for Card Reveal game");
      CardReveal.initCardReveal("Simple Words", wordCategories["Simple Words"]);
    }
  } else if (screenId === "show-won-card-screen") {
    // No initialization needed for this screen
    // The showWonCard function will handle the display
  }
}

// Fetch word categories
export async function fetchWordCategories() {
  try {
    const response = await fetch("word-categories.json");
    wordCategories = await response.json();
    return wordCategories;
  } catch (error) {
    console.error("Error fetching word categories:", error);
    return null;
  }
}

function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const screenId = item.dataset.screen;
      console.log("Navigation clicked:", screenId);
      showScreen(screenId);
    });
  });
}

//StartGame function
async function startGame(category) {
  const difficulty = document.getElementById("difficulty-dropdown").value;
  console.log(
    `Starting game with category: ${category}, difficulty: ${difficulty}`
  );

  // Play start game audio
  audioService.playGameStartAudio();

  // Set game parameters
  await StorageService.setItem("selectedCategory", category);
  await StorageService.setItem("selectedDifficulty", difficulty);

  // Switch to game screen and initialize game
  showScreen("game-screen");
  Game.initializeGame();
}

// Styling for navigation screen
function updateNavHighlight(screenId) {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    if (item.dataset.screen === screenId) {
      item.classList.add("selected");
    } else {
      item.classList.remove("selected");
    }
  });
}

// Function to load points from localStorage
async function loadPoints() {
  totalPoints = await StorageService.getNumber("points", 0);
}

// Function to update points
export async function updatePoints(change) {
  console.log("Updating points. Current:", totalPoints, "Change:", change);
  totalPoints += change;
  await StorageService.setItem("points", totalPoints);
  console.log("New total points:", totalPoints);
  updatePointsDisplay();
}

// Function to update points display on all screens
export function updatePointsDisplay() {
  console.log("Updating points display. Current total points:", totalPoints);
  const pointsDisplays = document.querySelectorAll(".points-display span");
  pointsDisplays.forEach((display) => {
    // Only update the text content if it's different
    if (display.textContent !== totalPoints.toString()) {
      display.textContent = totalPoints;
    }
  });
}

async function initializePoints() {
  totalPoints = await StorageService.getNumber("points", 0);
  console.log("Initialized total points:", totalPoints);
  updatePointsDisplay();
}

function setupSettingsIcon() {
  const settingsIcon = document.querySelector(".settings-display");
  settingsIcon.onclick = () => showSettingsScreen();
}

function disableImageContextMenu() {
  document.body.addEventListener(
    "contextmenu",
    function (e) {
      if (e.target.tagName === "IMG") {
        e.preventDefault();
        return false;
      }
    },
    { passive: false }
  );
}

// Function to initialize the app
async function initializeApp() {
  try {
    await migrateStorage();
    await fetchWordCategories();
    await loadPoints();
    await audioService.initialize();
    await HomeScreen.initHomeScreen();
    await initializePoints();
    initNavigation();
    disableImageContextMenu();
    setupSettingsIcon();
    initSettingsScreen();

    // Hide the splash screen
    await SplashScreen.hide();

    console.log("App initialized successfully");
  } catch (error) {
    console.error("Failed to initialize app:", error);
    // Hide the splash screen even if there's an error
    await SplashScreen.hide();
  }
}

// Event listeners
document.addEventListener("DOMContentLoaded", async () => {
  // Initialize Capacitor
  console.log("Capacitor version:", Capacitor.getPlatform());
  console.log("Preferences:", Preferences);

  // Show the splash screen
  await SplashScreen.show({
    showDuration: 2000,
    autoHide: false,
  });

  // Initialize the app
  await initializeApp();
});

// Expose necessary functions to global scope
window.startGame = startGame;
window.revealBlock = function (block, index) {
  CardReveal.revealBlock(block, index);
};
window.playLetterSound = function (soundUnit) {
  Game.playLetterSound(soundUnit);
};
window.checkImage = function (imgElement, currentLevelData) {
  Game.checkImage(imgElement, currentLevelData);
};
