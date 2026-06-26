/* ==========================================================================
   Grand Rose Chess — Premium 3D Product Showcase
   Three.js r128 + GSAP 3.12.5 + ScrollTrigger
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. CONSTANTS
   -------------------------------------------------------------------------- */

const BOARD_COLORS = {
  light: '#fff0f3',
  dark: '#e8627c',
  frame: '#f5e6ea',
  platform: '#fef0f3'
};

const PIECE_COLORS = {
  pink: { base: '#e8627c', metalness: 0.4, roughness: 0.28 },
  white: { base: '#f8f4f0', metalness: 0.15, roughness: 0.4 }
};

const CAMERA_STEPS = [
  { pos: [10, 12, 10], target: [0, 0, 0] },
  { pos: [5, 5, 8], target: [0, 0.5, 0] },
  { pos: [0, 18, 0.1], target: [0, 0, 0] },
  { pos: [-3, 4, 10], target: [0, 1, 0] },
  { pos: [12, 14, 12], target: [0, 0, 0] }
];

const TILE_SIZE = 1.2;

const INITIAL_PIECES = [
  // White pieces — rows 0-1
  { type: 'rook',   color: 'white', row: 0, col: 0 },
  { type: 'knight', color: 'white', row: 0, col: 1 },
  { type: 'bishop', color: 'white', row: 0, col: 2 },
  { type: 'queen',  color: 'white', row: 0, col: 3 },
  { type: 'king',   color: 'white', row: 0, col: 4 },
  { type: 'bishop', color: 'white', row: 0, col: 5 },
  { type: 'knight', color: 'white', row: 0, col: 6 },
  { type: 'rook',   color: 'white', row: 0, col: 7 },
  { type: 'pawn',   color: 'white', row: 1, col: 0 },
  { type: 'pawn',   color: 'white', row: 1, col: 1 },
  { type: 'pawn',   color: 'white', row: 1, col: 2 },
  { type: 'pawn',   color: 'white', row: 1, col: 3 },
  { type: 'pawn',   color: 'white', row: 1, col: 4 },
  { type: 'pawn',   color: 'white', row: 1, col: 5 },
  { type: 'pawn',   color: 'white', row: 1, col: 6 },
  { type: 'pawn',   color: 'white', row: 1, col: 7 },
  // Pink pieces — rows 6-7
  { type: 'pawn',   color: 'pink', row: 6, col: 0 },
  { type: 'pawn',   color: 'pink', row: 6, col: 1 },
  { type: 'pawn',   color: 'pink', row: 6, col: 2 },
  { type: 'pawn',   color: 'pink', row: 6, col: 3 },
  { type: 'pawn',   color: 'pink', row: 6, col: 4 },
  { type: 'pawn',   color: 'pink', row: 6, col: 5 },
  { type: 'pawn',   color: 'pink', row: 6, col: 6 },
  { type: 'pawn',   color: 'pink', row: 6, col: 7 },
  { type: 'rook',   color: 'pink', row: 7, col: 0 },
  { type: 'knight', color: 'pink', row: 7, col: 1 },
  { type: 'bishop', color: 'pink', row: 7, col: 2 },
  { type: 'queen',  color: 'pink', row: 7, col: 3 },
  { type: 'king',   color: 'pink', row: 7, col: 4 },
  { type: 'bishop', color: 'pink', row: 7, col: 5 },
  { type: 'knight', color: 'pink', row: 7, col: 6 },
  { type: 'rook',   color: 'pink', row: 7, col: 7 }
];

/* --------------------------------------------------------------------------
   2. GLOBAL STATE
   -------------------------------------------------------------------------- */

let renderer, scene, camera, clock;
let boardGroup, piecesGroup, lightGroup, platformGroup;
let pieces = [];
let queenSpotlight = null;
let isInShowcase = false;
let scrollProgress = 0;

/* --------------------------------------------------------------------------
   3. HELPER — Board Coordinate Conversion
   -------------------------------------------------------------------------- */

function boardToWorld(row, col) {
  const offset = (7 * TILE_SIZE) / 2;
  return {
    x: col * TILE_SIZE - offset,
    z: row * TILE_SIZE - offset
  };
}

/* --------------------------------------------------------------------------
   4. MATERIAL FACTORY
   -------------------------------------------------------------------------- */

function getMaterial(color) {
  if (color === 'pink') {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(PIECE_COLORS.pink.base),
      metalness: PIECE_COLORS.pink.metalness,
      roughness: PIECE_COLORS.pink.roughness,
      emissive: new THREE.Color('#e8627c'),
      emissiveIntensity: 0.05
    });
  }
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(PIECE_COLORS.white.base),
    metalness: PIECE_COLORS.white.metalness,
    roughness: PIECE_COLORS.white.roughness
  });
}

/* --------------------------------------------------------------------------
   5. PIECE FACTORIES — Procedural Geometry
   -------------------------------------------------------------------------- */

function createPawn(color) {
  const group = new THREE.Group();
  const mat = getMaterial(color);

  // Base disc
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.38, 0.12, 24),
    mat
  );
  base.position.y = 0.06;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Tapered stem
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.26, 0.55, 20),
    mat
  );
  stem.position.y = 0.4;
  stem.castShadow = true;
  group.add(stem);

  // Collar ring
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.04, 10, 24),
    mat
  );
  collar.position.y = 0.52;
  collar.rotation.x = Math.PI / 2;
  collar.castShadow = true;
  group.add(collar);

  // Sphere top
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 20, 20),
    mat
  );
  sphere.position.y = 0.74;
  sphere.castShadow = true;
  group.add(sphere);

  return group;
}

function createRook(color) {
  const group = new THREE.Group();
  const mat = getMaterial(color);

  // Base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.42, 0.14, 24),
    mat
  );
  base.position.y = 0.07;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Tower body
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.32, 0.7, 20),
    mat
  );
  body.position.y = 0.49;
  body.castShadow = true;
  group.add(body);

  // Top ring
  const ring = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.28, 0.1, 24),
    mat
  );
  ring.position.y = 0.89;
  ring.castShadow = true;
  group.add(ring);

  // Battlements
  for (let i = 0; i < 4; i++) {
    const merlon = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.18, 0.14),
      mat
    );
    const angle = (i / 4) * Math.PI * 2;
    merlon.position.set(
      Math.cos(angle) * 0.22,
      1.03,
      Math.sin(angle) * 0.22
    );
    merlon.castShadow = true;
    group.add(merlon);
  }

  return group;
}

function createKnight(color) {
  const group = new THREE.Group();
  const mat = getMaterial(color);

  // Base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.4, 0.14, 24),
    mat
  );
  base.position.y = 0.07;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Neck
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.28, 0.5, 18),
    mat
  );
  neck.position.y = 0.39;
  neck.castShadow = true;
  group.add(neck);

  // Angled head
  const head = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.2, 0.45, 16),
    mat
  );
  head.position.set(0.08, 0.76, 0);
  head.rotation.z = -0.35;
  head.castShadow = true;
  group.add(head);

  // Snout
  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.16, 0.18),
    mat
  );
  snout.position.set(0.28, 0.78, 0);
  snout.rotation.z = -0.2;
  snout.castShadow = true;
  group.add(snout);

  // Ear
  const ear = new THREE.Mesh(
    new THREE.ConeGeometry(0.06, 0.18, 10),
    mat
  );
  ear.position.set(0.02, 1.04, 0);
  ear.rotation.z = 0.15;
  ear.castShadow = true;
  group.add(ear);

  return group;
}

function createBishop(color) {
  const group = new THREE.Group();
  const mat = getMaterial(color);

  // Base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.4, 0.14, 24),
    mat
  );
  base.position.y = 0.07;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Tapered body
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.3, 0.65, 20),
    mat
  );
  body.position.y = 0.465;
  body.castShadow = true;
  group.add(body);

  // Mitre cone
  const mitre = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.4, 20),
    mat
  );
  mitre.position.y = 0.99;
  mitre.castShadow = true;
  group.add(mitre);

  // Tip sphere
  const tip = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 16, 16),
    mat
  );
  tip.position.y = 1.22;
  tip.castShadow = true;
  group.add(tip);

  return group;
}

function createQueen(color) {
  const group = new THREE.Group();
  const mat = getMaterial(color);

  // Base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.44, 0.14, 24),
    mat
  );
  base.position.y = 0.07;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Body sphere
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.6),
    mat
  );
  body.position.y = 0.3;
  body.castShadow = true;
  group.add(body);

  // Stem
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.2, 0.6, 20),
    mat
  );
  stem.position.y = 0.62;
  stem.castShadow = true;
  group.add(stem);

  // Crown cone
  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.35, 20),
    mat
  );
  crown.position.y = 1.1;
  crown.castShadow = true;
  group.add(crown);

  // Jewel (emissive pink)
  const jewelMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e8627c'),
    emissive: new THREE.Color('#e8627c'),
    emissiveIntensity: 0.4,
    metalness: 0.6,
    roughness: 0.2
  });
  const jewel = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 16),
    jewelMat
  );
  jewel.position.y = 1.32;
  jewel.castShadow = true;
  group.add(jewel);

  return group;
}

function createKing(color) {
  const group = new THREE.Group();
  const mat = getMaterial(color);

  // Base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.46, 0.14, 24),
    mat
  );
  base.position.y = 0.07;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Body cylinder
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.34, 0.6, 20),
    mat
  );
  body.position.y = 0.44;
  body.castShadow = true;
  group.add(body);

  // Collar
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.05, 10, 24),
    mat
  );
  collar.position.y = 0.74;
  collar.rotation.x = Math.PI / 2;
  collar.castShadow = true;
  group.add(collar);

  // Upper taper
  const upper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.2, 0.45, 18),
    mat
  );
  upper.position.y = 0.97;
  upper.castShadow = true;
  group.add(upper);

  // Cross — vertical
  const crossV = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.3, 0.06),
    mat
  );
  crossV.position.y = 1.35;
  crossV.castShadow = true;
  group.add(crossV);

  // Cross — horizontal
  const crossH = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.06, 0.06),
    mat
  );
  crossH.position.y = 1.38;
  crossH.castShadow = true;
  group.add(crossH);

  return group;
}

/* --------------------------------------------------------------------------
   6. PIECE BUILDER MAP
   -------------------------------------------------------------------------- */

const PIECE_FACTORIES = {
  pawn: createPawn,
  rook: createRook,
  knight: createKnight,
  bishop: createBishop,
  queen: createQueen,
  king: createKing
};

/* --------------------------------------------------------------------------
   7. BUILD BOARD
   -------------------------------------------------------------------------- */

function buildBoard() {
  boardGroup = new THREE.Group();

  // Frame — slightly larger box behind tiles
  const boardWidth = 8 * TILE_SIZE;
  const frameGeo = new THREE.BoxGeometry(boardWidth + 0.4, 0.16, boardWidth + 0.4);
  const frameMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(BOARD_COLORS.frame),
    metalness: 0.1,
    roughness: 0.5
  });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.y = -0.01;
  frame.receiveShadow = true;
  boardGroup.add(frame);

  // 8×8 tiles
  const tileGeo = new THREE.BoxGeometry(TILE_SIZE * 0.96, 0.15, TILE_SIZE * 0.96);

  const lightMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(BOARD_COLORS.light),
    metalness: 0.15,
    roughness: 0.55
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(BOARD_COLORS.dark),
    metalness: 0.25,
    roughness: 0.4
  });

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isLight = (row + col) % 2 === 0;
      const tile = new THREE.Mesh(tileGeo, isLight ? lightMat : darkMat);
      const pos = boardToWorld(row, col);
      tile.position.set(pos.x, 0.075, pos.z);
      tile.receiveShadow = true;
      boardGroup.add(tile);
    }
  }

  scene.add(boardGroup);
}

/* --------------------------------------------------------------------------
   8. BUILD ALL PIECES
   -------------------------------------------------------------------------- */

function buildAllPieces() {
  piecesGroup = new THREE.Group();

  INITIAL_PIECES.forEach((def) => {
    const factory = PIECE_FACTORIES[def.type];
    if (!factory) return;

    const mesh = factory(def.color);
    const pos = boardToWorld(def.row, def.col);
    mesh.position.set(pos.x, -1, pos.z); // Start below board
    mesh.scale.set(0, 0, 0); // Start invisible

    // Pink pieces face opposite direction
    if (def.color === 'pink') {
      mesh.rotation.y = Math.PI;
    }

    piecesGroup.add(mesh);

    pieces.push({
      mesh,
      type: def.type,
      color: def.color,
      row: def.row,
      col: def.col
    });
  });

  boardGroup.add(piecesGroup);
}

/* --------------------------------------------------------------------------
   9. LIGHTING — Studio Setup
   -------------------------------------------------------------------------- */

function setupLighting() {
  lightGroup = new THREE.Group();

  // Hemisphere — general ambient fill
  const hemi = new THREE.HemisphereLight(
    new THREE.Color('#ffffff'),
    new THREE.Color('#fef0f3'),
    0.7
  );
  lightGroup.add(hemi);

  // Main key light (directional, casts shadows)
  const key = new THREE.DirectionalLight(new THREE.Color('#ffffff'), 1.2);
  key.position.set(8, 15, 8);
  key.castShadow = true;
  key.shadow.mapSize.width = 2048;
  key.shadow.mapSize.height = 2048;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 50;
  key.shadow.bias = -0.001;
  key.shadow.camera.left = -12;
  key.shadow.camera.right = 12;
  key.shadow.camera.top = 12;
  key.shadow.camera.bottom = -12;
  lightGroup.add(key);

  // Pink fill light
  const fill = new THREE.PointLight(new THREE.Color('#f9a8b8'), 0.6, 40);
  fill.position.set(-5, 10, -5);
  lightGroup.add(fill);

  // Rim light
  const rim = new THREE.PointLight(new THREE.Color('#ffffff'), 0.4, 30);
  rim.position.set(0, 8, -10);
  lightGroup.add(rim);

  // Queen spotlight — starts at intensity 0, animated during assembly
  queenSpotlight = new THREE.SpotLight(
    new THREE.Color('#f9a8b8'),
    0,
    30,
    0.3,
    0.6,
    1
  );
  queenSpotlight.position.set(0, 8, 0);
  queenSpotlight.target.position.set(0, 0, 0);
  lightGroup.add(queenSpotlight);
  lightGroup.add(queenSpotlight.target);

  scene.add(lightGroup);
}

/* --------------------------------------------------------------------------
   10. PLATFORM
   -------------------------------------------------------------------------- */

function buildPlatform() {
  platformGroup = new THREE.Group();

  // Main circular platform
  const platGeo = new THREE.CylinderGeometry(7.5, 8, 0.2, 64);
  const platMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(BOARD_COLORS.platform),
    metalness: 0.1,
    roughness: 0.6
  });
  const platform = new THREE.Mesh(platGeo, platMat);
  platform.position.y = -0.25;
  platform.receiveShadow = true;
  platformGroup.add(platform);

  // Subtle pink edge ring
  const ringGeo = new THREE.TorusGeometry(7.8, 0.05, 8, 64);
  const ringMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f9a8b8'),
    emissive: new THREE.Color('#f9a8b8'),
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.5
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = -0.15;
  ring.rotation.x = Math.PI / 2;
  platformGroup.add(ring);

  scene.add(platformGroup);
}

/* --------------------------------------------------------------------------
   11. PIECE ASSEMBLY ANIMATION
   -------------------------------------------------------------------------- */

function getPiecePriority(type) {
  const priorities = { pawn: 0, rook: 1, knight: 2, bishop: 3, queen: 4, king: 5 };
  return priorities[type] !== undefined ? priorities[type] : 3;
}

function playAssemblyAnimation() {
  // Sort: pawns first, then rooks, knights, bishops, queen, king
  // Within same type, alternate white / pink
  const sorted = [...pieces].sort((a, b) => {
    const pa = getPiecePriority(a.type);
    const pb = getPiecePriority(b.type);
    if (pa !== pb) return pa - pb;
    // Alternate colors within type
    if (a.color !== b.color) return a.color === 'white' ? -1 : 1;
    return a.col - b.col;
  });

  sorted.forEach((piece, i) => {
    const delay = i * 0.08;
    const targetY = 0.08;

    const tl = gsap.timeline({ delay });

    // Scale up
    tl.to(piece.mesh.scale, {
      x: 1, y: 1, z: 1,
      duration: 0.5,
      ease: 'back.out(1.4)'
    }, 0);

    // Rise into position
    tl.to(piece.mesh.position, {
      y: targetY,
      duration: 0.6,
      ease: 'power2.out'
    }, 0);

    // Knights spin during appearance
    if (piece.type === 'knight') {
      const baseY = piece.color === 'pink' ? Math.PI : 0;
      tl.to(piece.mesh.rotation, {
        y: baseY + Math.PI * 2,
        duration: 1,
        ease: 'power2.inOut'
      }, 0);
    }
  });

  // Queen spotlight reveal
  const queenDelay = sorted.length * 0.08 - 0.3;
  if (queenSpotlight) {
    gsap.to(queenSpotlight, {
      intensity: 1.5,
      duration: 1,
      delay: queenDelay,
      ease: 'power2.inOut'
    });
    gsap.to(queenSpotlight, {
      intensity: 0,
      duration: 1,
      delay: queenDelay + 2,
      ease: 'power2.inOut'
    });
  }
}

/* --------------------------------------------------------------------------
   12. CAMERA ANIMATION (Scroll-Driven)
   -------------------------------------------------------------------------- */

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function updateCameraFromScroll(progress) {
  const totalSteps = CAMERA_STEPS.length;
  const scaled = progress * (totalSteps - 1);
  const index = Math.floor(scaled);
  const rawT = scaled - index;
  const t = smoothstep(rawT);

  const from = CAMERA_STEPS[Math.min(index, totalSteps - 1)];
  const to = CAMERA_STEPS[Math.min(index + 1, totalSteps - 1)];

  // Lerp position
  camera.position.x = from.pos[0] + (to.pos[0] - from.pos[0]) * t;
  camera.position.y = from.pos[1] + (to.pos[1] - from.pos[1]) * t;
  camera.position.z = from.pos[2] + (to.pos[2] - from.pos[2]) * t;

  // Lerp target
  const tx = from.target[0] + (to.target[0] - from.target[0]) * t;
  const ty = from.target[1] + (to.target[1] - from.target[1]) * t;
  const tz = from.target[2] + (to.target[2] - from.target[2]) * t;
  camera.lookAt(tx, ty, tz);
}

/* --------------------------------------------------------------------------
   13. FEATURE TEXT VISIBILITY
   -------------------------------------------------------------------------- */

function updateFeatureVisibility(progress) {
  const features = document.querySelectorAll('.showcase__feature');
  if (!features.length) return;

  const stepSize = 1 / features.length;

  features.forEach((el, i) => {
    const start = i * stepSize;
    const end = (i + 1) * stepSize;
    const mid = (start + end) / 2;

    let opacity = 0;
    if (progress >= start && progress <= end) {
      if (progress < mid) {
        opacity = (progress - start) / (mid - start);
      } else {
        opacity = 1 - (progress - mid) / (end - mid);
      }
    }

    opacity = Math.max(0, Math.min(1, opacity));

    el.style.opacity = opacity;
    el.style.transform = 'translateY(' + (-50 + (1 - opacity) * 20) + '%)';
    if (opacity > 0.1) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
}

/* --------------------------------------------------------------------------
   14. GSAP SCROLLTRIGGER SETUP
   -------------------------------------------------------------------------- */

function setupScrollTrigger() {
  gsap.registerPlugin(ScrollTrigger);

  // Showcase section — pins the 3D scene and drives camera
  ScrollTrigger.create({
    trigger: '#showcase',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: function (self) {
      scrollProgress = self.progress;
      isInShowcase = true;
      updateCameraFromScroll(self.progress);
      updateFeatureVisibility(self.progress);
    },
    onLeave: function () {
      isInShowcase = false;
    },
    onEnterBack: function () {
      isInShowcase = true;
    },
    onLeaveBack: function () {
      isInShowcase = false;
    }
  });

  // Canvas fade-out when reaching the products section
  ScrollTrigger.create({
    trigger: '#products',
    start: 'top 80%',
    end: 'top 20%',
    onUpdate: function (self) {
      var canvas = document.getElementById('chess-canvas');
      if (canvas) {
        canvas.style.opacity = 1 - self.progress;
      }
    }
  });
}

/* --------------------------------------------------------------------------
   15. NAVBAR SCROLL EFFECT
   -------------------------------------------------------------------------- */

function setupNavbarScroll() {
  window.addEventListener('scroll', function () {
    var navbar = document.getElementById('navbar');
    if (!navbar) return;
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });
}

/* --------------------------------------------------------------------------
   16. PRODUCT CARD HOVER TILT
   -------------------------------------------------------------------------- */

function setupProductCardTilt() {
  document.querySelectorAll('.product-card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform =
        'perspective(1000px) rotateY(' + (x * 8) + 'deg) rotateX(' + (-y * 8) + 'deg) translateY(-8px)';
    });

    card.addEventListener('mouseleave', function () {
      card.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) translateY(0)';
      card.style.transition = 'transform 0.5s ease';
    });

    card.addEventListener('mouseenter', function () {
      card.style.transition = 'transform 0.1s ease';
    });
  });
}

/* --------------------------------------------------------------------------
   17. SMOOTH SCROLL FOR NAV LINKS
   -------------------------------------------------------------------------- */

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      var href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      var target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Close mobile menu if open
        var navMenu = document.getElementById('navbar-menu');
        var hamburger = document.getElementById('hamburger');
        if (navMenu) navMenu.classList.remove('visible');
        if (hamburger) {
          hamburger.classList.remove('active');
          hamburger.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });
}

/* --------------------------------------------------------------------------
   18. HAMBURGER MENU TOGGLE
   -------------------------------------------------------------------------- */

function setupHamburger() {
  var hamburger = document.getElementById('hamburger');
  var navMenu = document.getElementById('navbar-menu');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', function () {
      navMenu.classList.toggle('visible');
      hamburger.classList.toggle('active');
      hamburger.setAttribute(
        'aria-expanded',
        hamburger.classList.contains('active').toString()
      );
    });
  }
}

/* --------------------------------------------------------------------------
   19. SCROLL REVEAL (IntersectionObserver)
   -------------------------------------------------------------------------- */

function setupScrollReveal() {
  var revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach(function (el) {
    observer.observe(el);
  });
}

/* --------------------------------------------------------------------------
   20. RESIZE HANDLER
   -------------------------------------------------------------------------- */

function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/* --------------------------------------------------------------------------
   21. ANIMATION LOOP
   -------------------------------------------------------------------------- */

function animate() {
  requestAnimationFrame(animate);

  var elapsed = clock.getElapsedTime();

  // Slow auto-rotation when NOT in showcase scroll
  if (!isInShowcase && boardGroup) {
    boardGroup.rotation.y += 0.002;
  }

  // Subtle board breathing
  if (boardGroup) {
    boardGroup.position.y = Math.sin(elapsed * 0.5) * 0.03;
  }

  renderer.render(scene, camera);
}

/* --------------------------------------------------------------------------
   22. INIT — Entry Point
   -------------------------------------------------------------------------- */

function init() {
  var canvas = document.getElementById('chess-canvas');
  if (!canvas) {
    console.error('Grand Rose Chess: #chess-canvas not found.');
    return;
  }

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  renderer.outputEncoding = THREE.sRGBEncoding;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#ffffff');

  // Camera
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(12, 14, 12);
  camera.lookAt(0, 0, 0);

  // Clock
  clock = new THREE.Clock();

  // Build 3D world
  buildBoard();
  buildAllPieces();
  setupLighting();
  buildPlatform();

  // GSAP ScrollTrigger
  setupScrollTrigger();

  // UI Interactions
  setupNavbarScroll();
  setupProductCardTilt();
  setupSmoothScroll();
  setupHamburger();
  setupScrollReveal();

  // Resize
  window.addEventListener('resize', onWindowResize, false);

  // Start render loop
  animate();
}

/* --------------------------------------------------------------------------
   23. PRELOADER & KICKOFF
   -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', function () {
  init();

  var preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(function () {
      gsap.to(preloader, {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.inOut',
        onComplete: function () {
          preloader.style.display = 'none';
          playAssemblyAnimation();
        }
      });
    }, 2500);
  } else {
    // No preloader — play immediately
    playAssemblyAnimation();
  }
});
