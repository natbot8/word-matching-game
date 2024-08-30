import { StorageService } from "./storage-service.js";

const VOICE_STORAGE_KEY = "selectedVoice";
const DEFAULT_VOICE = "emi";

const voiceAudio = {
  emi: {
    difficulty: {
      easy: "easy.m4a",
      hard: "hard.m4a",
      superhard: "superhard.m4a",
      superduperhard: "superduperhard.m4a",
    },
    gameStart: "lets-go.m4a",
    correct: ["nice.m4a", "oo-nice.m4a", "good-job.m4a", "great.m4a"],
    incorrect: ["try-again.m4a", "oops.m4a"],
    winCard: "won-card.m4a",
    needPoints: "need-points.m4a",
  },
  gabby: {
    difficulty: {
      easy: "gabby-easy.m4a",
      hard: "gabby-hard.m4a",
      superhard: "gabby-superhard.m4a",
      superduperhard: "gabby-superduperhard.m4a",
    },
    gameStart: "gabby-lets-go.m4a",
    correct: [
      "gabby-nice-farting.m4a",
      "gabby-nice.m4a",
      "gabby-good-job.m4a",
      "gabby-great.m4a",
      "gabby-oo-nice.m4a",
    ],
    incorrect: ["gabby-oops.m4a"],
    winCard: "gabby-won-card.m4a",
    needPoints: "gabby-need-points.m4a",
  },
};

class AudioService {
  constructor() {
    this.currentVoice = DEFAULT_VOICE;
    this.currentAudio = null;
  }

  async initialize() {
    const savedVoice = await StorageService.getItem(VOICE_STORAGE_KEY);
    this.currentVoice = savedVoice || DEFAULT_VOICE;
  }

  async setVoice(voice) {
    this.currentVoice = voice;
    await StorageService.setItem(VOICE_STORAGE_KEY, voice);
  }

  playAudio(category, subCategory = null) {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }

    let audioFile;
    if (subCategory) {
      audioFile = voiceAudio[this.currentVoice][category][subCategory];
    } else if (Array.isArray(voiceAudio[this.currentVoice][category])) {
      const randomIndex = Math.floor(
        Math.random() * voiceAudio[this.currentVoice][category].length
      );
      audioFile = voiceAudio[this.currentVoice][category][randomIndex];
    } else {
      audioFile = voiceAudio[this.currentVoice][category];
    }

    this.currentAudio = new Audio(`game-sounds/${audioFile}`);
    this.currentAudio
      .play()
      .catch((error) => console.error("Error playing audio:", error));
  }

  playDifficultyAudio(difficulty) {
    this.playAudio("difficulty", difficulty);
  }

  playGameStartAudio() {
    this.playAudio("gameStart");
  }

  playCorrectAudio() {
    this.playAudio("correct");
  }

  playIncorrectAudio() {
    this.playAudio("incorrect");
  }

  playWinCardAudio() {
    this.playAudio("winCard");
  }

  playNeedPointsAudio() {
    this.playAudio("needPoints");
  }
}

export const audioService = new AudioService();
