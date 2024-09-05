import { updatePointsDisplay } from "./app.js";
import { audioService } from "./audio-service.js";
import { showScreen } from "./app.js";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { InAppReview } from "@capacitor-community/in-app-review";

export function initSettingsScreen() {
  const voiceSelect = document.getElementById("voice-select");
  const rateAppButton = document.getElementById("rate-app-button");
  const shareAppButton = document.getElementById("share-app-button");

  // Set the initial value
  voiceSelect.value = audioService.currentVoice;

  // Add event listener
  voiceSelect.addEventListener("change", async (event) => {
    const selectedVoice = event.target.value;
    await audioService.setVoice(selectedVoice);
    // Optionally play a sample audio to demonstrate the new voice
    audioService.playGameStartAudio();
  });

  // // Add event listener for rate app button
  // rateAppButton.addEventListener("click", () => {
  //   if (Capacitor.isNativePlatform()) {
  //     InAppReview.requestReview();
  //   } else {
  //     // Fallback for non-iOS or web environment
  //     alert("App rating is only available on native platforms.");
  //   }
  // });

  // // Add event listener for share app button
  // shareAppButton.addEventListener("click", async () => {
  //   if (Capacitor.isNativePlatform()) {
  //     await Share.share({
  //       title: "Check out this fun app!",
  //       text: "Check out this reading app!",
  //       url: "https://apps.apple.com/us/app/word-match-learn-to-read/id6636469947",
  //       dialogTitle: "Share with friends",
  //     });
  //   } else {
  //     // Fallback for web environment
  //     alert("App sharing is only available on native platforms.");
  //   }
  // });
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
