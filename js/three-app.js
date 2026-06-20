// Upgraded 3D Visualizations using Three.js with mode switching - Twisting Tower Edition

document.addEventListener('DOMContentLoaded', () => {
    initHero3D();
});

// Global state for modal canvases to manage resizing and memory cleanup
let activeModalRenderers = {};

/**
 * Initializes the premium 3D twisting skyscraper, Exoskeleton, and Scanner Ring in the Hero Section
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
    camera.position.set(0, 10, 26);
    camera.lookAt(0, 8, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x0f1c34, 1.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xd4af37, 3.5); // Rich Gold Light
    dirLight1.position.set(15, 25, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x0077ff, 2.5); // Deep Blue Counter Light
    dirLight2.position.set(-15, 10, -15);
    scene.add(dirLight2);

    // Main Group to hold the skyscraper and its components (will tilt and rotate)
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Subgroups for mode switching
    const solidGlassGroup = new THREE.Group();
    const wireframeGroup = new THREE.Group();
    mainGroup.add(solidGlassGroup);
    mainGroup.add(wireframeGroup);

    // Materials
    const goldWireMaterial = new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.9, linewidth: 2.0 });
    const blueWireMaterial = new THREE.LineBasicMaterial({ color: 0x0077ff, transparent: true, opacity: 0.5 });
    const glassMaterial = new THREE.MeshStandardMaterial({
        color: 0x070e1c,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.4,
        flatShading: true,
        side: THREE.DoubleSide
    });
    const coreMaterial = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        emissive: 0xd4af37,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.75
    });

    // 1. Skyscraper Core Shaft (Gold inner core representing structural spine)
    const coreGeom = new THREE.CylinderGeometry(0.8, 1.2, 18, 8);
    const coreMesh = new THREE.Mesh(coreGeom, coreMaterial);
    coreMesh.position.y = 9;
    mainGroup.add(coreMesh);

    // 2. Build Twisting Hexagonal Tower plates and Exoskeleton
    const floorCount = 28;
    const floorHeight = 18 / floorCount;
    const towerPoints = []; // for particles mode

    const glassFloors = [];
    
    // Hexagonal geometry blueprint coordinates for exoskeleton tracing
    const floorVertices = [];

    for (let i = 0; i < floorCount; i++) {
        const y = i * floorHeight;
        const twist = i * 0.08;
        const r = 3.2 * (1 - (i / 35) * 0.2);

        // A. Solid Glass Floor Plates
        const floorGeom = new THREE.CylinderGeometry(r, r, floorHeight * 0.8, 6, 1);
        const floorMesh = new THREE.Mesh(floorGeom, glassMaterial);
        floorMesh.position.y = y + (floorHeight / 2);
        floorMesh.rotation.y = twist;
        solidGlassGroup.add(floorMesh);
        glassFloors.push(floorMesh);

        // Store corner coordinates for drawing Exoskeleton
        const corners = [];
        for (let j = 0; j < 6; j++) {
            const a = j * (Math.PI / 3) + twist;
            const px = Math.cos(a) * r;
            const pz = Math.sin(a) * r;
            const py = y;
            corners.push(new THREE.Vector3(px, py, pz));
            
            // Store for Particle Cloud
            towerPoints.push(px, py, pz);
        }
        floorVertices.push(corners);

        // Add some inner points for particle density
        for (let rFactor = 0.3; rFactor < 1.0; rFactor += 0.35) {
            const ir = r * rFactor;
            for (let j = 0; j < 6; j++) {
                const a = j * (Math.PI / 3) + twist + (rFactor * 0.15);
                towerPoints.push(Math.cos(a) * ir, y, Math.sin(a) * ir);
            }
        }
    }

    // Interpolate edge points for high density particle cloud
    for (let i = 0; i < floorCount; i++) {
        const y = i * floorHeight;
        const twist = i * 0.08;
        const r = 3.2 * (1 - (i / 35) * 0.2);
        
        for (let j = 0; j < 6; j++) {
            const a1 = j * (Math.PI / 3) + twist;
            const a2 = ((j + 1) % 6) * (Math.PI / 3) + twist;
            
            const x1 = Math.cos(a1) * r;
            const z1 = Math.sin(a1) * r;
            const x2 = Math.cos(a2) * r;
            const z2 = Math.sin(a2) * r;
            
            for (let k = 1; k < 5; k++) {
                const t = k / 5;
                towerPoints.push(
                    x1 + (x2 - x1) * t,
                    y,
                    z1 + (z2 - z1) * t
                );
            }
        }
    }

    // B. Build Diagrid Exoskeleton lines
    const exoPoints = [];
    const diagPoints = [];

    for (let i = 0; i < floorCount - 1; i++) {
        const c1 = floorVertices[i];
        const c2 = floorVertices[i + 1];
        
        for (let j = 0; j < 6; j++) {
            const p1 = c1[j];
            const p2_same = c2[j];
            const p2_next = c2[(j + 1) % 6];
            const p2_prev = c2[(j + 5) % 6];

            // Vertical / twist frame columns
            exoPoints.push(p1, p2_same);

            // Diagonal bracing structural lines
            diagPoints.push(p1, p2_next);
            diagPoints.push(p1, p2_prev);
        }
    }

    const exoGeom = new THREE.BufferGeometry().setFromPoints(exoPoints);
    const exoLines = new THREE.LineSegments(exoGeom, goldWireMaterial);
    wireframeGroup.add(exoLines);

    const diagGeom = new THREE.BufferGeometry().setFromPoints(diagPoints);
    const diagLines = new THREE.LineSegments(diagGeom, blueWireMaterial);
    wireframeGroup.add(diagLines);

    // 3. Digital Twin Particle Cloud
    const towerParticleGeom = new THREE.BufferGeometry();
    towerParticleGeom.setAttribute('position', new THREE.Float32BufferAttribute(towerPoints, 3));
    
    const towerParticleMat = new THREE.PointsMaterial({
        color: 0x0077ff,
        size: 0.16,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
    });
    const towerParticleSystem = new THREE.Points(towerParticleGeom, towerParticleMat);
    towerParticleSystem.visible = false; // Hidden by default (activated in particles mode)
    mainGroup.add(towerParticleSystem);

    // 4. Holographic Scanner Ring (Sweeps up/down the tower)
    const scannerRingGeom = new THREE.TorusGeometry(3.8, 0.08, 16, 64);
    const scannerRingMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        emissive: 0xd4af37,
        emissiveIntensity: 3.5,
        transparent: true,
        opacity: 0.95
    });
    const scannerRing = new THREE.Mesh(scannerRingGeom, scannerRingMat);
    scannerRing.rotation.x = Math.PI / 2;
    // We add the scanner ring directly to the scene so it stays level and only slides up/down
    scene.add(scannerRing);

    // Glowing laser scanner plane inside the ring
    const scanPlaneGeom = new THREE.CylinderGeometry(3.7, 3.7, 0.04, 32);
    const scanPlaneMat = new THREE.MeshBasicMaterial({
        color: 0xd4af37,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide
    });
    const scanPlane = new THREE.Mesh(scanPlaneGeom, scanPlaneMat);
    scannerRing.add(scanPlane);

    // 5. Floating Ambient Gold Dust Particles
    const particleCount = 200;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = [];

    for (let i = 0; i < particleCount * 3; i += 3) {
        const theta = Math.random() * Math.PI * 2;
        const radius = 4.0 + Math.random() * 10;
        particlePositions[i] = Math.cos(theta) * radius;
        particlePositions[i + 1] = Math.random() * 24 - 2;
        particlePositions[i + 2] = Math.sin(theta) * radius;

        particleSpeeds.push([
            0.01 + Math.random() * 0.03,
            0.02 + Math.random() * 0.04,
            0.01 + Math.random() * 0.02,
            Math.random() * Math.PI * 2
        ]);
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xffdf7a,
        size: 0.15,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeom, particleMaterial);
    scene.add(particleSystem);

    // 6. Holographic Ground Blueprint Table (Grid & Concentric Sectors)
    const blueprintGroup = new THREE.Group();
    blueprintGroup.position.y = 0.02;
    mainGroup.add(blueprintGroup);

    const blueGrid = new THREE.GridHelper(26, 26, 0xd4af37, 0x0077ff);
    blueGrid.material.transparent = true;
    blueGrid.material.opacity = 0.25;
    blueprintGroup.add(blueGrid);

    // Circles on blueprint table
    const ringParams = [5.5, 9.0, 12.5];
    ringParams.forEach(radius => {
        const ringGeom = new THREE.RingGeometry(radius - 0.06, radius + 0.06, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x0077ff,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        blueprintGroup.add(ringMesh);
    });

    // 7. Active Construction Ground Crane (at the side of blueprint grid)
    const craneGroup = new THREE.Group();
    craneGroup.position.set(5.5, 0, -5.5);
    mainGroup.add(craneGroup);

    const craneTowerGeom = new THREE.CylinderGeometry(0.1, 0.1, 7.5, 8);
    const craneTowerEdges = new THREE.EdgesGeometry(craneTowerGeom);
    const craneTower = new THREE.LineSegments(craneTowerEdges, goldWireMaterial);
    craneTower.position.y = 3.75;
    craneGroup.add(craneTower);

    const craneJibGeom = new THREE.BoxGeometry(6.5, 0.18, 0.18);
    const craneJibEdges = new THREE.EdgesGeometry(craneJibGeom);
    const craneJib = new THREE.LineSegments(craneJibEdges, goldWireMaterial);
    craneJib.position.set(-2, 7.5, 0); // extends towards building
    craneGroup.add(craneJib);

    const cableGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-4, 7.5, 0),
        new THREE.Vector3(-4, 3, 0)
    ]);
    const cable = new THREE.Line(cableGeom, goldWireMaterial);
    craneGroup.add(cable);

    const loadGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const loadMesh = new THREE.Mesh(loadGeom, coreMaterial);
    loadMesh.position.set(-4, 2.7, 0);
    craneGroup.add(loadMesh);

    // Exposed Global Mode Swapper
    window.setSkyscraperMode = (mode) => {
        if (mode === 'wireframe') {
            solidGlassGroup.visible = false;
            wireframeGroup.visible = true;
            towerParticleSystem.visible = false;
            particleSystem.visible = true;
            scannerRing.visible = true;
        } else if (mode === 'glass') {
            solidGlassGroup.visible = true;
            wireframeGroup.visible = true;
            towerParticleSystem.visible = false;
            particleSystem.visible = true;
            scannerRing.visible = true;
        } else if (mode === 'particles') {
            solidGlassGroup.visible = false;
            wireframeGroup.visible = false;
            towerParticleSystem.visible = true;
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

    function animate() {
        requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();

        // 1. Slow Y rotation of Twist Skyscraper & Exoskeleton
        mainGroup.rotation.y = elapsedTime * 0.06;

        // 2. Holographic Scanner Ring vertical sweep (Sweeps between y=0.5 and y=17.5)
        scannerRing.position.y = 9 + Math.sin(elapsedTime * 0.7) * 8.5;

        // 3. Crane arm rotation & load hoisting
        craneGroup.rotation.y = Math.sin(elapsedTime * 0.15) * 0.45;
        loadMesh.position.y = 2.6 + Math.sin(elapsedTime * 1.2) * 0.35;
        const cablePosAttr = cable.geometry.attributes.position;
        cablePosAttr.setY(1, 2.6 + Math.sin(elapsedTime * 1.2) * 0.35);
        cablePosAttr.needsUpdate = true;

        // 4. Ambient particles field drift
        const posAttr = particleSystem.geometry.attributes.position;
        for (let i = 0; i < particleCount; i++) {
            const idx = i * 3;
            const speedData = particleSpeeds[i];

            posAttr.array[idx + 1] += speedData[0];
            if (posAttr.array[idx + 1] > 22) {
                posAttr.array[idx + 1] = -2;
            }

            const phase = speedData[3] + elapsedTime * speedData[1];
            const currentRadius = 4.0 + Math.sin(elapsedTime * speedData[2] + speedData[3]) * 1.5;
            posAttr.array[idx] = Math.cos(phase) * currentRadius;
            posAttr.array[idx + 2] = Math.sin(phase) * currentRadius;
        }
        posAttr.needsUpdate = true;

        // 5. Parallax tilt
        targetX += (mouseX - targetX) * 0.04;
        targetY += (mouseY - targetY) * 0.04;

        mainGroup.rotation.x = targetY * 0.06;
        mainGroup.rotation.z = -targetX * 0.06;
        mainGroup.position.y = Math.sin(elapsedTime * 0.3) * 0.15 - 0.2;

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
