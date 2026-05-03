// ======================================================
// ZOMBIES MODULE (AI + RANGED + PROJECTILES) — UPDATED FOR GRENADE DAMAGE
// WITH BACKWARD-COMPATIBLE zombies[] ALIAS
// ======================================================
window.Zombies = {
    scene: null,
    list: [],
    zombies: [],        // <— alias for old code
    projectiles: [],
    totalSpawned: 0,
    initialCount: 0,

    // ======================================================
    // INIT
    // ======================================================
    init(scene, count = 20) {
        this.scene = scene;
        this.list = [];
        this.zombies = [];   // keep alias in sync
        this.projectiles = [];
        this.totalSpawned = 0;
        this.initialCount = count;

        for (let i = 0; i < count; i++) {
            const z = this.createZombie(1);
            scene.add(z);
            this.list.push(z);
            this.zombies.push(z); // alias
            this.totalSpawned++;
        }
    },

    // ======================================================
    // CREATE ZOMBIE (SAFE SPAWN + DIFFICULTY HOOKED)
    // ======================================================
    createZombie(level = 1) {
        const loader = new THREE.TextureLoader();

        const pantsTex = loader.load("textures/zombie_pants.jpg");
        const shirtTex = loader.load("textures/zombie_shirt.jpg");
        const faceTex  = loader.load("textures/zombie_face.jpg");
        const hairTex  = loader.load("textures/zombie_hair.jpg");
        const skinTex  = loader.load("textures/zombie_skin.jpg");

        const zombie = new THREE.Group();
        zombie.isZombie = true;
        zombie.level = level;

        zombie.speed =
            (0.03 + level * 0.01) *
            GameSettings.zombieSpeedMultiplier *
            ZombieMode.settings.speedMultiplier;

        zombie.health = 4 + level * 1.2;
        zombie.walkTime = 0;
        zombie.attackCooldown = 0;

        const torso = new THREE.Mesh(
            new THREE.BoxGeometry(3, 5, 2),
            new THREE.MeshStandardMaterial({ map: shirtTex })
        );
        torso.position.set(0, 7, 0);
        torso.castShadow = true;
        zombie.add(torso);

        const head = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2),
            new THREE.MeshStandardMaterial({ map: faceTex })
        );
        head.position.set(0, 3.5, 0);
        torso.add(head);

        const hair = new THREE.Mesh(
            new THREE.BoxGeometry(2.2, 1, 2.2),
            new THREE.MeshStandardMaterial({ map: hairTex })
        );
        hair.position.set(0, 1.5, 0);
        head.add(hair);

        const leftLeg = new THREE.Mesh(
            new THREE.BoxGeometry(1, 4, 1),
            new THREE.MeshStandardMaterial({ map: pantsTex })
        );
        leftLeg.position.set(-1, -4.5, 0);
        torso.add(leftLeg);

        const rightLeg = new THREE.Mesh(
            new THREE.BoxGeometry(1, 4, 1),
            new THREE.MeshStandardMaterial({ map: pantsTex })
        );
        rightLeg.position.set(1, -4.5, 0);
        torso.add(rightLeg);

        const leftArm = new THREE.Mesh(
            new THREE.BoxGeometry(1, 3, 1),
            new THREE.MeshStandardMaterial({ map: skinTex })
        );
        leftArm.position.set(-2.5, 1.5, 0);
        torso.add(leftArm);

        const rightArm = new THREE.Mesh(
            new THREE.BoxGeometry(1, 3, 1),
            new THREE.MeshStandardMaterial({ map: skinTex })
        );
        rightArm.position.set(2.5, 1.5, 0);
        torso.add(rightArm);

        zombie.limbs = { leftLeg, rightLeg, leftArm, rightArm };

        zombie.hitParts = [
            torso, head, hair,
            leftLeg, rightLeg,
            leftArm, rightArm
        ];

        const size = { x: 2, y: 6, z: 2 };

        const MIN_DIST = 120;
        const MAX_DIST = 260;

        let pos;
        let tries = 0;

        const center = (window.playerPos instanceof THREE.Vector3)
            ? window.playerPos
            : new THREE.Vector3(0, 0, 0);

        do {
            const angle = Math.random() * Math.PI * 2;
            const dist  = MIN_DIST + Math.random() * (MAX_DIST - MIN_DIST);

            pos = new THREE.Vector3(
                center.x + Math.cos(angle) * dist,
                2.5,
                center.z + Math.sin(angle) * dist
            );

            tries++;

        } while (
            window.checkCollision(pos, size) &&
            tries < 50
        );

        zombie.position.copy(pos);

        return zombie;
    },

    // ======================================================
    // UPDATE ALL ZOMBIES + PROJECTILES
    // ======================================================
    updateAll(playerPos, playerVel) {
        this.list.forEach(z => this.updateZombie(z, playerPos));
        this.updateProjectiles(playerPos);

        // Remove dead zombies
        this.list = this.list.filter(z => {
            if (z.health <= 0) {
                this.scene.remove(z);
                return false;
            }
            return true;
        });

        // keep alias in sync
        this.zombies = this.list.slice();

        // Win condition
        if (this.list.length === 0 && this.initialCount > 0) {
            if (window.showWinOverlay) window.showWinOverlay();
            if (window.returnToStart) window.returnToStart();
        }
    },

    // ======================================================
    // UPDATE SINGLE ZOMBIE
    // ======================================================
    updateZombie(zombie, playerPos) {
        zombie.position.y = 2.5;

        const dir = new THREE.Vector3()
            .subVectors(playerPos, zombie.position)
            .normalize();

        const nextPos = zombie.position.clone().add(
            dir.multiplyScalar(zombie.speed)
        );

        const zombieSize = { x: 2, y: 6, z: 2 };

        if (!window.checkCollision(nextPos, zombieSize)) {
            zombie.position.copy(nextPos);
        }

        if (Math.random() < 0.05) Sounds.playZombieStep();

        zombie.walkTime += 0.15;
        const swing = Math.sin(zombie.walkTime) * 0.6;

        zombie.limbs.leftLeg.rotation.x = swing;
        zombie.limbs.rightLeg.rotation.x = -swing;
        zombie.limbs.leftArm.rotation.x = -swing * 0.5;
        zombie.limbs.rightArm.rotation.x = swing * 0.5;

        const dist = zombie.position.distanceTo(playerPos);

        if (dist < 2) {
            window.damagePlayer(ZombieMode.settings.damage);
            if (Sounds.playZombieHit) Sounds.playZombieHit();
        }

        zombie.attackCooldown = zombie.attackCooldown || 0;

        if (zombie.attackCooldown <= 0) {
            zombie.limbs.rightArm.rotation.x = -1.2;
            this.spawnProjectile(zombie, playerPos);
            zombie.attackCooldown = ZombieMode.settings.attackCooldown;
        } else {
            zombie.attackCooldown -= 1;
        }
    },

    // ======================================================
    // SPAWN PROJECTILE
    // ======================================================
    spawnProjectile(zombie, playerPos) {
        const min = ZombieMode.settings.projectileCountMin;
        const max = ZombieMode.settings.projectileCountMax;

        const count = min + Math.floor(Math.random() * (max - min + 1));

        for (let i = 0; i < count; i++) {
            const colors = [0xffff00, 0x00ff00, 0xff0000];
            const color = colors[Math.floor(Math.random() * colors.length)];

            const geom = new THREE.SphereGeometry(2.5, 12, 12);
            const mat = new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 0.9
            });

            const mesh = new THREE.Mesh(geom, mat);

            mesh.position.copy(zombie.position);
            mesh.position.y += 15;
            mesh.position.x += 5;

            const dir = new THREE.Vector3(
                playerPos.x - mesh.position.x,
                (playerPos.y + 10) - mesh.position.y,
                playerPos.z - mesh.position.z
            ).normalize();

            dir.x += (Math.random() - 0.5) * 0.2;
            dir.y += (Math.random() - 0.5) * 0.1;
            dir.z += (Math.random() - 0.5) * 0.2;
            dir.normalize();

            const velocity = dir.multiplyScalar(4.5);

            this.scene.add(mesh);

            this.projectiles.push({
                mesh,
                velocity,
                homing: true,
                life: 200
            });
        }
    },

    // ======================================================
    // UPDATE PROJECTILES
    // ======================================================
    updateProjectiles(playerPos) {
        this.projectiles = this.projectiles.filter((proj) => {
            if (!proj.mesh) return false;

            if (proj.homing) {
                const zone = Math.floor(Math.random() * 3);
                let targetY =
                    zone === 0 ? playerPos.y - 1 :
                    zone === 1 ? playerPos.y + 4 :
                                 playerPos.y + 8;

                const spread = 0.6;
                const offsetX = (Math.random() - 0.5) * spread;
                const offsetZ = (Math.random() - 0.5) * spread;

                const predicted = new THREE.Vector3(
                    playerPos.x + (window.estimatedPlayerVelocity?.x || 0) * 0.3 + offsetX,
                    targetY,
                    playerPos.z + (window.estimatedPlayerVelocity?.z || 0) * 0.3 + offsetZ
                );

                predicted.y -= 0.5 + Math.random();

                const targetDir = predicted.sub(proj.mesh.position).normalize();

                proj.velocity.lerp(
                    targetDir.multiplyScalar(4.5),
                    ZombieMode.settings.homingStrength
                );
            }

            const steps = 4;
            const stepVel = proj.velocity.clone().multiplyScalar(1 / steps);

            for (let i = 0; i < steps; i++) {
                proj.mesh.position.add(stepVel);

                if (window.projectileHitsObject(proj.mesh.position)) {
                    this.scene.remove(proj.mesh);
                    return false;
                }
            }

            proj.life -= 1;
            if (proj.life <= 0) {
                this.scene.remove(proj.mesh);
                return false;
            }

            const dx = proj.mesh.position.x - playerPos.x;
            const dy = proj.mesh.position.y - (playerPos.y + 5);
            const dz = proj.mesh.position.z - playerPos.z;

            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < 5) {
                window.damagePlayer(ZombieMode.settings.damage);
                if (Sounds.playPlayerHit) Sounds.playPlayerHit();
                this.scene.remove(proj.mesh);
                return false;
            }

            return true;
        });
    },

    // ======================================================
    // GRENADE DAMAGE (CALLED FROM grenade.js)
    // ======================================================
    applyExplosionDamage(center, radius = 10) {
        for (const z of this.list) {
            if (!z) continue;

            const dist = z.position.distanceTo(center);
            if (dist > radius) continue;

            const maxDamage = 100;
            const falloff = dist / radius;
            const damage = maxDamage * (1 - falloff);

            z.health -= damage;

            if (z.health <= 0) {
                z.health = 0;
            }
        }

        // keep alias in sync after explosion damage
        this.zombies = this.list.slice();
    }
};
