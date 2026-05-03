// ======================================================
// GLOBAL STATE
// ======================================================
let mainDoorOpen = false;
let mainDoorProgress = 0;

window.addEventListener("contextmenu", (e) => e.preventDefault());
window.addEventListener("mousedown", (e) => { if (e.button === 2) e.preventDefault(); });

const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

let scene, camera;

let lastPlayerPos = new THREE.Vector3();
let estimatedPlayerVelocity = new THREE.Vector3();

let playerHealth = GameSettings.playerMaxHealth;
const healthEl = document.getElementById("health");
if (healthEl) healthEl.textContent = "Health: " + playerHealth;

window.damagePlayer = function (amount) {
    if (!GameState.running) return;
    playerHealth = Math.max(0, playerHealth - amount);
    if (healthEl) healthEl.textContent = "Health: " + playerHealth;
};

// ======================================================
// AUDIO UNLOCK
// ======================================================
let audioUnlocked = false;
function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;

    if (window.Sounds && Sounds.loaded) {
        for (const key in Sounds.audio) Sounds.audio[key].muted = false;
        Sounds.startAmbient();
    }
}
window.addEventListener("click", unlockAudio);
window.addEventListener("keydown", unlockAudio);

// ======================================================
// GAME ENTRY
// ======================================================
window.onload = () => {
    if (typeof THREE === "undefined") {
        console.error("THREE not loaded");
        return;
    }
    if (window.Sounds) Sounds.load();
};

// ======================================================
// START GAME
// ======================================================
function startGame() {
    console.log("START GAME");

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    scene.add(camera);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x888888, 1.2));

    createMap(scene);

    if (window.Zombies) Zombies.init(scene, GameSettings.maxZombies);
    if (window.Weapons) Weapons.init(camera, scene);

    const building = createSkyscraper(scene, {
        baseX: 200, baseZ: 20, floors: 10, width: 100, depth: 100, floorHeight: 30
    });
    createElevator(scene, building);

    // ======================================================
    // PLAYER STATE
    // ======================================================
    window.keys = { w: false, a: false, s: false, d: false };

    let isRunning = false;
    window.isRunning = false;

    let yaw = 0, pitch = 0;
    window.playerYaw = yaw;
    window.playerPitch = pitch;

    let walkSpeed = 0.48, runSpeed = 0.75;

    let playerPos = new THREE.Vector3(0, window.GROUND_Y, 0);
    window.playerPos = playerPos;
    lastPlayerPos.copy(playerPos);

    let lean = 0;
    window.lean = 0;

    let leanVisual = 0;

    window.PlayerStance = {
        state: "stand",
        heightStand: 10,
        heightCrouch: 6,
        heightProne: 3
    };

    let playerHeight = PlayerStance.heightStand;

    let velocityY = 0;
    const jumpForce = 0.35;
    let isGrounded = true;

    window.isKeyDownCtrl = false;

    canvas.addEventListener("click", () => {
        if (!GameState.running) return;
        canvas.requestPointerLock();
        unlockAudio();
    });

    // ======================================================
    // 🔥 SINGLE, CLEAN KEYDOWN HANDLER
    // ======================================================
    window.addEventListener("keydown", (e) => {
console.log("KEYDOWN RAW:", e.key);

        if (!GameState.running) return;

        const k = e.key.toLowerCase();

        // Toggle main door
        if (e.code === "KeyE") {
            mainDoorOpen = !mainDoorOpen;
        }

        // Grenade hold
        if (k === "g") {
            Weapons.handleKeyDown("g");
            return;
        }

        // Movement keys
        if (k in window.keys) window.keys[k] = true;

        // Running
        if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
            isRunning = true;
            window.isRunning = true;
        }

        // Jump
        if ((k === " " || k === "space") && isGrounded) {
            velocityY = jumpForce;
            isGrounded = false;
        }

        // Crouch / prone / stand
        if (k === "z") PlayerStance.state = "prone";
        if (k === "x") PlayerStance.state = "crouch";
        if (k === "c") PlayerStance.state = "stand";

        // Lean
        if (k === "q") { lean = -1; window.lean = -1; }
        if (k === "e") { lean = 1; window.lean = 1; }

        // Weapon switching
        if (k === "1") Weapons.activeWeapon = Weapons.weapons.AK47;
        if (k === "2") Weapons.activeWeapon = Weapons.weapons.GRENADE;

        // Forward to weapon
        if (window.Weapons) Weapons.handleKeyDown(e.key);
    });

    // ======================================================
    // 🔥 SINGLE, CLEAN KEYUP HANDLER
    // ======================================================
    window.addEventListener("keyup", (e) => {
        if (!GameState.running) return;

        const k = e.key.toLowerCase();

        // Grenade release
        if (k === "g") {
            Weapons.handleKeyUp("g");
            return;
        }

        if (k in window.keys) window.keys[k] = false;

        if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
            isRunning = false;
            window.isRunning = false;
        }

        if (k === "q" && lean === -1) { lean = 0; window.lean = 0; }
        if (k === "e" && lean === 1) { lean = 0; window.lean = 0; }

        if (window.Weapons) Weapons.handleKeyUp(e.key);
    });

    // ======================================================
    // MOUSE LOOK
    // ======================================================
    document.addEventListener("mousemove", (e) => {
        if (!GameState.running) return;
        if (document.pointerLockElement !== canvas) return;

        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-1.3, Math.min(1.3, pitch));

        window.playerYaw = yaw;
        window.playerPitch = pitch;
    });

    // ======================================================
    // MOUSE BUTTONS → WEAPONS
    // ======================================================
    window.addEventListener("mousedown", (e) => {
        if (!GameState.running) return;
        if (document.pointerLockElement !== canvas) return;
        if (e.target !== canvas) return;

        window.playerWantsToInteract = true;

        if (window.Weapons) Weapons.handleMouseDown(e.button);
    });

    window.addEventListener("mouseup", (e) => {
        if (!GameState.running) return;
        if (document.pointerLockElement !== canvas) return;
        if (e.target !== canvas) return;

        if (window.Weapons) Weapons.handleMouseUp(e.button);
    });

    // ======================================================
    // MOVEMENT UPDATE
    // ======================================================
  function updateMovement() {
    if (!GameState.running) return;

    let speed = isRunning ? runSpeed : walkSpeed;

    if (PlayerStance.state === "crouch") speed *= 0.6;
    if (PlayerStance.state === "prone") speed *= 0.35;

    if (
      PlayerStance.state === "stand" &&
      window.isKeyDownCtrl &&
      (keys.w || keys.a || keys.s || keys.d)
    ) {
      speed *= 0.45;
    }

    const targetHeight =
      PlayerStance.state === "stand"
        ? PlayerStance.heightStand
        : PlayerStance.state === "crouch"
        ? PlayerStance.heightCrouch
        : PlayerStance.state === "prone"
        ? PlayerStance.heightProne
        : PlayerStance.heightStand;

    playerHeight += (targetHeight - playerHeight) * 0.25;

    let moveX = 0;
    let moveZ = 0;

    if (keys.w) moveZ += 1;
    if (keys.s) moveZ -= 1;
    if (keys.a) moveX += 1;
    if (keys.d) moveX -= 1;

    const len = Math.hypot(moveX, moveZ);
    if (len > 0) {
      moveX /= len;
      moveZ /= len;
    }

    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const right = new THREE.Vector3(Math.sin(yaw + Math.PI / 2), 0, Math.cos(yaw + Math.PI / 2));

    const move = new THREE.Vector3();
    move.addScaledVector(forward, moveZ * speed);
    move.addScaledVector(right, moveX * speed);

    const oldPos = playerPos.clone();
    const newPos = playerPos.clone().add(move);

    const playerSize = { x: 2, y: 6, z: 2 };

    const resolved = applyCollision(oldPos, newPos, playerSize);
    playerPos.copy(resolved);

    let highestFloorBelow = -Infinity;

    for (const obj of window.SOLID_OBJECTS) {
      if (!obj.boundingBox) continue;

      obj.boundingBox.setFromObject(obj);

      const min = obj.boundingBox.min;
      const max = obj.boundingBox.max;

      const withinX = playerPos.x > min.x - 0.5 && playerPos.x < max.x + 0.5;
      const withinZ = playerPos.z > min.z - 0.5 && playerPos.z < max.z + 0.5;

      if (!withinX || !withinZ) continue;

      const floorY = max.y;

      if (floorY <= playerPos.y && floorY > highestFloorBelow) {
        highestFloorBelow = floorY;
      }
    }

    if (highestFloorBelow === -Infinity) {
      highestFloorBelow = window.GROUND_Y || 0;
    }

    const snapHeight = highestFloorBelow + 0.5;

    if (playerPos.y > snapHeight) {
      velocityY -= 0.35;
      if (velocityY < -1.2) velocityY = -1.2;

      playerPos.y += velocityY;
      isGrounded = false;
    } else {
      playerPos.y = snapHeight;
      velocityY = 0;
      isGrounded = true;
    }

    window.playerPos.copy(playerPos);

    if (move.length() > 0 && isGrounded) {
      if (Math.random() < 0.15 && window.Sounds) Sounds.playFootstep();
    }
  }

  function updateCamera() {
    if (!GameState.running) return;

    camera.position.set(
      playerPos.x,
      playerPos.y + playerHeight,
      playerPos.z
    );

    leanVisual += (lean - leanVisual) * 0.25;

    camera.position.x += leanVisual * 1.0;
    camera.rotation.z = leanVisual * 0.35;

    const lookDir = new THREE.Vector3(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(-pitch),
      Math.cos(yaw) * Math.cos(pitch)
    );

    camera.lookAt(camera.position.clone().add(lookDir));
  }

window.INPUT = { use: false };


    // ======================================================
    // RAYCAST FOR INTERACTION
    // ======================================================
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(0, 0);

    function getCrosshairHitObject() {
        if (!camera || !scene) return null;

        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(scene.children, true);

        if (hits.length > 0) return hits[0].object;
        return null;
    }

    // ======================================================
    // MAIN DOOR ANIMATION
    // ======================================================
    function updateMainDoorAnimation(deltaTime) {
        const door = scene.getObjectByName("mainEntranceDoor");
        if (!door) return;

        const speed = 2.5;

        if (mainDoorOpen) {
            mainDoorProgress = Math.min(1, mainDoorProgress + speed * deltaTime);
        } else {
            mainDoorProgress = Math.max(0, mainDoorProgress - speed * deltaTime);
        }

        const slideDist = 18;
        door.position.x = door.userData.baseX + mainDoorProgress * slideDist;

        updateSolidBounds(door);

        door.userData.isSolid = !(mainDoorProgress >= 1);
    }

function updateSolidBounds(obj) {
    if (!obj) return;
    if (!obj.geometry) return;

    obj.geometry.computeBoundingBox();
    obj.updateMatrixWorld(true);

    obj.userData.boundingBox = new THREE.Box3().setFromObject(obj);
}


    // ======================================================
    // GAME LOOP
    // ======================================================
    let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    if (!GameState.running) {
        renderer.render(scene, camera);
        return;
    }

    const now = performance.now();
    const deltaTime = (now - lastTime) / 1000;
    lastTime = now;

    estimatedPlayerVelocity.copy(playerPos).sub(lastPlayerPos);
    lastPlayerPos.copy(playerPos);

    if (window.Zombies && Zombies.list.length === 0) {
        GameOverlay.showWin();
        return;
    }
    if (playerHealth <= 0) {
        GameOverlay.showGameOver();
        return;
    }

    updateMovement(deltaTime);
    updateCamera(deltaTime);

    if (typeof updateDayNightCycle === "function") {
        updateDayNightCycle(deltaTime);
    }

    updateElevator(deltaTime);
    updateMainDoorAnimation(deltaTime);

    if (window.Weapons) Weapons.update(deltaTime);
    if (window.Zombies) Zombies.updateAll(playerPos, estimatedPlayerVelocity, deltaTime);

    if (healthEl) healthEl.innerText = "Health: " + playerHealth;

    renderer.render(scene, camera);
}
    animate();

    window.addEventListener("resize", () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });
}
