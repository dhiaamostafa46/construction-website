// Upgraded 3D Visualizations using Three.js with mode switching

document.addEventListener('DOMContentLoaded', () => {
    initHero3D();
});

// Global state for modal canvases to manage resizing and memory cleanup
let activeModalRenderers = {};

/**
 * Initializes the premium 3D skyscraper and particle field in the Hero Section
 */
function initHero3D() {
    const container = document.getElementById('hero-canvas-container');
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || !container) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02050e, 0.002);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 7, 28);
    camera.lookAt(0, 7, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x0f1c34, 1.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xd4af37, 4); // Rich Gold Up Light
    dirLight1.position.set(15, 25, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x0077ff, 2.5); // Deep Blue Counter Light
    dirLight2.position.set(-15, 10, -15);
    scene.add(dirLight2);

    // Spotlight pointing at the building for dramatic shadows/lighting
    const spotLight = new THREE.SpotLight(0xd4af37, 5, 50, Math.PI / 4, 0.5, 1);
    spotLight.position.set(0, 25, 0);
    scene.add(spotLight);

    // Main Group to hold the skyscraper and its components
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Subgroups for mode switching
    const solidGlassGroup = new THREE.Group();
    const wireframeGroup = new THREE.Group();
    mainGroup.add(solidGlassGroup);
    mainGroup.add(wireframeGroup);

    // Materials
    const goldWireMaterial = new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.85, linewidth: 1.5 });
    const blueWireMaterial = new THREE.LineBasicMaterial({ color: 0x0077ff, transparent: true, opacity: 0.45 });
    const glassMaterial = new THREE.MeshStandardMaterial({
        color: 0x070e1c,
        roughness: 0.05,
        metalness: 0.95,
        transparent: true,
        opacity: 0.35,
        flatShading: true,
        side: THREE.DoubleSide
    });
    const coreMaterial = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        emissive: 0xd4af37,
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.8
    });

    // 1. Skyscraper Core Shaft
    const coreGeom = new THREE.BoxGeometry(1.2, 20, 1.2);
    const coreMesh = new THREE.Mesh(coreGeom, coreMaterial);
    coreMesh.position.y = 10;
    // Core is visible in all modes
    mainGroup.add(coreMesh);

    // 2. Multi-tier Architectural Block Tower
    const blockConfigs = [
        { w: 6.5, h: 5, d: 6.5, y: 2.5, rot: 0 },
        { w: 5.5, h: 5, d: 5.5, y: 7.5, rot: Math.PI / 10 },
        { w: 4.5, h: 5, d: 4.5, y: 12.5, rot: -Math.PI / 10 },
        { w: 3.5, h: 5, d: 3.5, y: 17.5, rot: Math.PI / 5 }
    ];

    blockConfigs.forEach(config => {
        // Semi-transparent solid glass block (added to solidGlassGroup)
        const geom = new THREE.BoxGeometry(config.w, config.h, config.d);
        const mesh = new THREE.Mesh(geom, glassMaterial);
        mesh.position.y = config.y;
        mesh.rotation.y = config.rot;
        solidGlassGroup.add(mesh);

        // Gold frame outlines (added to wireframeGroup)
        const edges = new THREE.EdgesGeometry(geom);
        const line = new THREE.LineSegments(edges, goldWireMaterial);
        line.position.y = config.y;
        line.rotation.y = config.rot;
        wireframeGroup.add(line);

        // Sub-structural blue lines (added to wireframeGroup)
        const innerGeom = new THREE.BoxGeometry(config.w - 0.3, config.h - 0.1, config.d - 0.3);
        const innerEdges = new THREE.EdgesGeometry(innerGeom);
        const innerLines = new THREE.LineSegments(innerEdges, blueWireMaterial);
        innerLines.position.y = config.y;
        innerLines.rotation.y = config.rot;
        wireframeGroup.add(innerLines);

        // Diagonal bracing lines (added to wireframeGroup)
        const diagonalLines = createXBracing(config.w, config.h, config.d, goldWireMaterial);
        diagonalLines.position.y = config.y;
        diagonalLines.rotation.y = config.rot;
        wireframeGroup.add(diagonalLines);
    });

    // Helper to generate X bracing
    function createXBracing(w, h, d, material) {
        const points = [];
        // Front face diagonals
        points.push(new THREE.Vector3(-w/2, -h/2, d/2), new THREE.Vector3(w/2, h/2, d/2));
        points.push(new THREE.Vector3(w/2, -h/2, d/2), new THREE.Vector3(-w/2, h/2, d/2));
        // Back face diagonals
        points.push(new THREE.Vector3(-w/2, -h/2, -d/2), new THREE.Vector3(w/2, h/2, -d/2));
        points.push(new THREE.Vector3(w/2, -h/2, -d/2), new THREE.Vector3(-w/2, h/2, -d/2));
        
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        return new THREE.LineSegments(geom, material);
    }

    // 3. Floating Gold Particles Field (Gold Dust Effect)
    const particleCount = 280;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = [];

    for (let i = 0; i < particleCount * 3; i += 3) {
        const theta = Math.random() * Math.PI * 2;
        const radius = 3.5 + Math.random() * 12;
        particlePositions[i] = Math.cos(theta) * radius; // x
        particlePositions[i + 1] = Math.random() * 26 - 3; // y
        particlePositions[i + 2] = Math.sin(theta) * radius; // z

        particleSpeeds.push([
            0.01 + Math.random() * 0.03, // upward vertical speed
            0.02 + Math.random() * 0.05, // rotation around center
            0.01 + Math.random() * 0.02, // oscillation speed
            Math.random() * Math.PI * 2  // phase offset
        ]);
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xffdf7a,
        size: 0.16,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
    });
    
    const particleSystem = new THREE.Points(particleGeom, particleMaterial);
    scene.add(particleSystem);

    // 4. Ground laser rings
    const ringGroup = new THREE.Group();
    ringGroup.position.y = 0.1;
    mainGroup.add(ringGroup);

    const ringParams = [
        { r: 8.5, c: 0x0077ff, op: 0.35, rotSpeed: -0.15 },
        { r: 12.0, c: 0xd4af37, op: 0.20, rotSpeed: 0.08 },
        { r: 15.0, c: 0x0f1c34, op: 0.40, rotSpeed: -0.05 }
    ];

    const rings = [];
    ringParams.forEach(param => {
        const ringGeom = new THREE.RingGeometry(param.r, param.r + 0.15, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: param.c,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: param.op
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringGroup.add(ringMesh);
        rings.push({ mesh: ringMesh, speed: param.rotSpeed });
    });

    // 5. Active crane at the top
    const craneGroup = new THREE.Group();
    craneGroup.position.set(0, 20, 0);

    const craneTowerGeom = new THREE.CylinderGeometry(0.12, 0.12, 4.5, 8);
    const craneTowerEdges = new THREE.EdgesGeometry(craneTowerGeom);
    const craneTower = new THREE.LineSegments(craneTowerEdges, goldWireMaterial);
    craneTower.position.y = 2.25;
    craneGroup.add(craneTower);

    const craneJibGeom = new THREE.BoxGeometry(5.5, 0.18, 0.18);
    const craneJibEdges = new THREE.EdgesGeometry(craneJibGeom);
    const craneJib = new THREE.LineSegments(craneJibEdges, goldWireMaterial);
    craneJib.position.set(2, 4.5, 0);
    craneGroup.add(craneJib);

    const cableGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(4, 4.5, 0),
        new THREE.Vector3(4, 1.8, 0)
    ]);
    const cable = new THREE.Line(cableGeom, goldWireMaterial);
    craneGroup.add(cable);

    const loadGeom = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const loadMesh = new THREE.Mesh(loadGeom, coreMaterial);
    loadMesh.position.set(4, 1.6, 0);
    craneGroup.add(loadMesh);

    // Crane is grouped into wireframes
    wireframeGroup.add(craneGroup);

    // Global Mode Switch Function exposed to Window
    window.setSkyscraperMode = (mode) => {
        if (mode === 'wireframe') {
            solidGlassGroup.visible = false;
            wireframeGroup.visible = true;
            particleSystem.visible = true;
            spotLight.intensity = 2;
        } else if (mode === 'glass') {
            solidGlassGroup.visible = true;
            wireframeGroup.visible = true;
            particleSystem.visible = true;
            spotLight.intensity = 5;
        } else if (mode === 'particles') {
            solidGlassGroup.visible = false;
            wireframeGroup.visible = false;
            particleSystem.visible = true;
            spotLight.intensity = 0.5; // low light for particles
        }
    };

    // Mouse movement interaction variables
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX) / 110;
        mouseY = (event.clientY - windowHalfY) / 110;
    });

    document.addEventListener('touchmove', (event) => {
        if (event.touches.length > 0) {
            mouseX = (event.touches[0].clientX - windowHalfX) / 110;
            mouseY = (event.touches[0].clientY - windowHalfY) / 110;
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

        // 1. Slow Y rotation
        mainGroup.rotation.y = elapsedTime * 0.08;
        
        // 2. Crane animation
        craneGroup.rotation.y = Math.sin(elapsedTime * 0.2) * 0.6;
        loadMesh.position.y = 1.6 + Math.sin(elapsedTime * 1.5) * 0.25;
        const cablePosAttr = cable.geometry.attributes.position;
        cablePosAttr.setY(1, 1.6 + Math.sin(elapsedTime * 1.5) * 0.25);
        cablePosAttr.needsUpdate = true;

        // 3. Concentric rings
        rings.forEach(ring => {
            ring.mesh.rotation.z += ring.speed * 0.05;
        });

        // 4. Gold particles
        const posAttr = particleSystem.geometry.attributes.position;
        for (let i = 0; i < particleCount; i++) {
            const idx = i * 3;
            const speedData = particleSpeeds[i];
            
            posAttr.array[idx + 1] += speedData[0];
            if (posAttr.array[idx + 1] > 23) {
                posAttr.array[idx + 1] = -3;
            }

            const phase = speedData[3] + elapsedTime * speedData[1];
            const currentRadius = 3.5 + Math.sin(elapsedTime * speedData[2] + speedData[3]) * 1.5;
            posAttr.array[idx] = Math.cos(phase) * currentRadius;
            posAttr.array[idx + 2] = Math.sin(phase) * currentRadius;
        }
        posAttr.needsUpdate = true;

        // 5. Parallax tilt
        targetX += (mouseX - targetX) * 0.04;
        targetY += (mouseY - targetY) * 0.04;

        mainGroup.rotation.x = targetY * 0.08;
        mainGroup.rotation.z = -targetX * 0.08;
        mainGroup.position.y = Math.sin(elapsedTime * 0.4) * 0.2 - 0.5;

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
