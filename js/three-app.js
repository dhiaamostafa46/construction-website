// Upgraded 3D Visualizations using Three.js with mode switching - Coohom BIM Edition

document.addEventListener('DOMContentLoaded', () => {
    initHero3D();
});

// Global state for modal canvases to manage resizing and memory cleanup
let activeModalRenderers = {};

/**
 * Initializes the premium 3D Coohom-style BIM Extruder & Laser Render Sweep in the Hero Section
 */
function initHero3D() {
    const container = document.getElementById('hero-canvas-container');
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || !container) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02050e, 0.0035);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 9, 25);
    camera.lookAt(0, 2.5, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.localClippingEnabled = true; // CRITICAL: Enables clipping planes locally for our render sweep!

    // Lights
    const ambientLight = new THREE.AmbientLight(0x0f1c34, 1.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xd4af37, 3.5); // Rich Gold Light
    dirLight1.position.set(15, 25, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x0077ff, 2.5); // Deep Blue Counter Light
    dirLight2.position.set(-15, 10, -15);
    scene.add(dirLight2);

    // Main Group to hold the villa and its components (will tilt and rotate)
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Subgroups for mode switching
    const solidGlassGroup = new THREE.Group();
    const wireframeGroup = new THREE.Group();
    mainGroup.add(solidGlassGroup);
    mainGroup.add(wireframeGroup);

    // 1. Defining clipping planes for the render sweep
    // solidClipPlane will render meshes only when x <= constant (on the left of the scanner)
    const solidClipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
    // wireframeClipPlane will render wireframe lines only when x >= constant (on the right of the scanner)
    const wireframeClipPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);

    // Materials
    const goldMetalMaterial = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.15,
        metalness: 0.9,
        clippingPlanes: [solidClipPlane]
    });
    const blueGlassMaterial = new THREE.MeshStandardMaterial({
        color: 0x0077ff,
        roughness: 0.05,
        metalness: 0.95,
        transparent: true,
        opacity: 0.45,
        clippingPlanes: [solidClipPlane]
    });
    const wallSolidMaterial = new THREE.MeshStandardMaterial({
        color: 0x111e38,
        roughness: 0.5,
        metalness: 0.2,
        transparent: true,
        opacity: 0.9,
        clippingPlanes: [solidClipPlane]
    });
    const baseSolidMaterial = new THREE.MeshStandardMaterial({
        color: 0x0a1424,
        roughness: 0.7,
        metalness: 0.3,
        clippingPlanes: [solidClipPlane]
    });

    // Wireframe Materials
    const cyanWireMaterial = new THREE.LineBasicMaterial({
        color: 0x00d2ff,
        transparent: true,
        opacity: 0.75,
        clippingPlanes: [wireframeClipPlane]
    });
    const goldWireMaterial = new THREE.LineBasicMaterial({
        color: 0xd4af37,
        transparent: true,
        opacity: 0.95,
        linewidth: 1.5,
        clippingPlanes: [wireframeClipPlane]
    });

    // 2. Define Modernist Villa Components
    const components = [];

    // Base Slab
    components.push({
        geom: new THREE.BoxGeometry(7.0, 0.2, 5.5),
        pos: new THREE.Vector3(0, 0.1, 0),
        type: 'base'
    });

    // Back Wall (H = 3.5)
    components.push({
        geom: new THREE.BoxGeometry(6.6, 3.5, 0.25),
        pos: new THREE.Vector3(0, 1.75, -2.5),
        type: 'wall',
        height: 3.5
    });

    // Left Wall (H = 3.5)
    components.push({
        geom: new THREE.BoxGeometry(0.25, 3.5, 5.0),
        pos: new THREE.Vector3(-3.2, 1.75, 0),
        type: 'wall',
        height: 3.5
    });

    // Front Partition Wall (H = 3.5)
    components.push({
        geom: new THREE.BoxGeometry(2.5, 3.5, 0.25),
        pos: new THREE.Vector3(1.975, 1.75, 2.5),
        type: 'wall',
        height: 3.5
    });

    // Interior Wall (H = 3.5)
    components.push({
        geom: new THREE.BoxGeometry(0.25, 3.5, 2.5),
        pos: new THREE.Vector3(0.5, 1.75, -1.25),
        type: 'wall',
        height: 3.5
    });

    // Column 1 (H = 3.5)
    components.push({
        geom: new THREE.CylinderGeometry(0.08, 0.08, 3.5, 12),
        pos: new THREE.Vector3(3.2, 1.75, 2.5),
        type: 'column',
        height: 3.5
    });

    // Column 2 (H = 3.5)
    components.push({
        geom: new THREE.CylinderGeometry(0.08, 0.08, 3.5, 12),
        pos: new THREE.Vector3(-3.2, 1.75, 2.5),
        type: 'column',
        height: 3.5
    });

    // Front Window Glass (H = 3.2)
    components.push({
        geom: new THREE.BoxGeometry(3.5, 3.2, 0.08),
        pos: new THREE.Vector3(-1.0, 1.6, 2.5),
        type: 'window',
        height: 3.2
    });

    // Right Side Window Glass (H = 3.2)
    components.push({
        geom: new THREE.BoxGeometry(0.08, 3.2, 3.5),
        pos: new THREE.Vector3(3.2, 1.6, 0),
        type: 'window',
        height: 3.2
    });

    // Overhanging Roof Canopy (Flat roof)
    components.push({
        geom: new THREE.BoxGeometry(7.4, 0.2, 5.7),
        pos: new THREE.Vector3(0, 3.6, 0),
        type: 'roof'
    });

    // Sofa Base
    components.push({
        geom: new THREE.BoxGeometry(2.0, 0.4, 0.9),
        pos: new THREE.Vector3(-1.5, 0.3, -0.5),
        type: 'furniture'
    });

    // Sofa Backrest
    components.push({
        geom: new THREE.BoxGeometry(2.0, 0.7, 0.25),
        pos: new THREE.Vector3(-1.5, 0.65, -0.95),
        type: 'furniture'
    });

    // Coffee Table
    components.push({
        geom: new THREE.BoxGeometry(1.0, 0.4, 0.6),
        pos: new THREE.Vector3(-1.5, 0.3, 0.6),
        type: 'furniture'
    });

    // Plant Vase
    components.push({
        geom: new THREE.CylinderGeometry(0.2, 0.12, 0.8, 12),
        pos: new THREE.Vector3(2.5, 0.5, 1.2),
        type: 'furniture'
    });

    // Kitchen Counter
    components.push({
        geom: new THREE.BoxGeometry(0.8, 0.9, 2.0),
        pos: new THREE.Vector3(2.4, 0.55, -1.2),
        type: 'furniture'
    });

    // Generate Solid & Wireframe layers
    const solidMeshes = [];
    const wireframeMeshes = [];
    const villaPoints = []; // for particles mode

    components.forEach(comp => {
        // Choose solid material
        let mat = wallSolidMaterial;
        if (comp.type === 'base') mat = baseSolidMaterial;
        else if (comp.type === 'column' || comp.type === 'roof' || comp.type === 'furniture') mat = goldMetalMaterial;
        else if (comp.type === 'window') mat = blueGlassMaterial;

        // Solid Mesh
        const mesh = new THREE.Mesh(comp.geom, mat);
        mesh.position.copy(comp.pos);
        solidGlassGroup.add(mesh);
        
        solidMeshes.push({
            mesh: mesh,
            basePos: comp.pos.clone(),
            type: comp.type,
            height: comp.height || 0
        });

        // Wireframe Line segments
        const edges = new THREE.EdgesGeometry(comp.geom);
        let wireMat = cyanWireMaterial;
        if (comp.type === 'column' || comp.type === 'roof' || comp.type === 'furniture') wireMat = goldWireMaterial;

        const line = new THREE.LineSegments(edges, wireMat);
        line.position.copy(comp.pos);
        wireframeGroup.add(line);

        wireframeMeshes.push({
            line: line,
            basePos: comp.pos.clone(),
            type: comp.type,
            height: comp.height || 0
        });

        // Collect points for Particle Cloud
        const posAttr = edges.attributes.position;
        if (posAttr) {
            for (let i = 0; i < posAttr.count; i++) {
                const vx = posAttr.getX(i) + comp.pos.x;
                const vy = posAttr.getY(i) + comp.pos.y;
                const vz = posAttr.getZ(i) + comp.pos.z;
                villaPoints.push(vx, vy, vz);
            }
        }
    });

    // 3. Digital Twin Particle Cloud
    const villaParticleGeom = new THREE.BufferGeometry();
    villaParticleGeom.setAttribute('position', new THREE.Float32BufferAttribute(villaPoints, 3));
    
    const villaParticleMat = new THREE.PointsMaterial({
        color: 0x00d2ff,
        size: 0.15,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
    });
    const villaParticleSystem = new THREE.Points(villaParticleGeom, villaParticleMat);
    villaParticleSystem.visible = false; // Activated only in particles mode
    mainGroup.add(villaParticleSystem);

    // 4. Holographic Scanner Ring/Line (Vertical scanner sweeping horizontally)
    const scannerRingGeom = new THREE.TorusGeometry(4.2, 0.06, 16, 100);
    const scannerRingMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        emissive: 0xd4af37,
        emissiveIntensity: 3.5,
        transparent: true,
        opacity: 0.95
    });
    const scannerRing = new THREE.Mesh(scannerRingGeom, scannerRingMat);
    scannerRing.rotation.y = Math.PI / 2; // Make it vertical (YZ plane)
    scannerRing.position.y = 1.8;
    scene.add(scannerRing);

    // Glowing laser scanner plane inside the ring
    const scanPlaneGeom = new THREE.CylinderGeometry(4.1, 4.1, 0.05, 32);
    const scanPlaneMat = new THREE.MeshBasicMaterial({
        color: 0xd4af37,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide
    });
    const scanPlane = new THREE.Mesh(scanPlaneGeom, scanPlaneMat);
    scanPlane.rotation.z = Math.PI / 2; // Align inside YZ plane of torus
    scannerRing.add(scanPlane);

    // 5. 2D Blueprint Layout Glowing cyan lines on the ground
    const blueprintLinesGroup = new THREE.Group();
    blueprintLinesGroup.position.y = 0.02;
    mainGroup.add(blueprintLinesGroup);

    const blueGlowMaterial = new THREE.LineBasicMaterial({
        color: 0x00d2ff,
        transparent: true,
        opacity: 0.75,
        linewidth: 2.0
    });

    const wallLines = [
        [new THREE.Vector3(-3.2, 0, -2.5), new THREE.Vector3(3.2, 0, -2.5)],
        [new THREE.Vector3(-3.2, 0, -2.5), new THREE.Vector3(-3.2, 0, 2.5)],
        [new THREE.Vector3(0.75, 0, 2.5), new THREE.Vector3(3.2, 0, 2.5)],
        [new THREE.Vector3(0.5, 0, 0), new THREE.Vector3(0.5, 0, -2.5)]
    ];

    wallLines.forEach(linePoints => {
        const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
        const line = new THREE.Line(lineGeom, blueGlowMaterial);
        blueprintLinesGroup.add(line);
    });

    // 6. Floating Ambient Gold Dust Particles
    const particleCount = 150;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = [];

    for (let i = 0; i < particleCount * 3; i += 3) {
        const theta = Math.random() * Math.PI * 2;
        const radius = 5.0 + Math.random() * 8;
        particlePositions[i] = Math.cos(theta) * radius;
        particlePositions[i + 1] = Math.random() * 16 - 1;
        particlePositions[i + 2] = Math.sin(theta) * radius;

        particleSpeeds.push([
            0.01 + Math.random() * 0.02,
            0.02 + Math.random() * 0.03,
            0.01 + Math.random() * 0.02,
            Math.random() * Math.PI * 2
        ]);
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xffdf7a,
        size: 0.14,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeom, particleMaterial);
    scene.add(particleSystem);

    // 7. Holographic Ground Blueprint Table Grid
    const blueprintGroup = new THREE.Group();
    blueprintGroup.position.y = 0.01;
    mainGroup.add(blueprintGroup);

    const blueGrid = new THREE.GridHelper(22, 22, 0xd4af37, 0x0077ff);
    blueGrid.material.transparent = true;
    blueGrid.material.opacity = 0.2;
    blueprintGroup.add(blueGrid);

    // 8. Active Construction Crane at the side
    const craneGroup = new THREE.Group();
    craneGroup.position.set(5.5, 0, -4.5);
    mainGroup.add(craneGroup);

    const craneTowerGeom = new THREE.CylinderGeometry(0.08, 0.08, 7.5, 8);
    const craneTowerEdges = new THREE.EdgesGeometry(craneTowerGeom);
    const craneTower = new THREE.LineSegments(craneTowerEdges, goldWireMaterial);
    craneTower.position.y = 3.75;
    craneGroup.add(craneTower);

    const craneJibGeom = new THREE.BoxGeometry(6.0, 0.16, 0.16);
    const craneJibEdges = new THREE.EdgesGeometry(craneJibGeom);
    const craneJib = new THREE.LineSegments(craneJibEdges, goldWireMaterial);
    craneJib.position.set(-1.8, 7.5, 0); // extends towards villa
    craneGroup.add(craneJib);

    const cableGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-3.5, 7.5, 0),
        new THREE.Vector3(-3.5, 3.0, 0)
    ]);
    const cable = new THREE.Line(cableGeom, goldWireMaterial);
    craneGroup.add(cable);

    const loadGeom = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const loadMesh = new THREE.Mesh(loadGeom, coreMaterial);
    loadMesh.position.set(-3.5, 2.8, 0);
    craneGroup.add(loadMesh);

    // Exposed Global Mode Swapper
    window.setSkyscraperMode = (mode) => {
        if (mode === 'wireframe') {
            solidGlassGroup.visible = false;
            wireframeGroup.visible = true;
            villaParticleSystem.visible = false;
            particleSystem.visible = true;
            scannerRing.visible = true;
        } else if (mode === 'glass') {
            solidGlassGroup.visible = true;
            wireframeGroup.visible = true;
            villaParticleSystem.visible = false;
            particleSystem.visible = true;
            scannerRing.visible = true;
        } else if (mode === 'particles') {
            solidGlassGroup.visible = false;
            wireframeGroup.visible = false;
            villaParticleSystem.visible = true;
            particleSystem.visible = true;
            scannerRing.visible = true;
        }
    };

    // Parallax variables
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX) / 120;
        mouseY = (event.clientY - windowHalfY) / 120;
    });

    document.addEventListener('touchmove', (event) => {
        if (event.touches.length > 0) {
            mouseX = (event.touches[0].clientX - windowHalfX) / 120;
            mouseY = (event.touches[0].clientY - windowHalfY) / 120;
        }
    });

    function handleResize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();

    // Helper to dynamically size components during extrusion cycle
    function updateComponentState(obj, basePos, type, height, s) {
        if (type === 'base') {
            obj.position.copy(basePos);
            obj.scale.set(1, 1, 1);
            obj.visible = true;
        } else if (type === 'wall' || type === 'window' || type === 'column') {
            obj.scale.set(1, s, 1);
            obj.position.set(basePos.x, (height / 2) * s, basePos.z);
            obj.visible = s > 0.02;
        } else if (type === 'roof') {
            if (s < 0.4) {
                obj.visible = false;
            } else {
                obj.visible = true;
                const roofS = (s - 0.4) / 0.6; // goes 0 to 1
                obj.position.set(basePos.x, basePos.y + (1 - roofS) * 6, basePos.z);
                obj.scale.set(1, 1, 1);
            }
        } else if (type === 'furniture') {
            if (s < 0.6) {
                obj.visible = false;
            } else {
                obj.visible = true;
                const furnS = (s - 0.6) / 0.4; // goes 0 to 1
                obj.position.set(basePos.x, basePos.y + (1 - furnS) * 4, basePos.z);
                obj.scale.set(1, 1, 1);
            }
        }
    }

    function animate() {
        requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();

        // Cycles parameters: 12 seconds loop
        const t = elapsedTime % 12;
        let s = 1.0;      // Extrusion progress (scale Y)
        let scanX = 0.0;  // Scan line position X

        if (t < 2.0) {
            // Phase 1: 2D blueprint layout (2s)
            s = 0.01;
            scanX = -6.0;
            scannerRing.visible = false;
        } else if (t < 6.0) {
            // Phase 2: Wall Extrusion & Building (4s)
            const progress = (t - 2.0) / 4.0;
            s = 0.01 + progress * 0.99;
            scanX = -6.0;
            scannerRing.visible = false;
        } else if (t < 10.0) {
            // Phase 3: Laser scan render sweep (4s)
            s = 1.0;
            scannerRing.visible = true;
            const progress = (t - 6.0) / 4.0;
            // Sweep scan line back and forth
            scanX = -5.0 + progress * 11.0;
        } else {
            // Phase 4: Showcase fully rendered room (2s)
            s = 1.0;
            scanX = 6.0;
            scannerRing.visible = false;
        }

        // Apply local clipping plane properties based on scanX position
        solidClipPlane.constant = scanX;
        wireframeClipPlane.constant = -scanX;

        // Position the scanning torus ring
        scannerRing.position.x = scanX;

        // Extrude & reposition components for solid/wireframe layers dynamically
        solidMeshes.forEach(item => {
            updateComponentState(item.mesh, item.basePos, item.type, item.height, s);
        });

        wireframeMeshes.forEach(item => {
            updateComponentState(item.line, item.basePos, item.type, item.height, s);
        });

        // Extrude particle system for Digital Twin mode
        if (villaParticleSystem.visible) {
            villaParticleSystem.scale.set(1, s, 1);
            villaParticleSystem.position.y = 1.8 * (s - 1);
        }

        // Slow Y rotation of blueprint/villa setup
        mainGroup.rotation.y = elapsedTime * 0.04;

        // Crane arm rotation & load hoisting
        craneGroup.rotation.y = Math.sin(elapsedTime * 0.12) * 0.4;
        loadMesh.position.y = 2.7 + Math.sin(elapsedTime * 1.0) * 0.3;
        const cablePosAttr = cable.geometry.attributes.position;
        cablePosAttr.setY(1, 2.7 + Math.sin(elapsedTime * 1.0) * 0.3);
        cablePosAttr.needsUpdate = true;

        // Ambient particles field drift
        const posAttr = particleSystem.geometry.attributes.position;
        for (let i = 0; i < particleCount; i++) {
            const idx = i * 3;
            const speedData = particleSpeeds[i];

            posAttr.array[idx + 1] += speedData[0];
            if (posAttr.array[idx + 1] > 15) {
                posAttr.array[idx + 1] = -1;
            }

            const phase = speedData[3] + elapsedTime * speedData[1];
            const currentRadius = 5.0 + Math.sin(elapsedTime * speedData[2] + speedData[3]) * 1.5;
            posAttr.array[idx] = Math.cos(phase) * currentRadius;
            posAttr.array[idx + 2] = Math.sin(phase) * currentRadius;
        }
        posAttr.needsUpdate = true;

        // Parallax tilt based on mouse position
        targetX += (mouseX - targetX) * 0.04;
        targetY += (mouseY - targetY) * 0.04;

        mainGroup.rotation.x = targetY * 0.05;
        mainGroup.rotation.z = -targetX * 0.05;
        mainGroup.position.y = Math.sin(elapsedTime * 0.35) * 0.12;

        renderer.render(scene, camera);
    }

    animate();
}

/**
 * Initializes the detailed 3D model for specific project types in their details modals
 */
function initProject3D(canvasId, projectType) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (activeModalRenderers[canvasId]) {
        activeModalRenderers[canvasId].stop();
        delete activeModalRenderers[canvasId];
    }

    const parent = canvas.parentElement;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02050e);
    scene.fog = new THREE.FogExp2(0x02050e, 0.015);

    const camera = new THREE.PerspectiveCamera(45, parent.clientWidth / parent.clientHeight, 0.1, 100);
    camera.position.set(0, 6, 12);
    camera.lookAt(0, 1.5, 0);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(parent.clientWidth, parent.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 25;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const goldLight = new THREE.DirectionalLight(0xd4af37, 2.5);
    goldLight.position.set(6, 12, 6);
    scene.add(goldLight);

    const blueLight = new THREE.DirectionalLight(0x0077ff, 2.0);
    blueLight.position.set(-6, 4, -6);
    scene.add(blueLight);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.15, metalness: 0.85 });
    const blueGlassMat = new THREE.MeshStandardMaterial({ color: 0x0077ff, roughness: 0.05, metalness: 0.95, transparent: true, opacity: 0.55 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.25, metalness: 0.95 });
    const lineGold = new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.9 });
    const lineBlue = new THREE.LineBasicMaterial({ color: 0x0077ff, transparent: true, opacity: 0.65 });

    const gridHelper = new THREE.GridHelper(16, 16, 0xd4af37, 0x0f1c34);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    switch (projectType) {
        case 'residential':
            const baseGeom = new THREE.BoxGeometry(4, 1.4, 3.2);
            const baseMesh = new THREE.Mesh(baseGeom, blueGlassMat);
            baseMesh.position.set(0, 0.7, 0);
            modelGroup.add(baseMesh);

            const baseEdges = new THREE.EdgesGeometry(baseGeom);
            const baseLine = new THREE.LineSegments(baseEdges, lineGold);
            baseLine.position.copy(baseMesh.position);
            modelGroup.add(baseLine);

            const topGeom = new THREE.BoxGeometry(3.6, 1.4, 2.6);
            const topMesh = new THREE.Mesh(topGeom, blueGlassMat);
            topMesh.position.set(0.6, 2.1, 0.4);
            modelGroup.add(topMesh);

            const topEdges = new THREE.EdgesGeometry(topGeom);
            const topLine = new THREE.LineSegments(topEdges, lineGold);
            topLine.position.copy(topMesh.position);
            modelGroup.add(topLine);

            const pergolaGeom = new THREE.BoxGeometry(4.2, 0.1, 3.4);
            const pergolaMesh = new THREE.Mesh(pergolaGeom, goldMat);
            pergolaMesh.position.set(0.5, 2.85, 0.4);
            modelGroup.add(pergolaMesh);

            const columnGeom = new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8);
            for(let x of [-1.8, 2.1]) {
                for(let z of [-1.4, 1.4]) {
                    const col = new THREE.Mesh(columnGeom, goldMat);
                    col.position.set(x, 1.4, z);
                    modelGroup.add(col);
                }
            }
            break;

        case 'commercial':
            const heights = [5.5, 4.2];
            const offsets = [-1.2, 1.2];
            for (let t = 0; t < 2; t++) {
                const segs = t === 0 ? 5 : 4;
                const h = heights[t];
                const x = offsets[t];
                
                for(let i = 0; i < segs; i++) {
                    const size = 1.6 - i * 0.22;
                    const blockH = h / segs;
                    const segGeom = new THREE.BoxGeometry(size, blockH, size);
                    const segMesh = new THREE.Mesh(segGeom, blueGlassMat);
                    segMesh.position.set(x, (blockH / 2) + i * blockH, 0);
                    segMesh.rotation.y = (i * Math.PI) / 10;
                    modelGroup.add(segMesh);

                    const segEdges = new THREE.EdgesGeometry(segGeom);
                    const segLine = new THREE.LineSegments(segEdges, lineGold);
                    segLine.position.copy(segMesh.position);
                    segLine.rotation.copy(segMesh.rotation);
                    modelGroup.add(segLine);
                }
            }

            const bridgeGeom = new THREE.BoxGeometry(2.4, 0.4, 0.8);
            const bridgeMesh = new THREE.Mesh(bridgeGeom, steelMat);
            bridgeMesh.position.set(0, 3.2, 0);
            modelGroup.add(bridgeMesh);

            const bridgeEdges = new THREE.EdgesGeometry(bridgeGeom);
            const bridgeLine = new THREE.LineSegments(bridgeEdges, lineGold);
            bridgeLine.position.copy(bridgeMesh.position);
            modelGroup.add(bridgeLine);
            break;

        case 'industrial':
            const wareGeom = new THREE.BoxGeometry(4.8, 1.8, 3.6);
            const wareMesh = new THREE.Mesh(wareGeom, steelMat);
            wareMesh.position.set(-0.6, 0.9, 0);
            modelGroup.add(wareMesh);

            const wareEdges = new THREE.EdgesGeometry(wareGeom);
            const wareLine = new THREE.LineSegments(wareEdges, lineBlue);
            wareLine.position.copy(wareMesh.position);
            modelGroup.add(wareLine);

            for (let i = 0; i < 3; i++) {
                const roofGeom = new THREE.ConeGeometry(0.75, 0.5, 4);
                roofGeom.rotation.y = Math.PI / 4;
                roofGeom.scale(1, 1, 3.6);
                roofGeom.position.set(-2.1 + i * 1.5, 2.05, 0);
                const roof = new THREE.Mesh(roofGeom, goldMat);
                modelGroup.add(roof);
            }

            const siloGeom = new THREE.CylinderGeometry(0.5, 0.5, 3.5, 16);
            const siloEdges = new THREE.EdgesGeometry(siloGeom);
            for(let z of [-1.0, 0, 1.0]) {
                const silo = new THREE.Mesh(siloGeom, steelMat);
                silo.position.set(2.5, 1.75, z);
                modelGroup.add(silo);

                const lineS = new THREE.LineSegments(siloEdges, lineGold);
                lineS.position.copy(silo.position);
                modelGroup.add(lineS);
                
                const coneGeom = new THREE.ConeGeometry(0.55, 0.4, 16);
                const cone = new THREE.Mesh(coneGeom, goldMat);
                cone.position.set(2.5, 3.7, z);
                modelGroup.add(cone);
            }
            break;

        case 'infrastructure':
            const pylonGeom = new THREE.BoxGeometry(0.3, 4.8, 0.3);
            const pylonEdges = new THREE.EdgesGeometry(pylonGeom);
            const pylonPositions = [-2.8, 2.8];
            
            pylonPositions.forEach(x => {
                for(let z of [-0.4, 0.4]) {
                    const pillar = new THREE.Mesh(pylonGeom, goldMat);
                    pillar.position.set(x, 2.4, z);
                    modelGroup.add(pillar);

                    const lineP = new THREE.LineSegments(pylonEdges, lineGold);
                    lineP.position.copy(pillar.position);
                    modelGroup.add(lineP);
                }
                const crossGeom = new THREE.BoxGeometry(0.15, 0.3, 1.0);
                for(let y of [1.6, 3.6, 4.6]) {
                    const cross = new THREE.Mesh(crossGeom, goldMat);
                    cross.position.set(x, y, 0);
                    modelGroup.add(cross);
                }
            });

            const roadGeom = new THREE.BoxGeometry(8.5, 0.12, 1.4);
            const roadMesh = new THREE.Mesh(roadGeom, steelMat);
            roadMesh.position.set(0, 1.5, 0);
            modelGroup.add(roadMesh);

            const roadEdges = new THREE.EdgesGeometry(roadGeom);
            const roadLine = new THREE.LineSegments(roadEdges, lineBlue);
            roadLine.position.copy(roadMesh.position);
            modelGroup.add(roadLine);

            for(let z of [-0.4, 0.4]) {
                const curve = new THREE.QuadraticBezierCurve3(
                    new THREE.Vector3(-4.5, 1.5, z),
                    new THREE.Vector3(0, 3.8, z),
                    new THREE.Vector3(4.5, 1.5, z)
                );
                const curvePoints = curve.getPoints(50);
                const curveGeom = new THREE.BufferGeometry().setFromPoints(curvePoints);
                const cable = new THREE.Line(curveGeom, lineGold);
                modelGroup.add(cable);

                for (let x = -2.4; x <= 2.4; x += 0.4) {
                    if (Math.abs(x) < 0.1 || Math.abs(Math.abs(x) - 2.8) < 0.1) continue;
                    const curveY = 1.5 + (3.8 - 1.5) * (1 - (Math.abs(x) / 4.5) * (Math.abs(x) / 4.5));
                    const hangerGeom = new THREE.BufferGeometry().setFromPoints([
                        new THREE.Vector3(x, 1.5, z),
                        new THREE.Vector3(x, curveY - 0.1, z)
                    ]);
                    const hanger = new THREE.Line(hangerGeom, lineBlue);
                    modelGroup.add(hanger);
                }
            }
            break;
    }

    modelGroup.position.y = 0.2;
    let runAnimation = true;

    function handleResize() {
        const w = parent.clientWidth;
        const h = parent.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }
    window.addEventListener('resize', handleResize);

    function animate() {
        if (!runAnimation) return;
        requestAnimationFrame(animate);
        modelGroup.rotation.y += 0.006;
        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    activeModalRenderers[canvasId] = {
        stop: () => {
            runAnimation = false;
            window.removeEventListener('resize', handleResize);
            controls.dispose();
            renderer.dispose();
            modelGroup.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });
            gridHelper.geometry.dispose();
            gridHelper.material.dispose();
        }
    };
}
