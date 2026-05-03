// ======================================================
// WEAPONS MANAGER — COD GRENADE + SWAY + TEXTURES
// ======================================================
window.Weapons = window.Weapons || {};
Weapons.weapons = Weapons.weapons || {};
Weapons.projectiles = Weapons.projectiles || [];

Weapons.camera = null;
Weapons.scene = null;
Weapons.activeWeapon = null;
Weapons.runSwingTime = 0;

// ======================================================
// INIT
// ======================================================
Weapons.init = function (camera, scene) {
    this.camera = camera;
    this.scene = scene;

    // Initialize all weapons
    for (const key in this.weapons) {
        const w = this.weapons[key];
        if (w && typeof w.init === "function") {
            w.init(camera, scene);
        }
    }

    // Default weapon = AK47
    this.activeWeapon = this.weapons.AK47;

    // Show AK47, hide grenade
    this.weapons.AK47.model.visible = true;
    if (this.weapons.GRENADE)
        this.weapons.GRENADE.model.visible = false;
};

// ======================================================
// UPDATE LOOP
// ======================================================
Weapons.update = function () {
    if (this.activeWeapon && this.activeWeapon.update)
        this.activeWeapon.update();

    this.projectiles = this.projectiles.filter(p => p && p());
};

// ======================================================
// INPUT FORWARDING
// ======================================================
Weapons.handleMouseDown = function (button) {
    if (this.activeWeapon && this.activeWeapon.handleMouseDown)
        this.activeWeapon.handleMouseDown(button);
};

Weapons.handleMouseUp = function (button) {
    if (this.activeWeapon && this.activeWeapon.handleMouseUp)
        this.activeWeapon.handleMouseUp(button);
};

// ======================================================
// FIXED WEAPON SWITCHING (MODE 1)
// ======================================================
Weapons.handleKeyDown = function (key) {

    // Switch to AK47
    if (key === "1") {
        this.activeWeapon = this.weapons.AK47;

        this.weapons.AK47.model.visible = true;
        if (this.weapons.GRENADE)
            this.weapons.GRENADE.model.visible = false;
    }

    // Switch to GRENADE
    if (key === "2" && this.weapons.GRENADE) {
        this.activeWeapon = this.weapons.GRENADE;

        this.weapons.AK47.model.visible = false;
        this.weapons.GRENADE.model.visible = true;
    }

    if (this.activeWeapon && this.activeWeapon.handleKeyDown)
        this.activeWeapon.handleKeyDown(key);
};

Weapons.handleKeyUp = function (key) {
    if (this.activeWeapon && this.activeWeapon.handleKeyUp)
        this.activeWeapon.handleKeyUp(key);
};


// ======================================================
// AK‑47 WEAPON — BODY PART DAMAGE + SWAY + TEXTURES
// ======================================================
Weapons.weapons.AK47 = {

    camera: null,
    scene: null,

    root: new THREE.Group(),
    anim: new THREE.Group(),

    basePos: new THREE.Vector3(0.6, -0.6, -2.0),

    model: new THREE.Group(),

    // Shooting
    isShooting: false,
    fireRate: 120,
    lastShotTime: 0,

    // ADS
    isAiming: false,
    normalFOV: 75,
    aimFOV: 55,

    // Recoil
    recoil: 0,
    recoilReturnSpeed: 0.08,

    // Ammo
    ammo: 30,
    reserveAmmo: GameSettings.maxAmmo,
    magazineSize: 30,

    ammoEl: document.getElementById("ammo"),

   // ======================================================
// INIT — Textures use RepeatWrapping for natural tiling
// ======================================================
init(camera, scene) {
    this.camera = camera;
    this.scene = scene;

    const loader = new THREE.TextureLoader();

    // Body
    const bodyTex = loader.load("textures/ak_body.jpg");
    bodyTex.wrapS = THREE.RepeatWrapping;
    bodyTex.wrapT = THREE.RepeatWrapping;
    bodyTex.repeat.set(2, 2);
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.35, 0.25),
        new THREE.MeshStandardMaterial({ map: bodyTex })
    );
    this.model.add(body);

    // Top rail
    const topTex = loader.load("textures/ak_top.jpg");
    topTex.wrapS = THREE.RepeatWrapping;
    topTex.wrapT = THREE.RepeatWrapping;
    topTex.repeat.set(2, 2);
    const top = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.15, 0.20),
        new THREE.MeshStandardMaterial({ map: topTex })
    );
    top.position.set(0.1, 0.25, 0);
    this.model.add(top);

    // Barrel
    const barrelTex = loader.load("textures/ak_barrel.jpg");
    barrelTex.wrapS = THREE.RepeatWrapping;
    barrelTex.wrapT = THREE.RepeatWrapping;
    barrelTex.repeat.set(3, 1);
    const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.9, 12),
        new THREE.MeshStandardMaterial({ map: barrelTex })
    );
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(1.1, 0, 0);
    this.model.add(barrel);

    // Magazine
    const magTex = loader.load("textures/ak_mag.jpg");
    magTex.wrapS = THREE.RepeatWrapping;
    magTex.wrapT = THREE.RepeatWrapping;
    magTex.repeat.set(2, 2);
    const mag = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.7, 0.2),
        new THREE.MeshStandardMaterial({ map: magTex })
    );
    mag.position.set(-0.3, -0.4, 0);
    mag.rotation.z = -0.3;
    this.model.add(mag);

    // Grip
    const gripTex = loader.load("textures/ak_grip.jpg");
    gripTex.wrapS = THREE.RepeatWrapping;
    gripTex.wrapT = THREE.RepeatWrapping;
    gripTex.repeat.set(2, 2);
    const grip = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.5, 0.2),
        new THREE.MeshStandardMaterial({ map: gripTex })
    );
    grip.position.set(-0.7, -0.35, 0);
    this.model.add(grip);

    // Stock
    const stockTex = loader.load("textures/ak_stock.jpg");
    stockTex.wrapS = THREE.RepeatWrapping;
    stockTex.wrapT = THREE.RepeatWrapping;
    stockTex.repeat.set(2, 2);
    const stock = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.25, 0.25),
        new THREE.MeshStandardMaterial({ map: stockTex })
    );
    stock.position.set(-1.1, 0, 0);
    this.model.add(stock);

    // Red dot sight base
    const dotBaseTex = loader.load("textures/ak_red_dot_base.jpg");
    dotBaseTex.wrapS = THREE.RepeatWrapping;
    dotBaseTex.wrapT = THREE.RepeatWrapping;
    dotBaseTex.repeat.set(2, 2);
    const dotBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.15, 0.25),
        new THREE.MeshStandardMaterial({ map: dotBaseTex })
    );
    dotBase.position.set(0.3, 0.35, 0);
    this.model.add(dotBase);

    // Red dot sight glass (no repeat)
    const dotGlassTex = loader.load("textures/ak_red_dot_glass.jpg");
    const dotGlass = new THREE.Mesh(
        new THREE.PlaneGeometry(0.18, 0.18),
        new THREE.MeshStandardMaterial({
            map: dotGlassTex,
            transparent: true
        })
    );
    dotGlass.position.set(0.3, 0.38, 0.11);
    this.model.add(dotGlass);

    // Attach to camera
    this.root.add(this.anim);
    camera.add(this.root);

    this.root.position.copy(this.basePos);
    this.model.rotation.set(0, -Math.PI / 2, 0);
    this.model.position.set(0, -0.05, 0.55);

    this.anim.add(this.model);
    this.model.visible = true;

    this.updateAmmoUI();
},


    // ======================================================
    // INPUT
    // ======================================================
    handleMouseDown(button) {
        if (button === 0) {
            this.isShooting = true;
            this.shoot();
        }
        if (button === 2) this.isAiming = true;
    },

    handleMouseUp(button) {
        if (button === 0) this.isShooting = false;
        if (button === 2) this.isAiming = false;
    },

    handleKeyDown(key) {
        if (key.toLowerCase() === "r") this.startReload();
    },

    handleKeyUp(key) {},

    // ======================================================
    // SHOOTING
    // ======================================================
    shoot() {
        const now = performance.now();
        if (now - this.lastShotTime < this.fireRate) return;
        this.lastShotTime = now;

        if (this.ammo <= 0) return;

        this.ammo--;
        this.updateAmmoUI();

        const dir = new THREE.Vector3(
            Math.sin(playerYaw) * Math.cos(playerPitch - this.recoil),
            Math.sin(-(playerPitch - this.recoil)),
            Math.cos(playerYaw) * Math.cos(playerPitch - this.recoil)
        ).normalize();

        const start = this.camera.position.clone();

        this.performHitscan(start, dir);

        const updater = this.createBullet(start, dir);
        Weapons.projectiles.push(updater);

        this.muzzleFlash();
        Sounds.playGunshot();

        this.recoil += this.isAiming ? 0.005 : 0.015;
    },

    updateShooting() {
        if (this.isShooting) this.shoot();
    },
// ======================================================
// HITSCAN DAMAGE (PERFECT RED DOT + BODY PART DAMAGE)
// ======================================================
performHitscan(origin, dir) {
    if (!window.Zombies || !Zombies.list) return;

    let closestZombie = null;
    let closestPart = null;
    let closestDist = Infinity;
    const maxDist = 500;

    Zombies.list.forEach(z => {
        if (!z || z.health <= 0 || !z.hitParts) return;

        z.hitParts.forEach(part => {
            const partPos = part.getWorldPosition(new THREE.Vector3());
            const toPart = partPos.clone().sub(origin);

            const t = toPart.dot(dir);
            if (t < 0 || t > maxDist) return;

            const closestPoint = origin.clone().add(dir.clone().multiplyScalar(t));
            const distToRay = closestPoint.distanceTo(partPos);

            const hitRadius = 3.0;

            if (distToRay <= hitRadius && t < closestDist) {
                closestDist = t;
                closestZombie = z;
                closestPart = part;
            }
        });
    });

    if (!closestZombie) return;

    const raycaster = new THREE.Raycaster(origin, dir, 0, closestDist);
    const wallHits = raycaster.intersectObjects(window.SOLID_OBJECTS, true);

    if (wallHits.length > 0) {
        // Wall is closer than zombie → blocked
        return;
    }

    // ----------------------------------------------------
    // BODY PART DAMAGE
    // ----------------------------------------------------
    let damage = 0;
    const name = closestPart.name.toLowerCase();

    if (name.includes("head")) damage = 1.0;
    else if (name.includes("chest") || name.includes("torso")) damage = 0.85;
    else if (name.includes("arm") || name.includes("hand")) damage = 0.5;
    else if (name.includes("leg") || name.includes("foot")) damage = 0.2;
    else damage = 0.5;

    closestZombie.health -= damage;

    if (window.GameOverlay?.showHitmarker) {
        GameOverlay.showHitmarker();
    }

    if (window.Sounds?.playZombieHit) {
        Sounds.playZombieHit();
    }
},


    // ======================================================
    // BULLET PROJECTILE (visual only)
    // ======================================================
    createBullet(startPos, direction) {
        const tracerGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
        const tracerMat = new THREE.MeshStandardMaterial({
            color: 0xffdd88,
            emissive: 0xffaa00
        });

        const tracer = new THREE.Mesh(tracerGeom, tracerMat);
        tracer.rotation.x = Math.PI / 2;
        tracer.position.copy(startPos);
        this.scene.add(tracer);

        const velocity = direction.clone().multiplyScalar(3.5);
        let life = 40;

        return () => {
            if (life-- <= 0) {
                this.scene.remove(tracer);
                return false;
            }

            tracer.position.add(velocity);
            return true;
        };
    },

    // ======================================================
    // MUZZLE FLASH
    // ======================================================
    muzzleFlash() {
        const flash = new THREE.Mesh(
            new THREE.ConeGeometry(0.2, 0.5, 0.5, 8),
            new THREE.MeshStandardMaterial({
                color: 0xffdd88,
                emissive: 0xffaa00
            })
        );

        flash.rotation.x = Math.PI / 2;

        const dir = this.camera.getWorldDirection(new THREE.Vector3());
        flash.position.copy(this.camera.position).add(dir.multiplyScalar(1));

        this.scene.add(flash);

        setTimeout(() => this.scene.remove(flash), 50);
    },

    // ======================================================
    // RELOAD
    // ======================================================
    startReload() {
        if (this.ammo === this.magazineSize || this.reserveAmmo <= 0) return;

        Sounds.playReload();

        setTimeout(() => {
            const need = this.magazineSize - this.ammo;
            const load = Math.min(need, this.reserveAmmo);

            this.ammo += load;
            this.reserveAmmo -= load;

            this.updateAmmoUI();
        }, 900);
    },

    // ======================================================
    // UI
    // ======================================================
    updateAmmoUI() {
        if (!this.ammoEl) return;
        this.ammoEl.textContent = `${this.ammo} / ${this.reserveAmmo}`;
    },

    // ======================================================
    // UPDATE LOOP
    // ======================================================
    update() {
        this.recoil *= (1 - this.recoilReturnSpeed);

        this.camera.fov += ((this.isAiming ? this.aimFOV : this.normalFOV) - this.camera.fov) * 0.2;
        this.camera.updateProjectionMatrix();

        this.updateShooting();

        const moving =
            window.keys?.w ||
            window.keys?.a ||
            window.keys?.s ||
            window.keys?.d;

        const running = moving && window.isRunning;

        const finalPos = this.basePos.clone();

        if (running) {
            Weapons.runSwingTime += 0.10;

            const swingX = Math.sin(Weapons.runSwingTime) * 0.25;
            const swingY = Math.cos(Weapons.runSwingTime * 2) * 0.15;

            finalPos.x += swingX;
            finalPos.y += swingY;
        }

        this.root.position.copy(finalPos);
    }
};

// ======================================================
// GRENADE WEAPON — FULLY FIXED, ALL BRACES CORRECT
// ======================================================
Weapons.weapons.GRENADE = {

    camera: null,
    scene: null,

    model: new THREE.Group(),

    holding: false,
    holdStart: 0,

    grenadeCount: 20,
    grenadeUI: document.getElementById("grenades"),

    // ======================================================
    // INPUT — HOLD GRENADE (G) / THROW ON RELEASE
    // ======================================================
    handleKeyDown(key) {
        if (key !== "g") return;
        if (this.grenadeCount <= 0) return;

        this.holding = true;
        this.holdStart = performance.now();

        this.model.position.set(0.4, -0.8, -1.3);
    },

    handleKeyUp(key) {
        if (key !== "g") return;
        if (!this.holding) return;

        this.holding = false;

        this.model.position.set(0.5, -0.6, -1.5);

        this.throwGrenade();
        this.grenadeCount--;
        this.updateGrenadeUI();
    },

    // ======================================================
    // INIT
    // ======================================================
    init(camera, scene) {
        this.camera = camera;
        this.scene = scene;

        const loader = new THREE.TextureLoader();

        const bodyTex = loader.load("textures/grenade_body.jpg");
        const pinTex = loader.load("textures/grenade_pin.jpg");
        const spoonTex = loader.load("textures/grenade_spoon.jpg");

        // Body
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 16, 16),
            new THREE.MeshStandardMaterial({ map: bodyTex })
        );
        this.model.add(body);

        // Spoon
        const spoon = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.3, 0.12),
            new THREE.MeshStandardMaterial({ map: spoonTex })
        );
        spoon.position.set(0.0, 0.25, 0.0);
        this.model.add(spoon);

        // Pin
        const pin = new THREE.Mesh(
            new THREE.TorusGeometry(0.08, 0.015, 8, 16),
            new THREE.MeshStandardMaterial({ map: pinTex })
        );
        pin.rotation.x = Math.PI / 2;
        pin.position.set(-0.08, 0.25, 0.0);
        this.model.add(pin);

        camera.add(this.model);
        this.model.position.set(0.5, -0.6, -1.5);
        this.model.visible = false;

        this.updateGrenadeUI();
    },

    // ======================================================
    // THROW GRENADE (HOLD = DISTANCE)
    // ======================================================
    throwGrenade() {
        const holdTime = (performance.now() - this.holdStart) / 1000;
        const throwDistance = Math.min(holdTime * 10, 100);

        const dir = this.camera.getWorldDirection(new THREE.Vector3()).normalize();

        const velocity = dir.multiplyScalar(throwDistance * 1);
        velocity.y += 0.2;

        const updater = this.createGrenadeProjectile(velocity);
        Weapons.projectiles.push(updater);

        if (Sounds.audio.grenade) {
            Sounds.audio.grenade.currentTime = 0;
            Sounds.audio.grenade.play();
        }
    },

    // ======================================================
    // GRENADE PROJECTILE
    // ======================================================
    createGrenadeProjectile(velocity) {
        const geom = new THREE.SphereGeometry(0.25, 12, 12);
        const mat = new THREE.MeshStandardMaterial({ color: 0x555555 });

        const mesh = new THREE.Mesh(geom, mat);
        this.scene.add(mesh);

        mesh.position.copy(this.camera.position);

        let life = 300;
        const gravity = 0.12;

        return () => {

            if (life-- <= 0) {
                this.explode(mesh.position.clone());
                this.scene.remove(mesh);
                return false;
            }

            velocity.y -= gravity * 0.016;
            mesh.position.add(velocity);

            if (window.projectileHitsObject(mesh.position)) {
                this.explode(mesh.position.clone());
                this.scene.remove(mesh);
                return false;
            }

            if (mesh.position.y <= (window.GROUND_Y || 0) + 0.1) {
                this.explode(mesh.position.clone());
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
        const bubble = new THREE.Mesh(
            new THREE.SphereGeometry(1, 16, 16),
            new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.8
            })
        );

        bubble.position.copy(pos);
        this.scene.add(bubble);

        let scale = 1;

        const bubbleInterval = setInterval(() => {
            scale += 0.5;
            bubble.scale.set(scale, scale, scale);
            bubble.material.opacity -= 0.08;

            if (bubble.material.opacity <= 0) {
                clearInterval(bubbleInterval);
                this.scene.remove(bubble);
            }
        }, 30);

        if (typeof Zombies !== "undefined" && Zombies.applyExplosionDamage) {
            Zombies.applyExplosionDamage(pos, 10);
        }
    },

    // ======================================================
    // UI
    // ======================================================
    updateGrenadeUI() {
        if (!this.grenadeUI) return;
        this.grenadeUI.textContent = this.grenadeCount;
    },

    // ======================================================
    // UPDATE LOOP
    // ======================================================
    update() {
        const idleTime = performance.now() * 0.002;
        this.model.position.x += Math.sin(idleTime) * 0.002;
        this.model.position.y += Math.cos(idleTime * 2) * 0.002;
    }
};
