// ======================================================
// GAME STATE (NEW)
// ======================================================
window.GameState = {
  running: false,
  playerSpawned: false
};


// ======================================================
// GAME SETTINGS
// ======================================================
window.GameSettings = {
  maxZombies: 5,
  zombieSpeedMultiplier: 1,
  playerMaxHealth: 120,
  maxAmmo: 200,
  weapon: "AK47"
};


// ======================================================
// GAME OVERLAY (START, GAME OVER, YOU WIN)
// ======================================================
window.GameOverlay = {

  init() {
    const startPanel = document.getElementById("start-panel");
    const gameOverPanel = document.getElementById("game-over-panel");
    const winPanel = document.getElementById("win-panel");

    // Value labels
    const valZ = document.getElementById("val-zombies");
    const valS = document.getElementById("val-speed");
    const valH = document.getElementById("val-health");
    const valA = document.getElementById("val-ammo");
    const valW = document.getElementById("val-weapon");

    // 🔥 NEW: Difficulty label
    const valD = document.getElementById("val-difficulty");

    // Initialize UI text
    valZ.textContent = GameSettings.maxZombies;
    valS.textContent = GameSettings.zombieSpeedMultiplier + "x";
    valH.textContent = GameSettings.playerMaxHealth;
    valA.textContent = GameSettings.maxAmmo;
    valW.textContent = GameSettings.weapon;

    // 🔥 Initialize difficulty text
    valD.textContent = ZombieMode.mode;

    // =========================
    // BUTTON LOGIC
    // =========================

    // Zombies: 5 → 20
    document.getElementById("btn-zombies").onclick = () => {
      GameSettings.maxZombies += 1;
      if (GameSettings.maxZombies > 20) GameSettings.maxZombies = 5;
      valZ.textContent = GameSettings.maxZombies;
    };

    // Zombie Speed: 1 → 5
    document.getElementById("btn-speed").onclick = () => {
      GameSettings.zombieSpeedMultiplier += 1;
      if (GameSettings.zombieSpeedMultiplier > 5) GameSettings.zombieSpeedMultiplier = 1;
      valS.textContent = GameSettings.zombieSpeedMultiplier + "x";
    };

    // Health: fixed 120
    document.getElementById("btn-health").onclick = () => {
      GameSettings.playerMaxHealth = 120;
      valH.textContent = 120;
    };

    // Ammo: fixed 200
    document.getElementById("btn-ammo").onclick = () => {
      GameSettings.maxAmmo = 200;
      valA.textContent = 200;
    };

    // =========================
    // WEAPON SELECTOR
    // =========================
    const weaponList = ["AK47"];
    let weaponIndex = 0;

    document.getElementById("btn-weapon").onclick = () => {
      weaponIndex = (weaponIndex + 1) % weaponList.length;
      GameSettings.weapon = weaponList[weaponIndex];
      valW.textContent = GameSettings.weapon;
    };

    // =========================
    // 🔥 DIFFICULTY SELECTOR
    // =========================
    const difficultyList = ["EASY", "NORMAL", "HARD", "INSANE"];
    let diffIndex = difficultyList.indexOf(ZombieMode.mode);

    document.getElementById("btn-difficulty").onclick = () => {
      diffIndex = (diffIndex + 1) % difficultyList.length;
      const newMode = difficultyList[diffIndex];

      ZombieMode.setMode(newMode);
      valD.textContent = newMode;
    };

    // =========================
    // START GAME
    // =========================
    document.getElementById("btn-start").onclick = () => {
      startPanel.style.display = "none";

      GameState.running = true;
      GameState.playerSpawned = true;

      startGame();
    };

    // =========================
    // RESTART GAME (GAME OVER)
    // =========================
    document.getElementById("btn-restart").onclick = () => {
      location.reload();
    };

    // =========================
    // RESTART GAME (YOU WIN)
    // =========================
    document.getElementById("btn-win-restart").onclick = () => {
      location.reload();
    };
  },


  // ======================================================
  // GAME OVER
  // ======================================================
  showGameOver() {
    GameState.running = false;
    document.getElementById("game-over-panel").style.display = "flex";
  },


  // ======================================================
  // YOU WIN
  // ======================================================
  showWin() {
    GameState.running = false;
    document.getElementById("win-panel").style.display = "flex";
  }
};


// ======================================================
// GLOBAL HOOKS FOR ZOMBIES MODULE
// ======================================================
window.showWinOverlay = () => {
  GameOverlay.showWin();
};

window.returnToStart = () => {
  setTimeout(() => location.reload(), 1500);
};


// Initialize overlay
window.addEventListener("load", () => {
  GameOverlay.init();
});
