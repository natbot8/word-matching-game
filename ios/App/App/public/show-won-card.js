import { showScreen } from './app.js';

export function showWonCard(cardImage, fromGame) {
    const wonCardScreen = document.getElementById('show-won-card-screen');
    const wonCardImage = document.getElementById('won-card-image');
    const cardContainer = document.querySelector('.won-card-image-container');
    const returnHomeButton = document.getElementById('return-home-button');

    wonCardImage.src = `card-images/${cardImage}`;

    // Show the won card screen
    showScreen('show-won-card-screen');

    // Trigger animations
    setTimeout(() => {
        wonCardScreen.classList.add('visible');
        cardContainer.classList.add('animate-entrance');
        addSparkles(cardContainer);

        setTimeout(() => {
            returnHomeButton.classList.add('visible');
        }, 500);
    }, 50);

    // Set up return home button
    returnHomeButton.onclick = () => {
        resetWonCardScreen();
        showScreen('home-screen');
    };
}

function addSparkles(container) {
    const numSparkles = 20;

    for (let i = 0; i < numSparkles; i++) {
        const sparkle = document.createElement('div');
        sparkle.classList.add('sparkle');

        const left = Math.random() * 100 + '%';
        const top = Math.random() * 100 + '%';
        const delay = Math.random() * 1000 + 'ms';
        const duration = (Math.random() * 1000 + 1000) + 'ms';

        sparkle.style.left = left;
        sparkle.style.top = top;
        sparkle.style.animation = `sparkle ${duration} ${delay} infinite`;

        container.appendChild(sparkle);
    }
}

export function resetWonCardScreen() {
    const wonCardScreen = document.getElementById('show-won-card-screen');
    const cardContainer = document.querySelector('.won-card-image-container');
    const returnHomeButton = document.getElementById('return-home-button');

    wonCardScreen.classList.remove('visible');
    cardContainer.classList.remove('animate-entrance');
    returnHomeButton.classList.remove('visible');

    // Remove sparkles
    const sparkles = cardContainer.querySelectorAll('.sparkle');
    sparkles.forEach(sparkle => sparkle.remove());
}
