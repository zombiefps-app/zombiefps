// ======================================================
// GRENADE WEAPON MODULE (WITH EXPLOSION SOUND)
// ======================================================
window.Weapons = window.Weapons || {};
Weapons.weapons = Weapons.weapons || {};

Weapons.weapons.GRENADE = {

    camera: null,
    scene: null,

    // UI + ammo
    grenades: 20,
    uiEl: document.getElementById("grenades"),

    // Model
    model: new THREE.Group(),

    // Throw cooldown
    throwCooldown: 0,

    // ======================================================
    // INIT
    // ======================================================
    init(camera, scene) {
        this.camera = camera;
        this.scene = scene;

        // Simple grenade model in hand
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0x444444 })
        );
        this.model.add(body);

        camera.add(this.model);
        this.model.position.set(0.5, -0.6, -1.5);

        this.updateUI();
    },

    // ======================================================
    // UI UPDATE
    // ======================================================
    updateUI() {
        if (this.uiEl) {
            this.uiEl.textContent = "Grenades: " + this.grenades;
        }
    },

    // ======================================================
    // INPUT
    // ======================================================
    handleMouseDown(button) {
        if (button !== 0) return;
        if (this.throwCooldown > 0) return;
        if (this.grenades <= 0) return;

        this.throwGrenade();
    },

    handleMouseUp() {},
    handleKeyDown() {},
    handleKeyUp() {},

    // ======================================================
    // UPDATE LOOP
    // ======================================================
    update() {
        if (this.throwCooldown > 0) {
            this.throwCooldown--;
        }
    },

    // ======================================================
    // THROW GRENADE
    // ======================================================
    throwGrenade() {
        this.grenades--;
        this.updateUI();

        this.throwCooldown = 40;

        const updater = this.createGrenadeProjectile();
        Weapons.projectiles.push(updater);
    },

    // ======================================================
    // GRENADE PROJECTILE
    // ======================================================
    createGrenadeProjectile() {
        const geom = new THREE.SphereGeometry(0.3, 12, 12);
        const mat = new THREE.MeshStandardMaterial({ color: 0x555555 });

        const mesh = new THREE.Mesh(geom, mat);
        this.scene.add(mesh);

        // Start position
        const dir = this.camera.getWorldDirection(new THREE.Vector3());
        const pos = this.camera.position.clone().add(dir.clone().multiplyScalar(1.2));

        mesh.position.copy(pos);

        // Velocity (arc)
        const velocity = dir.multiplyScalar(1.2);
        velocity.y += 0.8;

        let life = 120;

        return () => {
            if (life-- <= 0) {
                this.explode(mesh.position);
                this.scene.remove(mesh);
                return false;
            }

            // Gravity
            velocity.y -= 0.03;
            mesh.position.add(velocity);

            // Hit ground
            if (mesh.position.y <= window.GROUND_Y + 0.2) {
                this.explode(mesh.position);
                this.scene.remove(mesh);
                return false;
            }

            return true;
        };
    },

    // ======================================================
    // EXPLOSION
    // ======================================================
    explode(pos) {

        // 🔥 Play explosion sound
        if (window.Sounds && Sounds.audio.grenade) {
            Sounds.audio.grenade.currentTime = 0;
            Sounds.audio.grenade.play();
        }

        // Flash effect
        const flash = new THREE.Mesh(
            new THREE.SphereGeometry(4, 16, 16),
            new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.8
            })
        );

        flash.position.copy(pos);
        this.scene.add(flash);

        setTimeout(() => this.scene.remove(flash), 150);

        // Damage zombies
        for (const z of Zombies.list) {
            if (!z) continue;

            const dist = z.position.distanceTo(pos);
            if (dist < 10) {
                z.health = 0; // instant kill
            }
        }
    }
};
