import { updatePoints, totalPoints, updatePointsDisplay } from './app.js';
import { wordCategories } from './app.js';
import { showWonCard } from './show-won-card.js';
import { 
    animatePointsDecrement, 
    showOutOfPointsMessage, 
    checkSufficientPoints, 
    updateCardImage, 
    selectRandomCard, 
    saveWonCard, 
    saveProgress 
} from './mini-game-common.js';

let progressBarFill = 0;
let currentPlinkoCategory = '';
let currentPlinkoCard = '';
let needNewCard = true;
const totalProgressNeeded = 25;
let isAnimating = false;

let boardWidth = 400;
let boardHeight = 600;
let pegSpacing = 40;
const pegRadius = 5;

export function initPlinkoGame(category, categoryData) {
    const currentPoints = parseInt(localStorage.getItem('points') || '0');
    console.log('Initializing Plinko Game with', currentPoints, 'points and category:', category);
    currentPlinkoCategory = category;

    const progress = JSON.parse(localStorage.getItem('plinkoProgress'));

    if (progress) {
        console.log('Found saved progress:', progress);
        progressBarFill = progress.progressBarFill;
        currentPlinkoCard = progress.currentPlinkoCard;
        needNewCard = progress.needNewCard;
    } else {
        console.log('No saved progress. Starting new game.');
        progressBarFill = 0;
        needNewCard = true;
    }

    if (needNewCard) {
        currentPlinkoCard = selectRandomCard(categoryData);
        needNewCard = false;
        saveProgress('plinko', {
            progressBarFill,
            currentPlinkoCard,
            needNewCard
        });
    }

    // Set board dimensions based on screen size
    const plinkoBoard = document.getElementById('plinko-board');
    boardWidth = plinkoBoard.clientWidth;
    boardHeight = plinkoBoard.clientHeight;
    pegSpacing = boardWidth / 8; // This will give us 7 columns max

    createPlinkoBoard();
    updateProgressBar();
    updateCardImage(currentPlinkoCard, currentPlinkoCategory, 'plinko', 'plinko-card-image');
    updatePointsDisplay();

    // Show the Plinko game container
    const plinkoContainer = document.getElementById('plinko-game-container');
    plinkoContainer.style.display = 'block';

    // Add click event listener to the board
    plinkoBoard.addEventListener('click', handleBoardClick);

    // Add window resize listener
    window.addEventListener('resize', debounce(() => {
        boardWidth = plinkoBoard.clientWidth;
        boardHeight = plinkoBoard.clientHeight;
        pegSpacing = Math.min(boardWidth, boardHeight) / 8;
        createPlinkoBoard();
    }, 250));
}

function createPlinkoBoard() {
    const board = document.getElementById('plinko-board');
    board.innerHTML = ''; // Clear existing content

    boardWidth = board.clientWidth;
    boardHeight = board.clientHeight;

    const rows = 10; // Fixed number of rows
    const maxCols = Math.floor(boardWidth / pegSpacing) - 1;

    // Adjust pegSpacing to fit the board width
    pegSpacing = boardWidth / (maxCols + 1);

    // Create pegs
    for (let row = 0; row < rows; row++) {
        const isEvenRow = row % 2 === 0;
        const pegsInRow = isEvenRow ? maxCols - 1 : maxCols;
        const rowWidth = (pegsInRow - 1) * pegSpacing;
        const startX = (boardWidth - rowWidth) / 2;

        for (let col = 0; col < pegsInRow; col++) {
            const peg = document.createElement('div');
            peg.className = 'peg';
            const pegX = startX + col * pegSpacing;
            const pegY = pegSpacing + row * pegSpacing;
            peg.style.left = `${pegX}px`;
            peg.style.top = `${pegY}px`;
            board.appendChild(peg);
        }
    }

    // Create slots
    const slotValues = [1, 2, 5, 10, 5, 2, 1];
    const slotWidth = boardWidth / slotValues.length;
    slotValues.forEach((value, index) => {
        const slot = document.createElement('div');
        slot.className = 'slot';
        const slotNumber = document.createElement('span');
        slotNumber.className = 'slot-number';
        slotNumber.textContent = value;
        slot.appendChild(slotNumber);
        slot.style.left = `${index * slotWidth}px`;
        slot.style.width = `${slotWidth}px`;
        slot.style.bottom = '0';
        board.appendChild(slot);
    });

    // Create ball
    const ball = document.createElement('div');
    ball.id = 'ball';
    board.appendChild(ball);

    console.log(`Board dimensions: ${boardWidth}x${boardHeight}, Peg spacing: ${pegSpacing}`);
}

function updateProgressBar() {
    const progressBar = document.getElementById('plinko-progress-bar');
    const percentage = (progressBarFill / totalProgressNeeded) * 100;
    progressBar.style.width = `${percentage}%`;
}

function handleBoardClick(event) {
    if (isAnimating) return;

    if (checkSufficientPoints()) {
        const board = document.getElementById('plinko-board');
        const rect = board.getBoundingClientRect();
        const x = event.clientX - rect.left;
        dropBall(Math.max(pegRadius, Math.min(boardWidth - pegRadius, x)));
    } else {
        showOutOfPointsMessage('plinko-out-of-points-message');
    }
}

export function dropBall(startX) {
    if (isAnimating || !checkSufficientPoints()) {
        console.log('Cannot drop ball: animation in progress or not enough points');
        return;
    }

    isAnimating = true;
    updatePoints(-1); // Deduct one point for playing
    animatePointsDecrement('plinko-points');
    updatePointsDisplay();

    const ball = document.getElementById('ball');
    ball.style.display = 'block';
    ball.style.left = `${startX}px`;
    ball.style.top = '0';

    let position = { x: startX, y: 0 };
    let velocity = { x: 0, y: 0 };

    function updateBall() {
        if (position.y < boardHeight - 20) {
            velocity.y += 0.6; // Gravity
            position.x += velocity.x;
            position.y += velocity.y;

            // Add slight randomness to movement
            velocity.x += (Math.random() - 0.5) * 0.3;
            velocity.y += (Math.random() - 0.5) * 0.3;

            // Collision with pegs
            document.querySelectorAll('.peg').forEach(peg => {
                const pegRect = peg.getBoundingClientRect();
                const ballRect = ball.getBoundingClientRect();
                const dx = (pegRect.left + pegRect.right) / 2 - (ballRect.left + ballRect.right) / 2;
                const dy = (pegRect.top + pegRect.bottom) / 2 - (ballRect.top + ballRect.bottom) / 2;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < pegRadius + 10) { // 10 is ball radius
                    const angle = Math.atan2(dy, dx);
                    const bounceStrength = 8 + Math.random() * 4;
                    velocity.x = -Math.cos(angle) * bounceStrength;
                    velocity.y = -Math.sin(angle) * bounceStrength;

                    // Add slight randomness to the bounce
                    const randomAngle = (Math.random() - 0.5) * 0.5;
                    velocity.x += Math.cos(randomAngle);
                    velocity.y += Math.sin(randomAngle);

                    // Animate peg
                    peg.style.animation = 'none';
                    peg.offsetHeight; // Trigger reflow
                    peg.style.animation = 'pegPulse 0.3s ease-out';
                }
            });

            // Boundary collision
            if (position.x < pegRadius || position.x > boardWidth - pegRadius) {
                velocity.x = -velocity.x * 0.8;
                position.x = position.x < pegRadius ? pegRadius : boardWidth - pegRadius;
            }

            ball.style.left = `${position.x}px`;
            ball.style.top = `${position.y}px`;

            requestAnimationFrame(updateBall);
            
        } else {
        // Ball has reached the bottom
            const pointsEarned = calculatePointsEarned(position.x);
            progressBarFill += pointsEarned;
            updateProgressBar();
            saveProgress('plinko', {
                progressBarFill,
                currentPlinkoCard,
                needNewCard
            });

            // Animate the slot number
            const slotIndex = Math.floor(position.x / (boardWidth / 7));
            const slot = document.querySelectorAll('.slot')[slotIndex];
            const slotNumber = slot.querySelector('.slot-number');
            slotNumber.classList.add('animate-slot');
            setTimeout(() => {
                slotNumber.classList.remove('animate-slot');
            }, 1000); // Remove the class after 1 second

            if (progressBarFill >= totalProgressNeeded) {
                revealCard();
            }

            ball.style.display = 'none';
            isAnimating = false;
        }
    }

    updateBall();
}

function calculatePointsEarned(finalX) {
    const slotWidth = boardWidth / 7;
    const slotIndex = Math.floor(finalX / slotWidth);
    const slotValues = [1, 2, 5, 10, 5, 2, 1];
    return slotValues[Math.min(slotIndex, 6)]; // Ensure we don't go out of bounds
}

function revealCard() {
    console.log('Card revealed:', currentPlinkoCard);

    saveWonCard(currentPlinkoCard, currentPlinkoCategory);

    // Reset progress and set flag for new card
    progressBarFill = 0;
    needNewCard = true;

    saveProgress('plinko', {
        progressBarFill,
        currentPlinkoCard,
        needNewCard
    });

    // Show the won card screen
    setTimeout(() => {
        showWonCard(currentPlinkoCard, 'plinko');
    }, 500);
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
