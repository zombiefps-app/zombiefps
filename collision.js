// ======================================================
// GLOBAL SOLID OBJECT REGISTRATION (FIXED FOR r79)
// ======================================================
window.SOLID_OBJECTS = [];

/**
 * Registers ONLY true solid objects.
 * Groups are NOT auto-registered anymore.
 */
window.registerSolidObject = function (obj) {

    // DO NOT register groups automatically
    if (obj instanceof THREE.Group) return;

    if (!obj.geometry) return;

    // Compute bounding box
    obj.geometry.computeBoundingBox();
    obj.boundingBox = obj.geometry.boundingBox.clone();

    // Apply world transform
    obj.updateMatrixWorld(true);
    obj.boundingBox.applyMatrix4(obj.matrixWorld);

    // Compute size
    const min = obj.boundingBox.min;
    const max = obj.boundingBox.max;

    const sx = Math.abs(max.x - min.x);
    const sy = Math.abs(max.y - min.y);
    const sz = Math.abs(max.z - min.z);

    // Skip paper-thin objects (< 0.5)
    if (sx < 0.5 || sy < 0.5 || sz < 0.5) return;

    obj.isSolid = true;
    window.SOLID_OBJECTS.push(obj);
};


// ======================================================
// UPDATE WORLD-SPACE BOUNDING BOX (r79 SAFE)
// ======================================================
function updateWorldBox(obj) {
    obj.geometry.computeBoundingBox();
    obj.boundingBox = obj.geometry.boundingBox.clone();
    obj.updateMatrixWorld(true);
    obj.boundingBox.applyMatrix4(obj.matrixWorld);
}


// ======================================================
// AABB COLLISION CHECK
// ======================================================
window.checkCollision = function (pos, size) {

    const half = {
        x: size.x / 2,
        y: size.y / 2,
        z: size.z / 2
    };

    const box = new THREE.Box3(
        new THREE.Vector3(pos.x - half.x, pos.y - half.y, pos.z - half.z),
        new THREE.Vector3(pos.x + half.x, pos.y + half.y, pos.z + half.z)
    );

    for (const obj of window.SOLID_OBJECTS) {
        updateWorldBox(obj);

        if (box.intersectsBox(obj.boundingBox)) {
            return true;
        }
    }

    return false;
};


// ======================================================
// PROJECTILE COLLISION CHECK (POINT TEST)
// ======================================================
window.projectileHitsObject = function (pos) {
    const sphere = new THREE.Sphere(
        new THREE.Vector3(pos.x, pos.y, pos.z),
        2.0   // projectile radius
    );

    for (const obj of window.SOLID_OBJECTS) {
        updateWorldBox(obj);

        if (obj.boundingBox.intersectsSphere(sphere)) {
            return true;
        }
    }

    return false;
};



// ======================================================
// PLAYER COLLISION RESOLUTION (HORIZONTAL ONLY)
// ======================================================
window.applyCollision = function (oldPos, newPos, size) {

    // Try full movement
    if (!window.checkCollision(newPos, size)) {
        return newPos;
    }

    // Slide along X
    const tryX = new THREE.Vector3(newPos.x, oldPos.y, oldPos.z);
    if (!window.checkCollision(tryX, size)) {
        return tryX;
    }

    // Slide along Z
    const tryZ = new THREE.Vector3(oldPos.x, oldPos.y, newPos.z);
    if (!window.checkCollision(tryZ, size)) {
        return tryZ;
    }

    // Fully blocked
    return oldPos;
};
