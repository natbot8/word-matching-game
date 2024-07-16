// Confetti animation
// new confetti animation from tsParticles https://confetti.js.org/more.html
function showConfetti() {
  const duration = 1 * 1000,
    animationEnd = Date.now() + duration,
    defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    // since particles fall down, start a bit higher than random
    confetti(
      Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
    );
    confetti(
      Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        scalar: 2,
        shapes: ["emoji"],
          shapeOptions: {
            emoji: {
              value: ["🦄", "🌈"],
            },
          },
      })
    );
  }, 250);
}

// function showConfetti() {
//   const confettiContainer = document.getElementById('confetti-container');

//   if (!confettiContainer) {
//     console.error("Confetti container not found");
//     return;
//   }

//   console.log("Confetti container found:", confettiContainer);

//   const maxConfetti = 120;
//   let totalConfetti = 0;

//   function createConfetti() {
//     const confettiCount = 20;

//     for (let i = 0; i < confettiCount; i++) {
//       if (totalConfetti >= maxConfetti) return;

//       const confetti = document.createElement('div');
//       confetti.classList.add('confetti');
//       confetti.style.left = `${Math.random() * 100}vw`;
//       confetti.style.animationDelay = `${Math.random() * 2}s`;
//       confetti.style.transform = `translateY(-200px) rotateZ(0)`;
//       confettiContainer.appendChild(confetti);
//       totalConfetti++;
//     }
//   }

//   function fadeOutConfetti() {
//     const confettiElements = confettiContainer.querySelectorAll('.confetti');

//     confettiElements.forEach((confetti, index) => {
//       setTimeout(() => {
//         confetti.style.opacity = '0';
//         setTimeout(() => {
//           confetti.remove();
//           totalConfetti--;
//           if (index === confettiElements.length - 1) {
//             confettiContainer.innerHTML = ''; // Remove remaining confetti
//           }
//         }, 500); // Fade out duration
//       }, index * 40); // Delay each confetti piece for smoother fade-out
//     });
//   }

//   // Start continuously creating confetti every 20 milliseconds
//   const interval = setInterval(() => {
//     createConfetti();

//     if (totalConfetti >= maxConfetti) {
//       clearInterval(interval);
//       fadeOutConfetti(); // Start the fade-out animation once max confetti count is reached
//     }
//   }, 20);
// }


