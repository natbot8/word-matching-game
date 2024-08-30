import { updatePointsDisplay, totalPoints } from "./app.js";
import { wordCategories, fetchWordCategories } from "./app.js";
import { StorageService } from "./storage-service.js";
import { audioService } from "./audio-service.js";

let difficultyAudio = null;
let touchStartX = 0;
let touchStartY = 0;

export async function initHomeScreen() {
  try {
    if (Object.keys(wordCategories).length === 0) {
      await fetchWordCategories();
    }
    await createCategoryTiles();
    setupDifficultySelector();
    updatePointsDisplay();
  } catch (error) {
    console.error("Error initializing home screen:", error);
  }
}

export async function createCategoryTiles() {
  const container = document.getElementById("category-container");
  container.innerHTML = ""; // Clear existing tiles

  let wonCards = await StorageService.getItem("wonCards");

  // Initialize wonCards as an empty array if it doesn't exist
  if (!wonCards) {
    wonCards = [];
  }

  for (const [category, data] of Object.entries(wordCategories)) {
    const tile = document.createElement("div");
    tile.className = "category-tile";

    const cardsContainer = document.createElement("div");
    cardsContainer.className = "category-cards";

    // Add touch event listeners to the cardsContainer
    cardsContainer.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    cardsContainer.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    cardsContainer.addEventListener("touchend", handleTouchEnd, {
      passive: false,
    });
    cardsContainer.addEventListener("touchcancel", handleTouchEnd, {
      passive: false,
    });

    data.cards.slice(0, 10).forEach((card) => {
      const cardWrapper = document.createElement("div");
      cardWrapper.className = "card-wrapper";

      const img = document.createElement("img");
      img.src = `card-images/${card}`;
      img.alt = "Card";
      img.draggable = false; // Disable dragging

      const overlay = document.createElement("div");
      overlay.className = "card-overlay";

      cardWrapper.appendChild(img);
      cardWrapper.appendChild(overlay);

      if (wonCards.includes(card)) {
        cardWrapper.classList.add("won-card");
      } else {
        cardWrapper.classList.add("not-won-card");
      }

      cardsContainer.appendChild(cardWrapper);
    });

    const title = document.createElement("h3");
    title.className = "category-title";
    title.textContent = category;

    const playButton = document.createElement("button");
    playButton.className = "play-button";
    playButton.textContent = "Play";
    playButton.onclick = () => startGame(category);

    tile.appendChild(cardsContainer);
    tile.appendChild(title);
    tile.appendChild(playButton);
    container.appendChild(tile);
  }
}

// Set up difficulty selector
export async function setupDifficultySelector() {
  const difficultyDropdown = document.getElementById("difficulty-dropdown");
  difficultyDropdown.style.display = "none";

  // Remove any existing event listeners
  difficultyDropdown.removeEventListener("change", handleDifficultyChange);

  // Add the event listener
  difficultyDropdown.addEventListener("change", handleDifficultyChange);

  // Load the saved difficulty from storage
  const savedDifficulty = await StorageService.getItem("selectedDifficulty");

  // If a difficulty was saved, set it as the selected option
  if (savedDifficulty) {
    difficultyDropdown.value = savedDifficulty;
  } else {
    // If no difficulty was saved, set it to "hard" (default) and save it
    difficultyDropdown.value = "hard";
    await StorageService.setItem("selectedDifficulty", "hard");
  }

  difficultyDropdown.style.display = "";
}

async function handleDifficultyChange(event) {
  const difficulty = event.target.value;
  await StorageService.setItem("selectedDifficulty", difficulty);
  audioService.playDifficultyAudio(difficulty);
}

function handleTouchStart(event) {
  event.preventDefault(); // Prevent default touch behavior
  const touch = event.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  updateTouchedCards(event);
}

function handleTouchMove(event) {
  event.preventDefault(); // Prevent default touch behavior
  updateTouchedCards(event);
}

function handleTouchEnd(event) {
  event.preventDefault(); // Prevent default touch behavior
  const cardsContainer = event.currentTarget;
  const cardWrappers = cardsContainer.querySelectorAll(".card-wrapper");
  cardWrappers.forEach((card) => card.classList.remove("touch-active"));
}

function updateTouchedCards(event) {
  const touch = event.touches[0];
  const cardsContainer = event.currentTarget;
  const cardWrappers = cardsContainer.querySelectorAll(".card-wrapper");

  cardWrappers.forEach((card) => {
    const rect = card.getBoundingClientRect();
    if (
      touch.clientX >= rect.left &&
      touch.clientX <= rect.right &&
      touch.clientY >= rect.top &&
      touch.clientY <= rect.bottom
    ) {
      card.classList.add("touch-active");
    } else {
      card.classList.remove("touch-active");
    }
  });
}
