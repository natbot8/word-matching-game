import { updatePoints, totalPoints, updatePointsDisplay } from "./app.js";
import { wordCategories } from "./app.js";
import { showWonCard } from "./show-won-card.js";
import { StorageService } from "./storage-service.js";
import {
  animatePointsDecrement,
  showOutOfPointsMessage,
  checkSufficientPoints,
  updateCardImage,
  selectRandomCard,
  saveWonCard,
  saveProgress,
} from "./mini-game-common.js";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

let currentBubblePopCategory = "";
let currentBubblePopCard = "";
let needNewCard = true;

let isTouching = false;
let isGameEnding = false;

const gameArea = document.getElementById("bubble-pop-game-area");
const ctx = gameArea.getContext("2d");

let animationFrameId = null;
const FIXED_TIME_STEP = 1000 / 120; // 120 FPS
let accumulator = 0;
let lastTime = 0;

const BALL_SPEED = 300; // pixels per second
const NUM_OBSTACLES = 2;

const BUBBLE_SIZE = 30;
const BUBBLE_PADDING = 6;
const BUBBLE_SPACE = BUBBLE_SIZE + BUBBLE_PADDING;
const BLOCK_WIDTH = BUBBLE_SPACE * 3 - BUBBLE_PADDING;
const BLOCK_HEIGHT = BUBBLE_SIZE;
const ROWS = 7;
const COLS = 9;
const BOARD_PADDING = BUBBLE_PADDING;

const shooter = {
  x: gameArea.width / 2,
  y: gameArea.height - 30,
  angle: 0,
  size: 20,
};

let balls = [];
let bubbles = [];
let obstacles = [];
const ballRadius = 5;
let totalVisibleBubbles = 0;
let clearedBubbles = 0;

export async function initBubblePopGame(category, categoryData) {
  const currentPoints = await StorageService.getNumber("points", 0);
  console.log(
    "Initializing Bubble Pop Game with",
    currentPoints,
    "points and category:",
    category
  );
  currentBubblePopCategory = category;

  const progress = await StorageService.getItem("bubblePopProgress");

  // Set canvas size to match the inner game area
  gameArea.width = 330;
  gameArea.height = 497;

  // Recalculate shooter position
  shooter.x = gameArea.width / 2;
  shooter.y = gameArea.height - 30;

  // Reset the game state
  resetGameState();

  // Cancel any existing animation frame
  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId);
  }

  if (progress && progress.bubbles && progress.bubbles.length > 0) {
    console.log("Found saved progress:", progress);
    clearedBubbles = progress.clearedBubbles || 0;
    currentBubblePopCard = progress.currentBubblePopCard;
    needNewCard = progress.needNewCard;
    bubbles = progress.bubbles;
    obstacles = progress.obstacles || [];
    totalVisibleBubbles = progress.totalVisibleBubbles || 0;
  } else {
    console.log("No saved progress or empty bubbles. Starting new game.");
    createBubblePopBoard();
  }

  if (needNewCard) {
    currentBubblePopCard = selectRandomCard(categoryData);
    needNewCard = false;
    createBubblePopBoard();
  }

  updateProgressBar();
  updateCardImage(
    currentBubblePopCard,
    currentBubblePopCategory,
    "bubblePop",
    "bubble-pop-card-image"
  );
  updatePointsDisplay();

  // Remove any existing event listeners to prevent duplicates
  gameArea.removeEventListener("click", shootBall);
  gameArea.removeEventListener("mousemove", updateShooterAngle);
  gameArea.removeEventListener("touchstart", handleTouchStart);
  gameArea.removeEventListener("touchmove", handleTouchMove);
  gameArea.removeEventListener("touchend", handleTouchEnd);

  // Add event listeners for both mouse and touch events
  gameArea.addEventListener("click", shootBall);
  gameArea.addEventListener("mousemove", updateShooterAngle);
  gameArea.addEventListener("touchstart", handleTouchStart);
  gameArea.addEventListener("touchmove", handleTouchMove);
  gameArea.addEventListener("touchend", handleTouchEnd);

  // Add reset button
  const resetButton = document.getElementById("reset-bubble-pop");
  resetButton.removeEventListener("click", resetBubblePopGame);
  resetButton.addEventListener("click", resetBubblePopGame);

  // Start the game loop
  lastTime = performance.now();
  gameLoop();

  saveProgress("bubblePop", getGameState());
}

function getGameState() {
  return {
    clearedBubbles,
    currentBubblePopCard,
    needNewCard,
    bubbles,
    obstacles,
    totalVisibleBubbles,
  };
}

function resetGameState() {
  balls = [];
  accumulator = 0;
  lastTime = 0;
}

// Function to reset the game board and progress in case you get stuck
export async function resetBubblePopGame() {
  console.log("Resetting Bubble Pop Game");

  // Reset progress bar
  clearedBubbles = 0;
  updateProgressBar();

  // Clear the bubble pop board
  bubbles = [];
  obstacles = [];

  // Create a new bubble pop board
  createBubblePopBoard();

  // Reset game state
  resetGameState();

  // Save new progress and state to local storage
  saveProgress("bubblePop", getGameState());

  // Redraw the game
  render();
}

function updateShooterAngle(e) {
  const rect = gameArea.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  updateAngle(mouseX, mouseY);
}

function updateAngle(x, y) {
  const dx = x - shooter.x;
  const dy = y - shooter.y;
  shooter.angle = Math.atan2(dx, -dy);
}

function handleTouchStart(e) {
  e.preventDefault();
  isTouching = true;
  const touch = e.touches[0];
  const rect = gameArea.getBoundingClientRect();
  const touchX = touch.clientX - rect.left;
  const touchY = touch.clientY - rect.top;
  updateAngle(touchX, touchY);
}

function handleTouchMove(e) {
  e.preventDefault();
  if (isTouching) {
    const touch = e.touches[0];
    const rect = gameArea.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    updateAngle(touchX, touchY);
  }
}

function handleTouchEnd(e) {
  e.preventDefault();
  if (isTouching) {
    isTouching = false;
    shootBall();
  }
}

function createBubblePopBoard() {
  bubbles = [];
  obstacles = [];
  totalVisibleBubbles = 0;
  clearedBubbles = 0;

  // Create bubbles
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      bubbles.push({
        x: col * BUBBLE_SPACE + BUBBLE_SIZE / 2 + BOARD_PADDING,
        y: row * BUBBLE_SPACE + BUBBLE_SIZE / 2 + BOARD_PADDING,
        visible: true,
      });
      totalVisibleBubbles++;
    }
  }

  // Create obstacles
  const availableRows = [2, 3, 4, 5];
  for (let i = 0; i < NUM_OBSTACLES; i++) {
    const rowIndex = availableRows.splice(
      Math.floor(Math.random() * availableRows.length),
      1
    )[0];
    const maxStartCol = COLS - 3;
    const startCol = Math.floor(Math.random() * (maxStartCol + 1));

    obstacles.push({
      x: startCol * BUBBLE_SPACE + BOARD_PADDING,
      y:
        rowIndex * BUBBLE_SPACE +
        BOARD_PADDING / 2 +
        (BUBBLE_SPACE - BLOCK_HEIGHT) / 2,
      width: BLOCK_WIDTH,
      height: BLOCK_HEIGHT,
    });

    // Hide bubbles covered by the obstacle
    for (let col = startCol; col < startCol + 3; col++) {
      const bubbleIndex = rowIndex * COLS + col;
      bubbles[bubbleIndex].visible = false;
      totalVisibleBubbles--;
    }
  }
}

function updateProgressBar() {
  const progressBar = document.getElementById("bubble-pop-progress-bar");
  const percentage = (clearedBubbles / totalVisibleBubbles) * 100;
  progressBar.style.width = `${percentage}%`;
}

function drawShooter() {
  ctx.save();
  ctx.translate(shooter.x, shooter.y);
  ctx.rotate(shooter.angle);
  ctx.beginPath();
  ctx.moveTo(0, -shooter.size);
  ctx.lineTo(shooter.size / 2, shooter.size / 2);
  ctx.lineTo(-shooter.size / 2, shooter.size / 2);
  ctx.closePath();
  ctx.fillStyle = "blue";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, -shooter.size - ballRadius, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();

  ctx.restore();
}

function drawAimingLine() {
  const lineLength = 180;
  ctx.beginPath();
  ctx.moveTo(shooter.x, shooter.y);
  ctx.lineTo(
    shooter.x + Math.sin(shooter.angle) * lineLength,
    shooter.y - Math.cos(shooter.angle) * lineLength
  );
  ctx.setLineDash([5, 7]);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawBalls() {
  ctx.fillStyle = "red";
  balls.forEach((ball) => {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBubbles() {
  bubbles.forEach((bubble) => {
    if (bubble.visible) {
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, BUBBLE_SIZE / 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}

function drawObstacles() {
  ctx.fillStyle = "rgb(255, 0, 239, 0.8)";
  ctx.strokeStyle = "rgb(255, 0, 239)";
  ctx.lineWidth = 4;
  const cornerRadius = 6;

  obstacles.forEach((obstacle) => {
    ctx.beginPath();
    ctx.roundRect(
      obstacle.x,
      obstacle.y,
      obstacle.width,
      obstacle.height,
      cornerRadius
    );
    ctx.fill();
    ctx.stroke();
  });
}

async function updateBalls(deltaTime) {
  const timeStep = deltaTime / 1000; // Convert to seconds

  for (let i = balls.length - 1; i >= 0; i--) {
    const ball = balls[i];
    let newX = ball.x + ball.dx * timeStep;
    let newY = ball.y + ball.dy * timeStep;

    // Check wall collisions
    if (
      newX - ballRadius < BOARD_PADDING ||
      newX + ballRadius > gameArea.width - BOARD_PADDING
    ) {
      ball.dx = -ball.dx;
      newX = ball.x + ball.dx * timeStep;
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } catch (error) {
        console.error("Error triggering haptics:", error);
      }
    }
    if (newY - ballRadius < BOARD_PADDING) {
      ball.dy = -ball.dy;
      newY = ball.y + ball.dy * timeStep;
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } catch (error) {
        console.error("Error triggering haptics:", error);
      }
    }

    // Check obstacle collisions
    let collided = false;
    for (const obstacle of obstacles) {
      const collisionBuffer = ballRadius + 1; // Buffer zone around the obstacle
      const closestX = Math.max(
        obstacle.x - collisionBuffer,
        Math.min(newX, obstacle.x + obstacle.width + collisionBuffer)
      );
      const closestY = Math.max(
        obstacle.y - collisionBuffer,
        Math.min(newY, obstacle.y + obstacle.height + collisionBuffer)
      );

      const distanceX = newX - closestX;
      const distanceY = newY - closestY;
      const distanceSquared = distanceX * distanceX + distanceY * distanceY;

      if (distanceSquared <= ballRadius * ballRadius) {
        // Collision detected
        collided = true;

        // Determine which side of the obstacle was hit
        const overlapX = Math.abs(distanceX);
        const overlapY = Math.abs(distanceY);

        if (overlapX > overlapY) {
          // Horizontal collision
          ball.dx = -ball.dx;
          newX = closestX + (distanceX > 0 ? ballRadius : -ballRadius);
        } else {
          // Vertical collision
          ball.dy = -ball.dy;
          newY = closestY + (distanceY > 0 ? ballRadius : -ballRadius);
        }

        try {
          await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch (error) {
          console.error("Error triggering haptics:", error);
        }
        break;
      }
    }

    // Update ball position
    ball.x = newX;
    ball.y = newY;

    // Remove ball if it goes off the bottom of the screen
    if (ball.y + ballRadius > gameArea.height) {
      balls.splice(i, 1);
    }
  }
}

async function checkCollisions() {
  let bubbleCleared = false;
  for (const ball of balls) {
    for (const bubble of bubbles) {
      if (bubble.visible) {
        const dx = ball.x - bubble.x;
        const dy = ball.y - bubble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < ballRadius + BUBBLE_SIZE / 2) {
          bubble.visible = false;
          clearedBubbles++;
          bubbleCleared = true;
          updateProgressBar();

          try {
            await Haptics.impact({ style: ImpactStyle.Light });
          } catch (error) {
            console.error("Error triggering haptics:", error);
          }

          // Check if all bubbles are cleared
          if (clearedBubbles >= totalVisibleBubbles && !isGameEnding) {
            isGameEnding = true;
            revealCard();
          }
        }
      }
    }
  }

  // Only save progress if a bubble was cleared
  if (bubbleCleared && !isGameEnding) {
    saveProgress("bubblePop", getGameState());
  }
}

function shootBall() {
  if (checkSufficientPoints()) {
    const angle = shooter.angle;
    const dx = Math.sin(angle) * BALL_SPEED;
    const dy = -Math.cos(angle) * BALL_SPEED;

    balls.push({
      x: shooter.x + Math.sin(angle) * (shooter.size + ballRadius),
      y: shooter.y - Math.cos(angle) * (shooter.size + ballRadius),
      dx: dx,
      dy: dy,
    });

    updatePoints(-1); // Deduct one point for shooting
    animatePointsDecrement();
    updatePointsDisplay();
  } else {
    showOutOfPointsMessage("bubble-pop-out-of-points-message");
  }
}

async function gameLoop(currentTime) {
  if (isGameEnding) {
    return;
  }

  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;

  updateGame(deltaTime);
  render();

  animationFrameId = requestAnimationFrame(gameLoop);
}

async function updateGame(deltaTime) {
  await updateBalls(deltaTime);
  await checkCollisions();
}

function render() {
  ctx.clearRect(0, 0, gameArea.width, gameArea.height);
  drawObstacles();
  drawAimingLine();
  drawBubbles();
  drawShooter();
  drawBalls();
}

function revealCard() {
  console.log("Card revealed:", currentBubblePopCard);

  saveWonCard(currentBubblePopCard);

  // Reset progress and set flag for new card
  clearedBubbles = 0;
  needNewCard = true;
  isGameEnding = false;

  saveProgress("bubblePop", getGameState());

  // Show the won card screen
  setTimeout(() => {
    showWonCard(currentBubblePopCard, "bubblePop");
  }, 500);
}
