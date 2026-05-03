// ======================================================
// GLOBAL SOUND MANAGER (FINAL VERSION)
// ======================================================
window.Sounds = {
  audio: {},
  loaded: false,

  load() {
    const files = {
      gunshot:      "sounds/gunshot.mp3",
      reload:       "sounds/reload.mp3",
      footstep:     "sounds/footstep.mp3",
      zombieStep:   "sounds/zombie_step.mp3",
      zombieHit:    "sounds/zombie_hit.mp3",
      playerHit:    "sounds/player_hit.mp3", 
      ambient:      "sounds/ambient_loop.mp3"
    };

    for (const key in files) {
      const a = new Audio(files[key]);
      a.preload = "auto";
      a.volume = 0.7;

      if (key === "ambient") {
        a.loop = true;
        a.volume = 0.35;
      }

      this.audio[key] = a;
    }

    this.loaded = true;
  },

  play(name) {
    if (!this.loaded) return;
    const a = this.audio[name];
    if (!a) return;

    a.currentTime = 0;
    a.play();
  },

  playGunshot()    { this.play("gunshot"); },
  playReload()     { this.play("reload"); },
  playFootstep()   { this.play("footstep"); },
  playZombieStep() { this.play("zombieStep"); },
  playZombieHit()  { this.play("zombieHit"); },

  // Player hit sound
  playPlayerHit()  { this.play("playerHit"); },

  startAmbient() {
    if (!this.loaded) return;
    this.audio.ambient.play();
  }
};

window.addEventListener("load", () => {
  window.Sounds.load();
});
