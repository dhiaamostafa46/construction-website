// 3D Visualizations using Three.js

document.addEventListener('DOMContentLoaded', () => {
    initHero3D();
});

// Global state for modal canvases to manage resizing and memory cleanup
let activeModalRenderers = {};

/**
 * Initializes the 3D skyscraper visualizer in the Hero Section
 */
function initHero3D() {
    const container = document.getElementById('hero-canvas-container');
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || !container) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.0015);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 5, 25);
    camera.lookAt(0, 5, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x0a142c, 1.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xd4af37, 3); // Gold light
    dirLight1.position.set(10, 20, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x0077ff, 2); // Blue accent light
    dirLight2.position.set(-10, 5, -10);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xd4af37, 2, 50);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    // Creating the Architectural Skyscraper Model Group
    const skyscraperGroup = new THREE.Group();
    scene.add(skyscraperGroup);

    // Color materials
    const goldWireMaterial = new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.8 });
    const blueWireMaterial = new THREE.LineBasicMaterial({ color: 0x0077ff, transparent: true, opacity: 0.4 });
    const solidGlassMaterial = new THREE.MeshStandardMaterial({
        color: 0x0b1528,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.25,
        flatShading: true
    });
    const glowingCoreMaterial = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        emissive: 0xd4af37,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.7
    });

    // 1. Core elevator shaft (Glowing gold column inside)
    const coreGeom = new THREE.BoxGeometry(1.5, 18, 1.5);
    const coreMesh = new THREE.Mesh(coreGeom, glowingCoreMaterial);
    coreMesh.position.y = 9;
    skyscraperGroup.add(coreMesh);

    // 2. Primary outer building blocks (Futuristic stacked offset design)
    const blockConfigs = [
        { w: 6, h: 6, d: 6, y: 3, rot: 0 },
        { w: 5, h: 5, d: 5, y: 8.5, rot: Math.PI / 8 },
        { w: 4, h: 4, d: 4, y: 13, rot: -Math.PI / 8 },
        { w: 3, h: 4, d: 3, y: 17, rot: Math.PI / 4 }
    ];

    blockConfigs.forEach(config => {
        // Solid semi-transparent glass mesh
        const geom = new THREE.BoxGeometry(config.w, config.h, config.d);
        const mesh = new THREE.Mesh(geom, solidGlassMaterial);
        mesh.position.y = config.y;
        mesh.rotation.y = config.rot;
        skyscraperGroup.add(mesh);

        // Gold frame outline
        const edges = new THREE.EdgesGeometry(geom);
        const line = new THREE.LineSegments(edges, goldWireMaterial);
        line.position.y = config.y;
        line.rotation.y = config.rot;
        skyscraperGroup.add(line);

        // Inside structural grid (blue lines)
        const gridGeom = new THREE.BoxGeometry(config.w - 0.2, config.h - 0.2, config.d - 0.2);
        const gridEdges = new THREE.EdgesGeometry(gridGeom);
        const gridLines = new THREE.LineSegments(gridEdges, blueWireMaterial);
        gridLines.position.y = config.y;
        gridLines.rotation.y = config.rot;
        skyscraperGroup.add(gridLines);
    });

    // 3. Add node points (small glowing spheres at intersections to represent joint lights)
    const pointGeom = new THREE.BufferGeometry();
    const pointPositions = [];
    
    // Generate random star-like points around the building representing digital crane nodes or floating coordinates
    for (let i = 0; i < 150; i++) {
        const theta = Math.random() * Math.PI * 2;
        const radius = 4 + Math.random() * 8;
        const x = Math.cos(theta) * radius;
        const y = Math.random() * 22;
        const z = Math.sin(theta) * radius;
        pointPositions.push(x, y, z);
    }
    
    pointGeom.setAttribute('position', new THREE.Float32BufferAttribute(pointPositions, 3));
    const pointMaterial = new THREE.PointsMaterial({
        color: 0xd4af37,
        size: 0.15,
        transparent: true,
        opacity: 0.8
    });
    const points = new THREE.Points(pointGeom, pointMaterial);
    skyscraperGroup.add(points);

    // 4. Ground decorative construction rings
    const ringGeom1 = new THREE.RingGeometry(8, 8.2, 32);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x0077ff, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
    const ring1 = new THREE.Mesh(ringGeom1, ringMat1);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = 0.1;
    skyscraperGroup.add(ring1);

    const ringGeom2 = new THREE.RingGeometry(11, 11.2, 32);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xd4af37, side: THREE.DoubleSide, transparent: true, opacity: 0.2 });
    const ring2 = new THREE.Mesh(ringGeom2, ringMat2);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = 0.1;
    skyscraperGroup.add(ring2);

    // 5. Cranes at the top (Architectural construction detail)
    const craneGroup = new THREE.Group();
    craneGroup.position.set(0, 19, 0);
    
    // Tower vertical post
    const postGeom = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
    const postMesh = new THREE.Mesh(postGeom, glowingCoreMaterial);
    postMesh.position.y = 1.5;
    craneGroup.add(postMesh);

    // Horizontal jib arm
    const jibGeom = new THREE.BoxGeometry(4, 0.15, 0.15);
    const jibMesh = new THREE.Mesh(jibGeom, glowingCoreMaterial);
    jibMesh.position.set(1.5, 3, 0);
    craneGroup.add(jibMesh);

    // Cable line hanging
    const cableGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(3, 3, 0),
        new THREE.Vector3(3, 1, 0)
    ]);
    const cable = new THREE.Line(cableGeom, goldWireMaterial);
    craneGroup.add(cable);

    skyscraperGroup.add(craneGroup);

    // Mouse movement interaction values
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX) / 100;
        mouseY = (event.clientY - windowHalfY) / 100;
    });

    // Handle touch movement on mobile
    document.addEventListener('touchmove', (event) => {
        if (event.touches.length > 0) {
            mouseX = (event.touches[0].clientX - windowHalfX) / 100;
            mouseY = (event.touches[0].clientY - windowHalfY) / 100;
        }
    });

    // Resize Handler
    function handleResize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener('resize', handleResize);

    // Simple auto-rotation and interactive lag follow animation loop
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();

        // Slow auto rotation
        skyscraperGroup.rotation.y = elapsedTime * 0.1;
        
        // Gentle bounce to feel organic
        skyscraperGroup.position.y = Math.sin(elapsedTime * 0.5) * 0.3 - 1;

        // Animate rings
        ring1.rotation.z = -elapsedTime * 0.2;
        ring2.rotation.z = elapsedTime * 0.1;
        
        // Slowly rotate crane jib
        craneGroup.rotation.y = Math.sin(elapsedTime * 0.3) * 0.8;

        // Interpolate mouse coordinates (smooth lag follow)
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;

        // Apply interactive tilting based on mouse
        skyscraperGroup.rotation.x = targetY * 0.1;
        skyscraperGroup.rotation.z = -targetX * 0.1;

        renderer.render(scene, camera);
    }

    animate();
}

/**
 * Initializes the 3D model for specific project types in their details modals
 * @param {string} canvasId - The ID of the canvas inside the modal
 * @param {string} projectType - The category of project ('residential', 'commercial', 'industrial', 'infrastructure')
 */
function initProject3D(canvasId, projectType) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // If a renderer for this canvas already exists, clean it up to prevent memory leak
    if (activeModalRenderers[canvasId]) {
        activeModalRenderers[canvasId].stop();
        delete activeModalRenderers[canvasId];
    }

    const parent = canvas.parentElement;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050c18);

    const camera = new THREE.PerspectiveCamera(45, parent.clientWidth / parent.clientHeight, 0.1, 100);
    camera.position.set(0, 6, 12);
    camera.lookAt(0, 1.5, 0);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(parent.clientWidth, parent.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Interactive Controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground
    controls.minDistance = 5;
    controls.maxDistance = 25;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const goldLight = new THREE.DirectionalLight(0xd4af37, 2);
    goldLight.position.set(5, 10, 5);
    scene.add(goldLight);

    const blueLight = new THREE.DirectionalLight(0x0077ff, 1.5);
    blueLight.position.set(-5, 3, -5);
    scene.add(blueLight);

    // Group to hold the custom model
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // Materials
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.8 });
    const blueGlassMat = new THREE.MeshStandardMaterial({ color: 0x0077ff, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.5 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.3, metalness: 0.9 });
    const lineGold = new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.9 });
    const lineBlue = new THREE.LineBasicMaterial({ color: 0x0077ff, transparent: true, opacity: 0.6 });

    // Grid Floor
    const gridHelper = new THREE.GridHelper(16, 16, 0xd4af37, 0x13223f);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Generate generative model based on category
    switch (projectType) {
        case 'residential':
            // Custom modern luxury villa architectural structure
            // Main structure block
            const baseGeom = new THREE.BoxGeometry(4, 1.5, 3);
            const baseMesh = new THREE.Mesh(baseGeom, blueGlassMat);
            baseMesh.position.set(0, 0.75, 0);
            modelGroup.add(baseMesh);

            const baseEdges = new THREE.EdgesGeometry(baseGeom);
            const baseLine = new THREE.LineSegments(baseEdges, lineGold);
            baseLine.position.copy(baseMesh.position);
            modelGroup.add(baseLine);

            // Upper cantilevered block (Offset rotating design)
            const topGeom = new THREE.BoxGeometry(3.5, 1.5, 2.5);
            const topMesh = new THREE.Mesh(topGeom, blueGlassMat);
            topMesh.position.set(0.5, 2.25, 0.3);
            modelGroup.add(topMesh);

            const topEdges = new THREE.EdgesGeometry(topGeom);
            const topLine = new THREE.LineSegments(topEdges, lineGold);
            topLine.position.copy(topMesh.position);
            modelGroup.add(topLine);

            // Slanted roof architectural element
            const roofGeom = new THREE.BoxGeometry(4.2, 0.15, 3.2);
            const roofMesh = new THREE.Mesh(roofGeom, goldMat);
            roofMesh.position.set(0.4, 3.1, 0.3);
            modelGroup.add(roofMesh);
            
            // Pool base
            const poolGeom = new THREE.BoxGeometry(2, 0.05, 1.5);
            const poolMesh = new THREE.Mesh(poolGeom, new THREE.MeshBasicMaterial({color: 0x00e1ff, transparent: true, opacity: 0.7}));
            poolMesh.position.set(-1.8, 0.03, 1);
            modelGroup.add(poolMesh);
            break;

        case 'commercial':
            // High-rise glass complex structure
            const towerHeight = 5;
            const segments = 4;
            for (let i = 0; i < segments; i++) {
                const size = 2 - i * 0.3;
                const segGeom = new THREE.BoxGeometry(size, 1.25, size);
                const segMesh = new THREE.Mesh(segGeom, blueGlassMat);
                segMesh.position.y = 0.625 + i * 1.25;
                // Alternate rotate slightly
                segMesh.rotation.y = (i * Math.PI) / 12;
                modelGroup.add(segMesh);

                const segEdges = new THREE.EdgesGeometry(segGeom);
                const segLine = new THREE.LineSegments(segEdges, lineGold);
                segLine.position.copy(segMesh.position);
                segLine.rotation.copy(segMesh.rotation);
                modelGroup.add(segLine);
            }
            break;

        case 'industrial':
            // Industrial Warehouse facility with cylinders
            // Warehouse block
            const wareGeom = new THREE.BoxGeometry(4.5, 1.8, 3.5);
            const wareMesh = new THREE.Mesh(wareGeom, steelMat);
            wareMesh.position.set(-0.5, 0.9, 0);
            modelGroup.add(wareMesh);

            const wareEdges = new THREE.EdgesGeometry(wareGeom);
            const wareLine = new THREE.LineSegments(wareEdges, lineBlue);
            wareLine.position.copy(wareMesh.position);
            modelGroup.add(wareLine);

            // Sawtooth roofs
            for (let i = 0; i < 3; i++) {
                const roofPrism = new THREE.ConeGeometry(0.7, 0.6, 4);
                roofPrism.rotation.y = Math.PI / 4;
                roofPrism.scale(1, 1, 3.5);
                roofPrism.position.set(-2.0 + i * 1.5, 2.1, 0);
                const roofM = new THREE.Mesh(roofPrism, goldMat);
                modelGroup.add(roofM);
            }

            // Industrial Cylindrical Silos
            const siloGeom = new THREE.CylinderGeometry(0.6, 0.6, 3.2, 12);
            const siloMesh1 = new THREE.Mesh(siloGeom, steelMat);
            siloMesh1.position.set(2.4, 1.6, -0.8);
            modelGroup.add(siloMesh1);

            const siloMesh2 = siloMesh1.clone();
            siloMesh2.position.set(2.4, 1.6, 0.6);
            modelGroup.add(siloMesh2);

            const siloEdges = new THREE.EdgesGeometry(siloGeom);
            const siloLine1 = new THREE.LineSegments(siloEdges, lineGold);
            siloLine1.position.copy(siloMesh1.position);
            modelGroup.add(siloLine1);

            const siloLine2 = siloLine1.clone();
            siloLine2.position.copy(siloMesh2.position);
            modelGroup.add(siloLine2);
            break;

        case 'infrastructure':
            // Suspended Cable Bridge Structure
            // Towers
            const towerGeom = new THREE.BoxGeometry(0.3, 4.5, 0.3);
            const towerLeft = new THREE.Mesh(towerGeom, goldMat);
            towerLeft.position.set(-3, 2.25, 0);
            modelGroup.add(towerLeft);

            const towerRight = towerLeft.clone();
            towerRight.position.set(3, 2.25, 0);
            modelGroup.add(towerRight);

            // Road deck
            const roadGeom = new THREE.BoxGeometry(8, 0.15, 1.2);
            const roadMesh = new THREE.Mesh(roadGeom, steelMat);
            roadMesh.position.set(0, 1.5, 0);
            modelGroup.add(roadMesh);

            const roadEdges = new THREE.EdgesGeometry(roadGeom);
            const roadLine = new THREE.LineSegments(roadEdges, lineBlue);
            roadLine.position.copy(roadMesh.position);
            modelGroup.add(roadLine);

            // Suspension cables (Generative math curves)
            const curveLeft = new THREE.QuadraticBezierCurve3(
                new THREE.Vector3(-4.5, 1.5, 0),
                new THREE.Vector3(0, 2.0, 0),
                new THREE.Vector3(4.5, 1.5, 0)
            );
            const curvePoints = curveLeft.getPoints(50);
            const curveGeom = new THREE.BufferGeometry().setFromPoints(curvePoints);
            const mainCable = new THREE.Line(curveGeom, lineGold);
            modelGroup.add(mainCable);

            // Vertical suspension hangers
            for (let x = -2.5; x <= 2.5; x += 0.5) {
                if (Math.abs(x) < 0.1) continue; // Skip center
                const hangerHeight = 2.2 - (Math.abs(x) * 0.1);
                const hangerGeom = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(x, 1.5, 0),
                    new THREE.Vector3(x, hangerHeight, 0)
                ]);
                const hanger = new THREE.Line(hangerGeom, lineBlue);
                modelGroup.add(hanger);
            }
            break;
    }

    // Set model group slightly offset up
    modelGroup.position.y = 0.2;

    // Animation flag
    let runAnimation = true;

    // Resize Handler for modal
    function handleResize() {
        const w = parent.clientWidth;
        const h = parent.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }
    
    // Add event listener to resize dynamically
    window.addEventListener('resize', handleResize);

    // Animation Loop
    function animate() {
        if (!runAnimation) return;
        requestAnimationFrame(animate);

        // Slow spin Y
        modelGroup.rotation.y += 0.005;

        // Orbit controls update
        controls.update();

        renderer.render(scene, camera);
    }

    // Start animation loop
    animate();

    // Store in global cache to clean up properly later
    activeModalRenderers[canvasId] = {
        stop: () => {
            runAnimation = false;
            window.removeEventListener('resize', handleResize);
            controls.dispose();
            renderer.dispose();
            // Dispose geometries and materials
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
