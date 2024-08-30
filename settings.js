import { updatePointsDisplay } from "./app.js";
import { audioService } from "./audio-service.js";
import { showScreen } from "./app.js";

export function initSettingsScreen() {
  const voiceSelect = document.getElementById("voice-select");

  // Set the initial value
  voiceSelect.value = audioService.currentVoice;

  // Add event listener
  voiceSelect.addEventListener("change", async (event) => {
    const selectedVoice = event.target.value;
    await audioService.setVoice(selectedVoice);
    // Optionally play a sample audio to demonstrate the new voice
    audioService.playGameStartAudio();
  });
}

export function showSettingsScreen() {
  const homeButton = document.getElementById("settings-home-button");

  showScreen("settings-screen");

  homeButton.onclick = () => {
    showScreen("home-screen");
    homeButton.classList.remove("visible");
  };

  // Animate the home button
  setTimeout(() => {
    homeButton.classList.add("visible");
  }, 500);
}
