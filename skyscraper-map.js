// ======================================================
// ELEVATOR SOUNDS
// ======================================================

// Movement sound (plays continuously while elevator moves)
const elevatorMoveSound = new Audio("sounds/elevator.mp3");
elevatorMoveSound.volume = 0.7;
elevatorMoveSound.loop = true;

// Arrival ding sound (plays once when elevator reaches destination)
const elevatorDingSound = new Audio("sounds/elevator_floor.mp3");
elevatorDingSound.volume = 1.0;




// ======================================================
// TEXTURES
// ======================================================
const skyscraperTextureLoader = new THREE.TextureLoader();

const SKY_TEX = {
    wallPanel1: skyscraperTextureLoader.load("textures/skyscraper/wall_panel_01.jpg"),
    wallPanel2: skyscraperTextureLoader.load("textures/skyscraper/wall_panel_02.jpg"),
    wallPanel3: skyscraperTextureLoader.load("textures/skyscraper/wall_panel_03.jpg"),
    floor1Wall: skyscraperTextureLoader.load("textures/skyscraper/floor1_wall.jpg"),
    floor2Wall: skyscraperTextureLoader.load("textures/skyscraper/floor2_wall.jpg"),
    doorMain: skyscraperTextureLoader.load("textures/skyscraper/door_main.jpg"),
    doorElevator: skyscraperTextureLoader.load("textures/skyscraper/door_elevator.jpg"),
    windowGlass: skyscraperTextureLoader.load("textures/skyscraper/window_glass.jpg")
};

// ======================================================
// GLOBAL ELEVATOR STATE
// ======================================================
window.ELEVATOR_STATE = {
    cabin: null,
    cabinDoor: null,
    floorDoors: [],
    buttons: [],
    floors: 10,
    floorHeight: 30,
    currentFloor: 0,
    targetFloor: 0,
    speed: 10,
    moving: false,
    doorOpen: false,
    doorProgress: 0,
    shaftX: 0,
    shaftZ: 0
};

function setElevatorTargetFloor(floorIndex) {
    const s = window.ELEVATOR_STATE;
    s.targetFloor = THREE.MathUtils.clamp(floorIndex, 0, s.floors - 1);
    if (s.targetFloor !== s.currentFloor) {
        s.moving = true;
        s.doorOpen = false;
        s.doorProgress = 0;
    }
}

// ======================================================
// DETERMINISTIC "RANDOM" HELPER (NO SEED NEEDED)
// ======================================================
function skyRand(seed) {
    const x = Math.sin(seed * 127.1) * 43758.5453;
    return x - Math.floor(x);
}

// ======================================================
// SKYSCRAPER BUILDER (10 FLOORS, 100×100)
// Floor 1: sliding entrance → lobby, shaft on RIGHT
// ======================================================
function createSkyscraper(scene, opts = {}) {

    const {
        baseX = 200,
        baseZ = 20,
        floors = 10,
        width = 100,
        depth = 100,
        floorHeight = 30,
        wallThickness = 4
    } = opts;

    const group = new THREE.Group();
    group.name = "skyscraper";
    scene.add(group);

    const halfW = width / 2;
    const halfD = depth / 2;

    const genericWallMat = new THREE.MeshStandardMaterial({ color: 0x555555, map: SKY_TEX.wallPanel1 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

    const floor1WallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: SKY_TEX.floor1Wall });
    const floor2WallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: SKY_TEX.floor2Wall });

    const glassMat = new THREE.MeshStandardMaterial({
        color: 0x88bbff,
        map: SKY_TEX.windowGlass,
        transparent: true,
        opacity: 0.35,
        metalness: 0.1,
        roughness: 0.1,
        side: THREE.DoubleSide
    });

    const doorMainMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: SKY_TEX.doorMain });
    const doorElevatorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: SKY_TEX.doorElevator });

    const s = window.ELEVATOR_STATE;
    s.floors = floors;
    s.floorHeight = floorHeight;

    // Elevator shaft: bigger area on RIGHT side of building
    const shaftSize = 10; // was 4, now larger
    const shaftX = baseX + halfW - shaftSize * 2;
    const shaftZ = baseZ;

    s.shaftX = shaftX;
    s.shaftZ = shaftZ;

    for (let i = 0; i < floors; i++) {

        const y = i * floorHeight;

        // FLOOR (visual)
        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(width, 1, depth),
            floorMat
        );
        floor.position.set(baseX, y - 0.5, baseZ);
        group.add(floor);

        // CEILING (solid)
        const ceil = new THREE.Mesh(
            new THREE.BoxGeometry(width, 1, depth),
            ceilMat
        );
        ceil.position.set(baseX, y + floorHeight - 0.5, baseZ);
        group.add(ceil);
        window.registerSolidObject(ceil);

        // Choose wall material per floor
        let wallMat = genericWallMat;
        if (i === 0) wallMat = floor1WallMat;
        else if (i === 1) wallMat = floor2WallMat;

        // BACK WALL
        const backWall = new THREE.Mesh(
            new THREE.BoxGeometry(width, floorHeight, wallThickness),
            wallMat
        );
        backWall.position.set(baseX, y + floorHeight / 2, baseZ - halfD);
        group.add(backWall);
        window.registerSolidObject(backWall);

        // LEFT WALL
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, floorHeight, depth),
            wallMat
        );
        leftWall.position.set(baseX - halfW, y + floorHeight / 2, baseZ);
        group.add(leftWall);
        window.registerSolidObject(leftWall);

        // RIGHT WALL
        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, floorHeight, depth),
            wallMat
        );
        rightWall.position.set(baseX + halfW, y + floorHeight / 2, baseZ);
        group.add(rightWall);
        window.registerSolidObject(rightWall);

        // FRONT WALL / MAIN ENTRANCE (floor 1 only)
        if (i === 0) {
            const entranceWidth = 12;
            const segmentWidth = (width - entranceWidth) / 2;

            // FRONT LEFT
            const frontLeft = new THREE.Mesh(
                new THREE.BoxGeometry(segmentWidth, floorHeight, wallThickness),
                wallMat
            );
            frontLeft.position.set(
                baseX - (entranceWidth / 2 + segmentWidth / 2),
                y + floorHeight / 2,
                baseZ + halfD
            );
            group.add(frontLeft);
            window.registerSolidObject(frontLeft);

            // FRONT RIGHT
            const frontRight = new THREE.Mesh(
                new THREE.BoxGeometry(segmentWidth, floorHeight, wallThickness),
                wallMat
            );
            frontRight.position.set(
                baseX + (entranceWidth / 2 + segmentWidth / 2),
                y + floorHeight / 2,
                baseZ + halfD
            );
            group.add(frontRight);
            window.registerSolidObject(frontRight);

            // MAIN ENTRANCE SLIDING DOOR
            const entranceDoor = new THREE.Mesh(
                new THREE.BoxGeometry(entranceWidth, 14, 1),
                doorMainMat
            );
            entranceDoor.position.set(baseX, window.GROUND_Y + 7, baseZ + halfD + 0.5);
            entranceDoor.name = "mainEntranceDoor";
            scene.add(entranceDoor);
            window.registerSolidObject(entranceDoor);

entranceDoor.userData.baseX = entranceDoor.position.x;


        } else {
            // Upper floors: full front wall
            const frontWall = new THREE.Mesh(
                new THREE.BoxGeometry(width, floorHeight, wallThickness),
                wallMat
            );
            frontWall.position.set(baseX, y + floorHeight / 2, baseZ + halfD);
            group.add(frontWall);
            window.registerSolidObject(frontWall);
        }

        // ==================================================
        // ELEVATOR SHAFT DOOR (ONE PER FLOOR, INSIDE BUILDING)
        // ==================================================
        const floorDoor = new THREE.Mesh(
            new THREE.BoxGeometry(3, 14, 0.5),
            doorElevatorMat
        );

        floorDoor.position.set(
            shaftX - shaftSize / 2 - 0.25,
            window.GROUND_Y + y + 7,
            shaftZ
        );
        floorDoor.name = `elevatorFloorDoor_${i}`;
        scene.add(floorDoor);

        s.floorDoors[i] = floorDoor;

        // ==================================================
        // FUTURISTIC RANDOM WINDOWS (DETERMINISTIC PER FLOOR + WALL)
        // ==================================================
        const walls = ["front", "back", "left", "right"];
        walls.forEach((wallName, wallIndex) => {
            const baseSeed = i * 100 + wallIndex * 17;

            const count = 1 + Math.floor(skyRand(baseSeed + 1) * 4);

            for (let w = 0; w < count; w++) {
                const seed = baseSeed + w * 13;

                const wWidth = 6 + skyRand(seed + 2) * 10;
                const wHeight = 4 + skyRand(seed + 3) * 8;

                const centerY = window.GROUND_Y + y + 8 + skyRand(seed + 4) * (floorHeight - 16);

                let posX = baseX;
                let posZ = baseZ;
                let geo;
                let rotY = 0;

                if (wallName === "front") {
                    posZ = baseZ + halfD + 0.11; // slightly in front of wall
                    const span = width - 10;
                    const offset = -span / 2 + skyRand(seed + 5) * span;
                    posX = baseX + offset;
                    geo = new THREE.PlaneGeometry(wWidth, wHeight);
                    rotY = 0;
                } else if (wallName === "back") {
                    posZ = baseZ - halfD - 0.11;
                    const span = width - 10;
                    const offset = -span / 2 + skyRand(seed + 6) * span;
                    posX = baseX + offset;
                    geo = new THREE.PlaneGeometry(wWidth, wHeight);
                    rotY = Math.PI;
                } else if (wallName === "left") {
                    posX = baseX - halfW - 0.11;
                    const span = depth - 10;
                    const offset = -span / 2 + skyRand(seed + 7) * span;
                    posZ = baseZ + offset;
                    geo = new THREE.PlaneGeometry(wWidth, wHeight);
                    rotY = Math.PI / 2;
                } else { // right
                    posX = baseX + halfW + 0.11;
                    const span = depth - 10;
                    const offset = -span / 2 + skyRand(seed + 8) * span;
                    posZ = baseZ + offset;
                    geo = new THREE.PlaneGeometry(wWidth, wHeight);
                    rotY = -Math.PI / 2;
                }

                const windowMesh = new THREE.Mesh(geo, glassMat);
                windowMesh.position.set(posX, centerY, posZ);
                windowMesh.rotation.y = rotY;

                const tiltSeed = skyRand(seed + 9);
                if (tiltSeed > 0.7) {
                    windowMesh.rotation.z = (tiltSeed - 0.7) * 0.6;
                }

                scene.add(windowMesh);
            }
        });
    }

    return {
        group,
        baseX,
        baseZ,
        floors,
        floorHeight,
        width,
        depth,
        shaftX,
        shaftZ
    };
}
// ======================================================
// ELEVATOR SHAFT + BIG CABIN + DOUBLE SLIDING DOORS + UI
// ======================================================
function createElevator(scene, building) {

    console.log("UPDATED createElevator CALLED");

    const { shaftX, shaftZ, floorHeight, floors } = building;
    const s = window.ELEVATOR_STATE;

const shaftHeight = floors * floorHeight;
const beamSize = 3;
const shaftInner = 50;

const beamMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

// Offsets for the 4 corners of the shaft
const beamPositions = [
    [-shaftInner / 2, -shaftInner / 2],
    [ shaftInner / 2, -shaftInner / 2],
    [-shaftInner / 2,  shaftInner / 2],
    [ shaftInner / 2,  shaftInner / 2],
];

beamPositions.forEach(([bx, bz]) => {
    const beam = new THREE.Mesh(
        new THREE.BoxGeometry(beamSize, shaftHeight, beamSize),
        beamMat
    );

    beam.position.set(
        shaftX + bx,
        window.GROUND_Y + shaftHeight / 2,
        shaftZ + bz
    );

    scene.add(beam);

    // ⭐ MAKE THE BEAM SOLID
    window.registerSolidObject(beam);

    // ⭐ OPTIONAL: store bounding box for debugging
    beam.geometry.computeBoundingBox();
    beam.updateMatrixWorld(true);
});


    // ======================================================
    // CABIN (BIG, walkable)
// ======================================================
    const cabinSize = 38;
    const cabinHeight = 18;
    const halfSize = cabinSize / 2;
    const halfH = cabinHeight / 2;

    const cabin = new THREE.Group();
    cabin.name = "elevatorCabin";

    const cabinMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, map: SKY_TEX.wallPanel2 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x777777 });

    // BACK WALL
    const back = new THREE.Mesh(
        new THREE.BoxGeometry(cabinSize, cabinHeight, 1),
        cabinMat
    );
    back.position.set(0, 0, -halfSize);
    cabin.add(back);

    // LEFT WALL
    const left = new THREE.Mesh(
        new THREE.BoxGeometry(1, cabinHeight, cabinSize),
        cabinMat
    );
    left.position.set(-halfSize, 0, 0);
    cabin.add(left);

    // RIGHT WALL
    const right = new THREE.Mesh(
        new THREE.BoxGeometry(1, cabinHeight, cabinSize),
        cabinMat
    );
    right.position.set(halfSize, 0, 0);
    cabin.add(right);

    // CEILING
    const ceil = new THREE.Mesh(
        new THREE.BoxGeometry(cabinSize, 1, cabinSize),
        cabinMat
    );
    ceil.position.y = halfH;
    cabin.add(ceil);

    // FLOOR
    const floor = new THREE.Mesh(
        new THREE.BoxGeometry(cabinSize, 1, cabinSize),
        floorMat
    );
    floor.position.y = -halfH;
    cabin.add(floor);
    window.registerSolidObject(floor);

    // === Cabin sits on ground ===
    const startY = window.GROUND_Y + halfH;
    cabin.position.set(shaftX, startY, shaftZ + 4);
    scene.add(cabin);

    // ======================================================
    // DOUBLE SLIDING DOORS (LEFT + RIGHT)
// ======================================================
    const doorWidth = cabinSize * 0.45;
    const doorHeight = cabinHeight - 2;
    const doorThickness = 0.3;

    const doorMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: SKY_TEX.doorElevator
    });

    // LEFT DOOR PANEL
    const doorLeft = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness),
        doorMat
    );
    doorLeft.position.set(-doorWidth/2, 0, halfSize + 0.1);
    cabin.add(doorLeft);

    // RIGHT DOOR PANEL
    const doorRight = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness),
        doorMat
    );
    doorRight.position.set(doorWidth/2, 0, halfSize + 0.1);
    cabin.add(doorRight);

    s.cabinDoorLeft = doorLeft;
    s.cabinDoorRight = doorRight;
    s.doorProgress = 0;
    s.doorOpen = false;

    // ======================================================
    // UI PANEL + SCREEN
    // ======================================================
    const panel = new THREE.Group();
    panel.position.set(halfSize - 2, 0, -halfSize + 4);
    cabin.add(panel);

    const buttonMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    s.buttons = [];

    for (let i = 0; i < s.floors; i++) {
        const btn = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.6, 0.1),
            buttonMat.clone()
        );
        btn.position.set(0, -4 + i * 0.8, 0);
        btn.userData.floorIndex = i;
        panel.add(btn);
        s.buttons.push(btn);
    }

    // SCREEN
    const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 1.8),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.8 })
    );
    screen.position.set(halfSize - 2, 5, -halfSize + 4);
    cabin.add(screen);

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");

    const screenTex = new THREE.CanvasTexture(canvas);
    screen.material.map = screenTex;

    function updateScreenText(text) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "lime";
        ctx.font = "80px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        screenTex.needsUpdate = true;
    }

    s.selectedFloor = 0;
    s.screenUpdate = updateScreenText;
    updateScreenText("1");

    s.cabin = cabin;

    return cabin;
}

// ======================================================
// ELEVATOR UPDATE (TEMP SAFE STUB)
// ======================================================
function updateElevator(deltaTime) {
    const s = window.ELEVATOR_STATE;
    if (!s || !s.cabin) return;

    // TEMP: do nothing to avoid errors.
    // We will re‑implement movement + doors later.
}

// ======================================================
// TEMP: ARROW KEYS STILL UPDATE SELECTED FLOOR (NO MOVEMENT)
// ======================================================
window.addEventListener("keydown", (e) => {
    const s = window.ELEVATOR_STATE;
    if (!s || !s.cabin) return;

    if (e.key === "ArrowUp") {
        s.selectedFloor = Math.min(s.floors - 1, s.selectedFloor + 1);
        s.screenUpdate((s.selectedFloor + 1).toString());
    }

    if (e.key === "ArrowDown") {
        s.selectedFloor = Math.max(0, s.selectedFloor - 1);
        s.screenUpdate((s.selectedFloor + 1).toString());
    }
});

