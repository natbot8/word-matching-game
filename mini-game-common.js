import { totalPoints } from "./app.js";
import { StorageService } from "./storage-service.js";

const noPointsSound = new Audio("game-sounds/need-points.m4a");

export function animatePointsDecrement() {
  const pointsDisplays = document.querySelectorAll(".points-display span");
  if (pointsDisplays.length > 0) {
    pointsDisplays.forEach((pointsDisplay) => {
      pointsDisplay.classList.add("decrement");
      setTimeout(() => {
        pointsDisplay.classList.remove("decrement");
      }, 500); // Match this to the animation duration in CSS
    });
  } else {
    console.error(`Points display not found`);
  }
}

export function showOutOfPointsMessage(messageElementId) {
  const message = document.getElementById(messageElementId);
  if (message) {
    message.classList.add("show");
    setTimeout(() => {
      message.classList.remove("show");
    }, 1500);
    playNoPointsSound();
  } else {
    console.error(`Message element with id '${messageElementId}' not found`);
  }
}

export function checkSufficientPoints() {
  return totalPoints > 0;
}

export function updateCardImage(card, category, gameType, imageId) {
  const cardImage = document.getElementById(imageId);

  if (!cardImage) {
    console.error(`Card image element with id '${imageId}' not found.`);
    return;
  }

  if (!card) {
    console.error("No card selected. Unable to update card image.");
    return;
  }

  const imagePath = `card-images/${card}`;
  console.log(`Setting ${gameType} card image src to:`, imagePath);
  cardImage.src = imagePath;
  cardImage.alt = `Card from ${category}`;

  cardImage.onload = () => {
    console.log("Image loaded successfully");
  };

  cardImage.onerror = () => {
    console.error("Failed to load image:", imagePath);
    cardImage.src = "path/to/default-or-error-image.png";
    cardImage.alt = "Error loading card image";
  };
}

export function selectRandomCard(categoryData) {
  try {
    console.log("Selecting random card from category data:", categoryData);
    if (
      !categoryData ||
      !categoryData.cards ||
      categoryData.cards.length === 0
    ) {
      console.error("Invalid category data or no cards available");
      return null;
    }
    const cards = categoryData.cards;
    console.log("Available cards:", cards);
    const selectedCard = cards[Math.floor(Math.random() * cards.length)];
    console.log("Selected card:", selectedCard);
    return selectedCard;
  } catch (error) {
    console.error("Error selecting random card:", error);
    return null;
  }
}

export async function saveWonCard(currentCard) {
  let wonCards = await StorageService.getItem("wonCards");

  // Initialize wonCards as an empty array if it doesn't exist
  if (!wonCards) {
    wonCards = [];
  }

  if (!wonCards.includes(currentCard)) {
    wonCards.push(currentCard);
    await StorageService.setItem("wonCards", wonCards);
  }
}

export async function saveProgress(gameType, progressData) {
  await StorageService.setItem(`${gameType}Progress`, progressData);
  console.log(`${gameType} progress saved:`, progressData);
}

function playNoPointsSound() {
  noPointsSound.currentTime = 0; // Reset to start of the audio
  noPointsSound
    .play()
    .catch((error) => console.error("Error playing audio:", error));
}
