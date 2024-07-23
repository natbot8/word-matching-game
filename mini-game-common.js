import { totalPoints } from './app.js';

const noPointsSound = new Audio('game-sounds/need-points.m4a');

export function animatePointsDecrement(pointsDisplayId) {
    const pointsDisplay = document.getElementById(pointsDisplayId);
    if (pointsDisplay) {
        pointsDisplay.classList.add('decrement');
        setTimeout(() => {
            pointsDisplay.classList.remove('decrement');
        }, 500); // Match this to the animation duration in CSS
    } else {
        console.error(`Points display element with id '${pointsDisplayId}' not found`);
    }
}

export function showOutOfPointsMessage(messageElementId) {
    const message = document.getElementById(messageElementId);
    if (message) {
        message.classList.add('show');
        setTimeout(() => {
            message.classList.remove('show');
        }, 1500);
        playNoPointsSound();
    } else {
        console.error(`Message element with id '${messageElementId}' not found`);
    }
}

export function checkSufficientPoints() {
    return totalPoints > 0;
}

function playNoPointsSound() {
    noPointsSound.currentTime = 0; // Reset to start of the audio
    noPointsSound.play().catch(error => console.error('Error playing audio:', error));
}
