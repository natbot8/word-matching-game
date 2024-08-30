import { updatePointsDisplay } from "./app.js";
import { audioService } from "./audio-service.js";
import { showScreen } from "./app.js";

export function initSettingsScreen() {
  const voiceSelect = document.getElementById("voice-select");
  const homeButton = document.getElementById("settings-home-button");

  // Set the initial value
  voiceSelect.value = audioService.currentVoice;

  // Add event listener
  voiceSelect.addEventListener("change", async (event) => {
    const selectedVoice = event.target.value;
    await audioService.setVoice(selectedVoice);
    // Optionally play a sample audio to demonstrate the new voice
    audioService.playGameStartAudio();
  });

  // Animate the home button
  homeButton.onclick = () => {
    showScreen("home-screen");
  };

  setTimeout(() => {
    homeButton.classList.add("visible");
  }, 500);
}
