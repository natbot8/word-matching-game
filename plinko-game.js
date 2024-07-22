import { updatePoints, totalPoints, updatePointsDisplay } from './app.js';
import { wordCategories } from './app.js';

let progressBarFill = 0;
let currentPlinkoCategory = '';
let currentPlinkoCard = '';
const totalProgressNeeded = 100;
let isAnimating = false;

const boardWidth = 400;
const boardHeight = 600;
const pegSpacing = 40;
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
    } else {
        console.log('No saved progress. Starting new game.');
        progressBarFill = 0;
        if (!selectRandomCard(categoryData)) {
            console.error('Failed to select a random card. Unable to initialize Plinko game.');
            return;
        }
    }

    createPlinkoBoard();
    updateProgressBar();
    updatePointsDisplay();

    // Show the Plinko game container
    const plinkoContainer = document.getElementById('plinko-game-container');
    plinkoContainer.style.display = 'block';

    // Add click event listener to the board
    const board = document.getElementById('plinko-board');
    board.addEventListener('click', handleBoardClick);
}

function selectRandomCard(categoryData) {
    try {
        console.log('Selecting random card from category data:', categoryData);
        if (!categoryData || !categoryData.cards || categoryData.cards.length === 0) {
            console.error('Invalid category data or no cards available');
            return false;
        }
        const cards = categoryData.cards;
        console.log('Available cards:', cards);
        currentPlinkoCard = cards[Math.floor(Math.random() * cards.length)];
        console.log('Selected card:', currentPlinkoCard);
        return true;
    } catch (error) {
        console.error('Error selecting random card:', error);
        return false;
    }
}

function createPlinkoBoard() {
    const board = document.getElementById('plinko-board');
    board.innerHTML = ''; // Clear existing content

    // Create pegs
    for (let row = 0; row < 10; row++) {
        const isEvenRow = row % 2 === 0;
        const pegsInRow = isEvenRow ? 9 : 8;
        const startX = isEvenRow ? pegSpacing / 2 : pegSpacing;

        for (let col = 0; col < pegsInRow; col++) {
            const peg = document.createElement('div');
            peg.className = 'peg';
            peg.style.left = `${startX + col * pegSpacing}px`;
            peg.style.top = `${80 + row * pegSpacing}px`;
            board.appendChild(peg);
        }
    }

    // Create slots
    const slotValues = [1, 2, 5, 10, 5, 2, 1];
    slotValues.forEach((value, index) => {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.textContent = value;
        slot.style.left = `${index * (boardWidth / 7)}px`;
        slot.style.bottom = '0';
        board.appendChild(slot);
    });

    // Create ball
    const ball = document.createElement('div');
    ball.id = 'ball';
    board.appendChild(ball);
}

function updateProgressBar() {
    const progressBar = document.getElementById('plinko-progress-bar');
    const percentage = (progressBarFill / totalProgressNeeded) * 100;
    progressBar.style.width = `${percentage}%`;
}

function handleBoardClick(event) {
    if (isAnimating || totalPoints <= 0) return;

    const board = document.getElementById('plinko-board');
    const rect = board.getBoundingClientRect();
    const x = event.clientX - rect.left;
    dropBall(Math.max(10, Math.min(390, x)));
}

export function dropBall(startX) {
    if (isAnimating || totalPoints <= 0) {
        console.log('Cannot drop ball: animation in progress or not enough points');
        return;
    }

    isAnimating = true;
    updatePoints(-1); // Deduct one point for playing
    updatePointsDisplay();

    const ball = document.getElementById('ball');
    ball.style.display = 'block';
    ball.style.left = `${startX}px`;
    ball.style.top = '-20px';

    let position = { x: startX, y: -20 };
    let velocity = { x: 0, y: 0 };

    function updateBall() {
        if (position.y < boardHeight - 20) {
            velocity.y += 0.5; // Gravity
            position.x += velocity.x;
            position.y += velocity.y;

            // Collision with pegs
            document.querySelectorAll('.peg').forEach(peg => {
                const pegRect = peg.getBoundingClientRect();
                const ballRect = ball.getBoundingClientRect();
                const dx = (pegRect.left + pegRect.right) / 2 - (ballRect.left + ballRect.right) / 2;
                const dy = (pegRect.top + pegRect.bottom) / 2 - (ballRect.top + ballRect.bottom) / 2;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < pegRadius + 10) { // 10 is ball radius
                    const angle = Math.atan2(dy, dx);
                    const bounceStrength = 3 + Math.random() * 2;
                    velocity.x = -Math.cos(angle) * bounceStrength;
                    velocity.y = -Math.sin(angle) * bounceStrength;

                    // Add slight randomness to the bounce
                    velocity.x += (Math.random() - 0.5) * 0.5;

                    // Animate peg
                    peg.style.animation = 'none';
                    peg.offsetHeight; // Trigger reflow
                    peg.style.animation = 'pegPulse 0.3s ease-out';
                }
            });

            // Boundary collision
            if (position.x < 10 || position.x > boardWidth - 10) {
                velocity.x = -velocity.x * 0.8;
                position.x = position.x < 10 ? 10 : boardWidth - 10;
            }

            ball.style.left = `${position.x}px`;
            ball.style.top = `${position.y}px`;

            requestAnimationFrame(updateBall);
        } else {
            // Ball has reached the bottom
            const pointsEarned = calculatePointsEarned(position.x);
            progressBarFill += pointsEarned;
            updateProgressBar();
            saveProgress();

            if (progressBarFill >= totalProgressNeeded) {
                revealCard();
            }

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

function saveProgress() {
    const progress = {
        progressBarFill: progressBarFill,
        currentPlinkoCard: currentPlinkoCard
    };
    localStorage.setItem('plinkoProgress', JSON.stringify(progress));
    console.log('Progress saved:', progress);
}

function revealCard() {
    console.log('Card revealed:', currentPlinkoCard);
    
    // Save the won card
    const wonCards = JSON.parse(localStorage.getItem('wonCards') || '{}');
    if (!wonCards[currentPlinkoCategory]) {
        wonCards[currentPlinkoCategory] = [];
    }
    if (!wonCards[currentPlinkoCategory].includes(currentPlinkoCard)) {
        wonCards[currentPlinkoCategory].push(currentPlinkoCard);
        localStorage.setItem('wonCards', JSON.stringify(wonCards));
    }

    // Reset progress
    progressBarFill = 0;
    saveProgress();

    // TODO: Implement card reveal animation
    alert(`Congratulations! You've won a new card: ${currentPlinkoCard}`);

    // Select a new card for the next game
    selectRandomCard(wordCategories[currentPlinkoCategory]);
}
