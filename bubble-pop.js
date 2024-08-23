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

const BUBBLE_SIZE = 40;
const BUBBLE_PADDING = 6;
const BUBBLE_SPACE = BUBBLE_SIZE + BUBBLE_PADDING;
const BLOCK_WIDTH = BUBBLE_SPACE * 3 - BUBBLE_PADDING;
const BLOCK_HEIGHT = BUBBLE_SIZE;
const ROWS = 7;
const COLS = 8;
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
  gameArea.width = 374;
  gameArea.height = 497;

  // Recalculate shooter position
  shooter.x = gameArea.width / 2;
  shooter.y = gameArea.height - 30;

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

  // Start the game loop
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
  for (let i = 0; i < 2; i++) {
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
        BOARD_PADDING +
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
  const lineLength = 200;
  ctx.beginPath();
  ctx.moveTo(shooter.x, shooter.y);
  ctx.lineTo(
    shooter.x + Math.sin(shooter.angle) * lineLength,
    shooter.y - Math.cos(shooter.angle) * lineLength
  );
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
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
      ctx.fillStyle = "green";
      ctx.fill();
      ctx.strokeStyle = "darkgreen";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}

function drawObstacles() {
  ctx.fillStyle = "gray";
  obstacles.forEach((obstacle) => {
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  });
}

function updateBalls() {
  balls.forEach((ball, index) => {
    const newX = ball.x + ball.dx;
    const newY = ball.y + ball.dy;

    // Check for collisions with walls and obstacles
    const collision = checkCollision(ball, newX, newY);

    if (collision.hit) {
      // Resolve the collision
      if (collision.normal.x !== 0) ball.dx = -ball.dx;
      if (collision.normal.y !== 0) ball.dy = -ball.dy;

      // Move the ball to the collision point
      ball.x = collision.point.x;
      ball.y = collision.point.y;
    } else {
      // No collision, update position normally
      ball.x = newX;
      ball.y = newY;
    }

    // Remove ball if it goes off the bottom of the screen
    if (ball.y + ballRadius > gameArea.height) {
      balls.splice(index, 1);
    }
  });
}

function checkCollision(ball, newX, newY) {
  const result = {
    hit: false,
    point: { x: newX, y: newY },
    normal: { x: 0, y: 0 },
  };

  // Check wall collisions
  if (newX - ballRadius < BOARD_PADDING) {
    result.hit = true;
    result.point.x = BOARD_PADDING + ballRadius;
    result.normal.x = 1;
  } else if (newX + ballRadius > gameArea.width - BOARD_PADDING) {
    result.hit = true;
    result.point.x = gameArea.width - BOARD_PADDING - ballRadius;
    result.normal.x = -1;
  }

  if (newY - ballRadius < BOARD_PADDING) {
    result.hit = true;
    result.point.y = BOARD_PADDING + ballRadius;
    result.normal.y = 1;
  }

  // Check obstacle collisions
  obstacles.forEach((obstacle) => {
    const nearestX = Math.max(
      obstacle.x,
      Math.min(newX, obstacle.x + obstacle.width)
    );
    const nearestY = Math.max(
      obstacle.y,
      Math.min(newY, obstacle.y + obstacle.height)
    );
    const dist = Math.sqrt((newX - nearestX) ** 2 + (newY - nearestY) ** 2);

    if (dist < ballRadius) {
      result.hit = true;
      const angle = Math.atan2(newY - nearestY, newX - nearestX);
      result.point.x = nearestX + Math.cos(angle) * ballRadius;
      result.point.y = nearestY + Math.sin(angle) * ballRadius;
      result.normal.x = (newX - nearestX) / dist;
      result.normal.y = (newY - nearestY) / dist;
    }
  });

  return result;
}

function checkCollisions() {
  let bubbleCleared = false;
  balls.forEach((ball) => {
    bubbles.forEach((bubble, bubbleIndex) => {
      if (bubble.visible) {
        const dx = ball.x - bubble.x;
        const dy = ball.y - bubble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < ballRadius + BUBBLE_SIZE / 2) {
          bubble.visible = false;
          clearedBubbles++;
          bubbleCleared = true;
          updateProgressBar();

          // Check if all bubbles are cleared
          if (clearedBubbles >= totalVisibleBubbles && !isGameEnding) {
            isGameEnding = true;
            revealCard();
          }
        }
      }
    });
  });

  // Remove balls that are off-screen
  balls = balls.filter(
    (ball) => ball.y + ballRadius > 0 && ball.y - ballRadius < gameArea.height
  );

  // Only save progress if a bubble was cleared
  if (bubbleCleared && !isGameEnding) {
    saveProgress("bubblePop", getGameState());
  }
}

function shootBall() {
  if (checkSufficientPoints()) {
    const speed = 10;
    const dx = Math.sin(shooter.angle) * speed;
    const dy = -Math.cos(shooter.angle) * speed;

    balls.push({
      x: shooter.x + Math.sin(shooter.angle) * (shooter.size + ballRadius),
      y: shooter.y - Math.cos(shooter.angle) * (shooter.size + ballRadius),
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

function gameLoop() {
  if (!isGameEnding) {
    ctx.clearRect(0, 0, gameArea.width, gameArea.height);

    drawObstacles();
    drawAimingLine();
    drawBubbles();
    drawShooter();
    drawBalls();
    updateBalls();
    checkCollisions();
  }

  requestAnimationFrame(gameLoop);
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
