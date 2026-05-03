// ======================================================
// GLOBAL LIGHT REFERENCES (needed for day/night cycle)
// ======================================================
let sun = null;
let hemi = null;
let moon = null;
let moonLight = null;
let sceneRef = null;

let timeOfDay = 0;
const daySpeed = 0.00005;

// ======================================================
// CREATE MAP
// ======================================================
function createMap(scene) {

  // REQUIRED for day/night system
  sceneRef = scene;

  const loader = new THREE.TextureLoader();

  // ======================================================
  // GLOBAL GROUND HEIGHT
  // ======================================================
  window.GROUND_Y = 3;

  // ======================================================
  // SKY + FOG
  // ======================================================
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 300, 3000); // FIXED: weaker fog

  // ======================================================
  // LIGHTING
  // ======================================================
  sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(300, 600, 300);
  sun.castShadow = true;

  const cam = sun.shadow.camera;
  cam.near = 10;
  cam.far = 800;
  cam.left = -300;
  cam.right = 300;
  cam.top = 300;
  cam.bottom = -300;

  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.1;

  scene.add(sun);

  hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
  scene.add(hemi);

  // ======================================================
  // SAFE TEXTURE LOADER
  // ======================================================
  function loadTex(path, rx = 1, ry = 1) {
    const tex = loader.load(
      path,
      (t) => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(rx, ry);
      },
      undefined,
      () => console.warn("Texture failed to load:", path)
    );
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(rx, ry);
    return tex;
  }

  // ======================================================
  // BASE GROUND
  // ======================================================
  const grassTex = loadTex("textures/grass.jpg", 120, 120);
  const grassMat = new THREE.MeshStandardMaterial({ map: grassTex });

  const grass = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = window.GROUND_Y - 0.05;
  grass.receiveShadow = true;
  scene.add(grass);

  // ======================================================
  // ROAD LOOP
  // ======================================================
  const pavementTex = loadTex("textures/pavement.jpg", 12, 12);
  const roadMat = new THREE.MeshStandardMaterial({ map: pavementTex });

  const roadOuter = new THREE.Mesh(new THREE.RingGeometry(260, 340, 32), roadMat);
  roadOuter.rotation.x = -Math.PI / 2;
  roadOuter.position.y = window.GROUND_Y + 0.02;
  roadOuter.receiveShadow = true;
  scene.add(roadOuter);

  // ======================================================
  // PLAZA
  // ======================================================
  const plazaTex = loadTex("textures/plaza.jpg", 10, 10);
  const plazaMat = new THREE.MeshStandardMaterial({ map: plazaTex });

  const plaza = new THREE.Mesh(new THREE.CircleGeometry(260, 32), plazaMat);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = window.GROUND_Y + 0.01;
  plaza.receiveShadow = true;
  scene.add(plaza);

  // ======================================================
  // SIDEWALKS
  // ======================================================
  const sidewalkTex = loadTex("textures/sidewalk.jpg", 8, 8);
  const sidewalkMat = new THREE.MeshStandardMaterial({ map: sidewalkTex });

  function addSidewalk(x, z, w, d) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.6, d), sidewalkMat);
    m.position.set(x, window.GROUND_Y + 0.3, z);
    m.receiveShadow = true;
    scene.add(m);
  }

  addSidewalk(-200, 0, 120, 20);
  addSidewalk(200, 0, 120, 20);
  addSidewalk(0, -200, 20, 120);
  addSidewalk(0, 200, 20, 120);

  // ======================================================
  // SAFE UV SCALER
  // ======================================================
  function scaleUV(mesh, sx, sy) {
    if (!mesh.geometry?.attributes?.uv) return;
    const uv = mesh.geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setX(i, uv.getX(i) * sx);
      uv.setY(i, uv.getY(i) * sy);
    }
    uv.needsUpdate = true;
  }

  // ======================================================
  // HOUSES
  // ======================================================
  const house1Mat = new THREE.MeshStandardMaterial({ map: loadTex("textures/house1.jpg", 2, 1) });
  const house2Mat = new THREE.MeshStandardMaterial({ map: loadTex("textures/house2.jpg", 2, 1) });
  const roofMat = new THREE.MeshStandardMaterial({ map: loadTex("textures/roof.jpg", 4, 4) });

  function addHouse(x, z, mat) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(80, 30, 60), mat);
    scaleUV(base, 2, 2);
    base.position.set(x, window.GROUND_Y + 15.05, z);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    window.registerSolidObject(base);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(60, 20, 60), roofMat);
    scaleUV(roof, 2, 2);
    roof.position.set(x, window.GROUND_Y + 40.1, z);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    roof.receiveShadow = true;
    scene.add(roof);
  }

  addHouse(-260, 0, house1Mat);
  addHouse(300, 0, house2Mat);

  // ======================================================
  // WATCHTOWER
  // ======================================================
  const towerMat = new THREE.MeshStandardMaterial({ map: loadTex("textures/tower.jpg", 2, 4) });

  const towerBase = new THREE.Mesh(new THREE.BoxGeometry(20, 80, 20), towerMat);
  towerBase.position.set(0, window.GROUND_Y + 40.05, -260);
  towerBase.castShadow = true;
  towerBase.receiveShadow = true;
  scene.add(towerBase);
  window.registerSolidObject(towerBase);

  const towerTop = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 40), towerMat);
  towerTop.position.set(0, window.GROUND_Y + 90.1, -260);
  towerTop.castShadow = true;
  towerTop.receiveShadow = true;
  scene.add(towerTop);
  window.registerSolidObject(towerTop);

  // ======================================================
  // VEHICLES
  // ======================================================
  const busMat = new THREE.MeshStandardMaterial({ map: loadTex("textures/bus.jpg") });
  const truckMat = new THREE.MeshStandardMaterial({ map: loadTex("textures/truck.jpg") });
  const jeepMat = new THREE.MeshStandardMaterial({ map: loadTex("textures/jeep.jpg") });

  function addVehicle(mat, w, h, d, x, z, rot) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    scaleUV(m, 2, 2);
    m.position.set(x, window.GROUND_Y + h / 2 + 0.05, z);
    m.rotation.y = rot;
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    window.registerSolidObject(m);
  }

  addVehicle(busMat, 90, 18, 24, 0, 260, Math.PI);
  addVehicle(truckMat, 70, 20, 26, -140, -230, Math.PI / 4);
  addVehicle(jeepMat, 40, 16, 22, 160, -230, -Math.PI / 4);

  // ======================================================
  // TELEPHONE POLES
  // ======================================================
  const poleMat = new THREE.MeshStandardMaterial({ map: loadTex("textures/wood_pole.jpg", 1, 4) });

  function addPole(x, z) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 50, 8), poleMat);
    pole.position.set(x, window.GROUND_Y + 25.05, z);
    pole.castShadow = true;
    pole.receiveShadow = true;
    scene.add(pole);
    window.registerSolidObject(pole);
  }

  addPole(-340, -200);
  addPole(-340, -80);
  addPole(-340, 40);
  addPole(-340, 160);
  addPole(-340, 280);

  // ======================================================
  // TREES
  // ======================================================
  const trunkMat = new THREE.MeshStandardMaterial({ map: loadTex("textures/bark.jpg") });
  const leavesMat = new THREE.MeshStandardMaterial({ map: loadTex("textures/leaves.jpg") });

  for (let i = 0; i < 40; i++) {
    const x = (Math.random() - 0.5) * 1800;
    const z = (Math.random() - 0.5) * 1800;
    if (Math.hypot(x, z) < 450) continue;

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 10, 8), trunkMat);
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(6, 12, 12), leavesMat);

    trunk.position.set(x, window.GROUND_Y + 5.05, z);
    leaves.position.set(x, window.GROUND_Y + 12.1, z);

    trunk.castShadow = true;
    leaves.castShadow = true;

    scene.add(trunk);
    scene.add(leaves);
    window.registerSolidObject(trunk);
  }

  // ======================================================
  // WATER
  // ======================================================
  const waterTex = loadTex("textures/water.jpg", 4, 4);
  const waterMat = new THREE.MeshStandardMaterial({
    map: waterTex,
    transparent: true,
    opacity: 0.6
  });

  const water = new THREE.Mesh(new THREE.PlaneGeometry(200, 120), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(380, window.GROUND_Y + 0.05, 260);
  water.receiveShadow = true;
  scene.add(water);

// ======================================================
// INIT DAY/NIGHT SYSTEM
// ======================================================
initDayNight(scene);
}

// ======================================================
// INIT DAY/NIGHT SYSTEM
// ======================================================
function initDayNight(scene) {
  sceneRef = scene;

  const moonTexture = new THREE.TextureLoader().load("textures/moon.jpg");

  moon = new THREE.Mesh(
    new THREE.SphereGeometry(40, 32, 32),
    new THREE.MeshStandardMaterial({
      map: moonTexture,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.0
    })
  );

  // Moon placed ABOVE fog so it stays visible even with original fog distances
  moon.position.set(0, 600, -800);
  scene.add(moon);

  moonLight = new THREE.DirectionalLight(0x88aaff, 0.0);
  moonLight.position.copy(moon.position);
  scene.add(moonLight);
}

// ======================================================
// UPDATE DAY/NIGHT CYCLE
// ======================================================
function updateDayNightCycle() {
  if (!sceneRef || !sun || !hemi) return;

  timeOfDay += daySpeed;
  if (timeOfDay > 1) timeOfDay = 0;

  const angle = timeOfDay * Math.PI * 2;
  const daylight = Math.max(0, Math.cos(angle));

  // SUN MOVEMENT (same as original)
  sun.position.set(
    Math.sin(angle) * 400,
    Math.cos(angle) * 400,
    200
  );

  sun.intensity = 0.2 + daylight * 1.2;
  hemi.intensity = 0.2 + daylight * 0.5;

  // MOON MOVEMENT (same behavior as original, but above fog)
  if (moon) {
    const moonAngle = angle + Math.PI;

    moon.position.set(
      Math.sin(moonAngle) * 1200,
      Math.cos(moonAngle) * 1200,
      600
    );

    const moonStrength = 1 - daylight;

    moon.material.emissiveIntensity = moonStrength * 0.8;

    if (moonLight) {
      moonLight.intensity = moonStrength * 0.6;
      moonLight.position.copy(moon.position);
    }
  }

  // SKY COLOR (identical to original inspected code)
  const skyDay = new THREE.Color(0x87ceeb);
  const skyNight = new THREE.Color(0x0a0a1a); // TRUE BLACK NIGHT
  sceneRef.background = skyNight.clone().lerp(skyDay, daylight);

  // FOG COLOR (identical to original inspected code)
  const fogDay = new THREE.Color(0x87ceeb);
  const fogNight = new THREE.Color(0x000000);
  sceneRef.fog.color = fogNight.clone().lerp(fogDay, daylight);
}

window.updateDayNightCycle = updateDayNightCycle;
window.createMap = createMap;
