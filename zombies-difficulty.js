// ======================================================
// ZOMBIE DIFFICULTY MODES (GLOBAL MODULE) — BALANCED VERSION
// ======================================================
window.ZombieMode = {
    mode: "NORMAL",   // default

    presets: {
        EASY: {
            attackCooldown: 260,     // very slow attacks
            projectileCountMin: 1,
            projectileCountMax: 1,
            homingStrength: 0.008,   // barely homes
            speedMultiplier: 0.75,
            damage: 1
        },

        NORMAL: {
            attackCooldown: 200,     // slower than before
            projectileCountMin: 1,
            projectileCountMax: 1,   // no more double shots
            homingStrength: 0.015,   // easier to dodge
            speedMultiplier: 0.9,    // slightly slower zombies
            damage: 1
        },

        HARD: {
            attackCooldown: 140,
            projectileCountMin: 1,
            projectileCountMax: 2,
            homingStrength: 0.035,
            speedMultiplier: 1.15,
            damage: 1
        },

        INSANE: {
            attackCooldown: 90,
            projectileCountMin: 2,
            projectileCountMax: 3,
            homingStrength: 0.06,
            speedMultiplier: 1.35,
            damage: 2
        }
    },

    get settings() {
        return this.presets[this.mode] || this.presets.NORMAL;
    },

    setMode(newMode) {
        if (this.presets[newMode]) {
            this.mode = newMode;
            console.log("Zombie difficulty set to:", newMode);
        }
    }
};
