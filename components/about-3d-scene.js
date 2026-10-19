'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// -------------------------------------------------------------
// Procedural Canvas Texture Generators for Realistic Planets
// -------------------------------------------------------------

function createSunTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Multi-tier solar plasma gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#ff4500');
  grad.addColorStop(0.25, '#ff8c00');
  grad.addColorStop(0.5, '#ffd700');
  grad.addColorStop(0.75, '#ff8c00');
  grad.addColorStop(1, '#ff3700');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Solar turbulence / granulation noise
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const r = Math.random() * 12 + 2;
    const alpha = Math.random() * 0.35 + 0.1;
    ctx.fillStyle =
      Math.random() > 0.4 ? `rgba(255, 255, 220, ${alpha})` : `rgba(200, 40, 0, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

function createEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Deep ocean blue base
  ctx.fillStyle = '#0c2340';
  ctx.fillRect(0, 0, 1024, 512);

  // Oceanic depth gradients
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const r = Math.random() * 120 + 30;
    const grad = ctx.createRadialGradient(x, y, 10, x, y, r);
    grad.addColorStop(0, '#1a4980');
    grad.addColorStop(1, '#0c2340');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Continental landmasses (Eurasia, Americas, Africa silhouettes)
  const drawContinent = (cx, cy, rx, ry, col1, col2) => {
    ctx.save();
    ctx.translate(cx, cy);
    for (let j = 0; j < 14; j++) {
      const px = (Math.random() - 0.5) * rx * 1.4;
      const py = (Math.random() - 0.5) * ry * 1.4;
      const rad = Math.random() * (rx * 0.4) + 15;
      ctx.fillStyle = Math.random() > 0.4 ? col1 : col2;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  // Eurasia & Africa
  drawContinent(550, 200, 180, 110, '#2d6a4f', '#52b788');
  drawContinent(520, 320, 120, 130, '#b08968', '#40916c');

  // Americas
  drawContinent(220, 180, 120, 110, '#2d6a4f', '#40916c');
  drawContinent(280, 340, 100, 130, '#1b4332', '#74c69d');

  // Australia & East Asia
  drawContinent(820, 330, 90, 70, '#b08968', '#936639');
  drawContinent(780, 180, 110, 80, '#2d6a4f', '#40916c');

  // Polar ice caps
  ctx.fillStyle = '#f0f8ff';
  ctx.fillRect(0, 0, 1024, 25);
  ctx.fillRect(0, 487, 1024, 25);

  return new THREE.CanvasTexture(canvas);
}

function createEarthCloudsTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 1024, 512);

  // Swirling white clouds with transparency
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const rx = Math.random() * 80 + 20;
    const ry = Math.random() * 25 + 5;
    const alpha = Math.random() * 0.45 + 0.15;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, Math.random() * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

function createJupiterTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base atmosphere
  ctx.fillStyle = '#e0c9a6';
  ctx.fillRect(0, 0, 1024, 512);

  // Alternating turbulent bands
  const bands = [
    { y: 30, h: 40, col: '#a35d39' },
    { y: 70, h: 25, col: '#d4a373' },
    { y: 95, h: 45, col: '#8d4925' },
    { y: 140, h: 50, col: '#ecd9c6' },
    { y: 190, h: 65, col: '#b86b3f' },
    { y: 255, h: 50, col: '#e8d2b8' },
    { y: 305, h: 70, col: '#9c522b' },
    { y: 375, h: 40, col: '#d9a97d' },
    { y: 415, h: 65, col: '#7a3e1d' },
  ];

  bands.forEach((b) => {
    ctx.fillStyle = b.col;
    ctx.fillRect(0, b.y, 1024, b.h);

    // Turbulent edges
    for (let x = 0; x < 1024; x += 15) {
      const perturb = Math.sin(x * 0.03) * 8 + Math.cos(x * 0.08) * 4;
      ctx.fillRect(x, b.y + perturb, 20, b.h);
    }
  });

  // The Great Red Spot (Jupiter's iconic storm)
  const spotX = 620;
  const spotY = 320;
  const spotGrad = ctx.createRadialGradient(spotX, spotY, 5, spotX, spotY, 55);
  spotGrad.addColorStop(0, '#c1440e');
  spotGrad.addColorStop(0.7, '#d65a31');
  spotGrad.addColorStop(1, 'rgba(180, 80, 40, 0)');
  ctx.fillStyle = spotGrad;
  ctx.beginPath();
  ctx.ellipse(spotX, spotY, 55, 32, 0.1, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

function createSaturnTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Muted golden ochre banded atmosphere
  ctx.fillStyle = '#e8d8b0';
  ctx.fillRect(0, 0, 1024, 512);

  const colors = ['#dfcb9b', '#cfb680', '#e5d7ad', '#c5ab73', '#ecdcb4', '#bfa268'];
  for (let y = 0; y < 512; y += 12) {
    ctx.fillStyle = colors[(y / 12) % colors.length];
    ctx.fillRect(0, y, 1024, 12);
  }

  return new THREE.CanvasTexture(canvas);
}

function createSaturnRingsTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  // Radial concentric ring gradient with Cassini division
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0.0, 'rgba(190, 170, 130, 0.0)');
  grad.addColorStop(0.1, 'rgba(215, 195, 155, 0.85)');
  grad.addColorStop(0.35, 'rgba(180, 160, 120, 0.75)');
  grad.addColorStop(0.52, 'rgba(140, 120, 90, 0.9)');
  // Cassini Division (transparent dark gap)
  grad.addColorStop(0.58, 'rgba(20, 20, 30, 0.05)');
  grad.addColorStop(0.62, 'rgba(20, 20, 30, 0.05)');
  // Outer Ring A
  grad.addColorStop(0.66, 'rgba(195, 175, 140, 0.8)');
  grad.addColorStop(0.88, 'rgba(170, 150, 115, 0.6)');
  grad.addColorStop(1.0, 'rgba(150, 130, 100, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.rotation = Math.PI / 2;
  return texture;
}

function createMarsTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Red planet rust base
  ctx.fillStyle = '#b33918';
  ctx.fillRect(0, 0, 1024, 512);

  // Dark volcanic plains / craters (Syrtis Major)
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const r = Math.random() * 70 + 20;
    const grad = ctx.createRadialGradient(x, y, 5, x, y, r);
    grad.addColorStop(0, '#662211');
    grad.addColorStop(1, 'rgba(179, 57, 24, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Northern & Southern polar ice caps
  ctx.fillStyle = '#fffaf0';
  ctx.fillRect(0, 0, 1024, 20);
  ctx.fillRect(0, 492, 1024, 20);

  return new THREE.CanvasTexture(canvas);
}

function createMercuryTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#7a7672';
  ctx.fillRect(0, 0, 512, 256);

  // Surface craters
  for (let i = 0; i < 180; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    const r = Math.random() * 15 + 3;
    ctx.fillStyle = Math.random() > 0.5 ? '#4f4c49' : '#a39f99';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

function createVenusTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Warm golden sulphuric cloud haze
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#d9ab55');
  grad.addColorStop(0.5, '#edd298');
  grad.addColorStop(1, '#c9963e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = 'rgba(255, 235, 180, 0.2)';
    ctx.fillRect(0, Math.random() * 256, 512, Math.random() * 20 + 5);
  }

  return new THREE.CanvasTexture(canvas);
}

function createNeptuneTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Deep azure blue ice giant
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#1e3d7b');
  grad.addColorStop(0.5, '#2762b3');
  grad.addColorStop(1, '#152952');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Storm bands & Great Dark Spot
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillRect(0, 110, 512, 6);
  ctx.fillRect(0, 160, 512, 4);

  return new THREE.CanvasTexture(canvas);
}

// -------------------------------------------------------------
// Solar System Ecosystem Mapping (7 Components + Central Core)
// -------------------------------------------------------------
const SOLAR_NODES = [
  {
    id: 'commands',
    name: 'Commands',
    planetName: 'Mercury',
    tagline: 'Instant Slash Productivity',
    hex: '#a39f99',
    count: '288',
    orbitRadius: 2.7,
    size: 0.26,
    speed: 0.9,
    angleOffset: 0.4,
    badge: 'Fast & Agile',
    description:
      'Zero-latency prompt shortcuts (/plan, /test, /boost) triggering complex agent reasoning chains with a single keystroke.',
    textureFunc: createMercuryTexture,
  },
  {
    id: 'settings',
    name: 'Settings',
    planetName: 'Venus',
    tagline: 'Rules & Guardrails Engine',
    hex: '#f59e0b',
    count: '76',
    orbitRadius: 3.7,
    size: 0.36,
    speed: 0.72,
    angleOffset: 1.8,
    badge: 'Golden Invariants',
    description:
      'Deterministic policies and project rules (.cursorrules) enforcing code standards, security invariants, and runtime model parameters.',
    textureFunc: createVenusTexture,
  },
  {
    id: 'skills',
    name: 'Skills',
    planetName: 'Earth',
    tagline: 'Standardized SOPs & Knowledge',
    hex: '#38bdf8',
    count: '891',
    orbitRadius: 5.0,
    size: 0.45,
    speed: 0.58,
    angleOffset: 3.2,
    badge: 'Lifeblood of Agents',
    description:
      'Standardized operational manuals (SKILL.md) enabling AI agents to read, reason, and execute production code workflows with zero hallucinations.',
    textureFunc: createEarthTexture,
    hasClouds: true,
  },
  {
    id: 'hooks',
    name: 'Hooks',
    planetName: 'Mars',
    tagline: 'Automated Lifecycle Guards',
    hex: '#f43f5e',
    count: '63',
    orbitRadius: 6.3,
    size: 0.32,
    speed: 0.48,
    angleOffset: 4.5,
    badge: 'Red Sentinel',
    description:
      'Pre-tool and post-write interceptors that block destructive shell commands, format code upon file write, and validate git states.',
    textureFunc: createMarsTexture,
  },
  {
    id: 'agents',
    name: 'Agents',
    planetName: 'Jupiter',
    tagline: 'Autonomous Specialized Personas',
    hex: '#eab308',
    count: '422',
    orbitRadius: 8.0,
    size: 0.78,
    speed: 0.36,
    angleOffset: 5.6,
    badge: 'Powerhouse Colossus',
    description:
      'Isolated, role-based AI subagents (Security Auditors, Code Reviewers, Deep Researchers) running concurrently across branches.',
    textureFunc: createJupiterTexture,
  },
  {
    id: 'mcps',
    name: 'MCPs',
    planetName: 'Saturn',
    tagline: 'Model Context Protocol Servers',
    hex: '#e2d4a8',
    count: '107',
    orbitRadius: 10.0,
    size: 0.65,
    speed: 0.28,
    angleOffset: 0.9,
    badge: 'Ringed Bridges',
    description:
      'Secure bidirectional bridges connecting models directly to local Postgres databases, GitHub APIs, Chrome DevTools, and filesystem IO.',
    textureFunc: createSaturnTexture,
    hasRings: true,
  },
  {
    id: 'mods',
    name: 'Mods',
    planetName: 'Neptune',
    tagline: 'UI/UX & Terminal Customizations',
    hex: '#3b82f6',
    count: '44',
    orbitRadius: 11.8,
    size: 0.46,
    speed: 0.22,
    angleOffset: 2.4,
    badge: 'Deep Space Skins',
    description:
      'Tailored terminal aesthetic mods, interactive spinners, ambient sound chimes, and enhanced visual feedback for agent sessions.',
    textureFunc: createNeptuneTexture,
  },
];

export function About3DScene({ selectedNodeId, onSelectNode, onIntroComplete }) {
  const containerRef = useRef(null);
  const [isSupported, setIsSupported] = useState(true);

  const onSelectNodeRef = useRef(onSelectNode);
  useEffect(() => {
    onSelectNodeRef.current = onSelectNode;
  }, [onSelectNode]);

  const selectedNodeIdRef = useRef(selectedNodeId);
  useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId;
  }, [selectedNodeId]);

  const onIntroCompleteRef = useRef(onIntroComplete);
  useEffect(() => {
    onIntroCompleteRef.current = onIntroComplete;
  }, [onIntroComplete]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setIsSupported(false);
        return;
      }
    } catch {
      setIsSupported(false);
      return;
    }

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04060c, 0.025);

    // 2. Camera setup - starts in close-up near Sun and inner planets!
    const camera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / container.clientHeight,
      0.1,
      150,
    );
    camera.position.set(0, 1.2, 4.2);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 4. Lighting: Central Sun acts as the primary light source!
    const sunLight = new THREE.PointLight(0xfff5e6, 3.8, 45, 0.8);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x182035, 0.7);
    scene.add(ambientLight);

    // Subtle galactic rim light from top
    const rimLight = new THREE.DirectionalLight(0x5065a8, 0.8);
    rimLight.position.set(-10, 15, -10);
    scene.add(rimLight);

    // 5. The Central Sun (Fiery Glowing Star)
    const sunGroup = new THREE.Group();
    scene.add(sunGroup);

    const sunGeo = new THREE.SphereGeometry(1.4, 64, 64);
    const sunTexture = createSunTexture();
    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTexture,
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunGroup.add(sunMesh);

    // Solar Corona Glow Shell
    const coronaGeo = new THREE.SphereGeometry(1.65, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    sunGroup.add(coronaMesh);

    // Outer Solar Flare Halo
    const haloGeo = new THREE.SphereGeometry(2.0, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xff5500,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    sunGroup.add(haloMesh);

    // 6. Orbiting Realistic Planets
    const planetsGroup = new THREE.Group();
    scene.add(planetsGroup);

    const planetMeshes = [];
    const orbitRings = [];
    const disposableTextures = [sunTexture];

    SOLAR_NODES.forEach((node) => {
      // Realistic thin orbit ring (matching reference image)
      const ringGeo = new THREE.RingGeometry(
        node.orbitRadius - 0.015,
        node.orbitRadius + 0.015,
        128,
      );
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x64748b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.22,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      scene.add(ringMesh);
      orbitRings.push({ mesh: ringMesh, baseOpacity: 0.22, node });

      // Planet Sphere
      const planetGeo = new THREE.SphereGeometry(node.size, 48, 48);
      const planetTex = node.textureFunc();
      disposableTextures.push(planetTex);

      const planetMat = new THREE.MeshStandardMaterial({
        map: planetTex,
        roughness: 0.7,
        metalness: 0.1,
      });
      const planetMesh = new THREE.Mesh(planetGeo, planetMat);
      planetMesh.userData = { node };

      // Optional Earth Clouds layer
      let cloudMesh = null;
      if (node.hasClouds) {
        const cloudGeo = new THREE.SphereGeometry(node.size * 1.025, 48, 48);
        const cloudTex = createEarthCloudsTexture();
        disposableTextures.push(cloudTex);

        const cloudMat = new THREE.MeshStandardMaterial({
          map: cloudTex,
          transparent: true,
          opacity: 0.85,
          blending: THREE.NormalBlending,
        });
        cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
        planetMesh.add(cloudMesh);
      }

      // Optional Saturn Concentric Rings
      let saturnRingsMesh = null;
      if (node.hasRings) {
        const satRingsGeo = new THREE.RingGeometry(node.size * 1.35, node.size * 2.5, 96);
        const satRingsTex = createSaturnRingsTexture();
        disposableTextures.push(satRingsTex);

        // Map texture to rings
        const satRingsMat = new THREE.MeshBasicMaterial({
          map: satRingsTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.88,
        });
        saturnRingsMesh = new THREE.Mesh(satRingsGeo, satRingsMat);
        saturnRingsMesh.rotation.x = Math.PI / 2 + 0.35; // 20-degree tilt like real Saturn
        planetMesh.add(saturnRingsMesh);
      }

      // Planet Selection Glow Shell
      const selectionGlowGeo = new THREE.SphereGeometry(node.size * 1.3, 24, 24);
      const selectionGlowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(node.hex),
        wireframe: true,
        transparent: true,
        opacity: 0.0,
      });
      const selectionGlowMesh = new THREE.Mesh(selectionGlowGeo, selectionGlowMat);
      planetMesh.add(selectionGlowMesh);

      planetsGroup.add(planetMesh);
      planetMeshes.push({
        mesh: planetMesh,
        cloudMesh,
        selectionGlowMesh,
        node,
        angle: node.angleOffset,
      });
    });

    // 7. Multi-Layer 3D Depth Starfields with Parallax Motion
    // Layer 1: Near Floating Stardust (radius 8 - 28) - reacts with strong depth parallax when orbiting
    const nearStarCount = 650;
    const nearStarGeo = new THREE.BufferGeometry();
    const nearStarPos = new Float32Array(nearStarCount * 3);
    const nearStarColors = new Float32Array(nearStarCount * 3);

    for (let i = 0; i < nearStarCount; i++) {
      const r = 8 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      nearStarPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      nearStarPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
      nearStarPos[i * 3 + 2] = r * Math.cos(phi);

      const rand = Math.random();
      if (rand < 0.4) {
        nearStarColors[i * 3] = 0.55;
        nearStarColors[i * 3 + 1] = 0.88;
        nearStarColors[i * 3 + 2] = 1.0; // Cyan stardust
      } else if (rand < 0.7) {
        nearStarColors[i * 3] = 1.0;
        nearStarColors[i * 3 + 1] = 0.85;
        nearStarColors[i * 3 + 2] = 0.5; // Amber stardust
      } else {
        nearStarColors[i * 3] = 1.0;
        nearStarColors[i * 3 + 1] = 1.0;
        nearStarColors[i * 3 + 2] = 1.0; // Pure white
      }
    }
    nearStarGeo.setAttribute('position', new THREE.BufferAttribute(nearStarPos, 3));
    nearStarGeo.setAttribute('color', new THREE.BufferAttribute(nearStarColors, 3));
    const nearStarMat = new THREE.PointsMaterial({
      size: 0.13,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const nearStarField = new THREE.Points(nearStarGeo, nearStarMat);
    scene.add(nearStarField);

    // Layer 2: Mid-Field Constellations (radius 30 - 75)
    const midStarCount = 1500;
    const midStarGeo = new THREE.BufferGeometry();
    const midStarPos = new Float32Array(midStarCount * 3);
    const midStarColors = new Float32Array(midStarCount * 3);
    for (let i = 0; i < midStarCount; i++) {
      const r = 30 + Math.random() * 45;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      midStarPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      midStarPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
      midStarPos[i * 3 + 2] = r * Math.cos(phi);

      midStarColors[i * 3] = 0.8 + Math.random() * 0.2;
      midStarColors[i * 3 + 1] = 0.85 + Math.random() * 0.15;
      midStarColors[i * 3 + 2] = 1.0;
    }
    midStarGeo.setAttribute('position', new THREE.BufferAttribute(midStarPos, 3));
    midStarGeo.setAttribute('color', new THREE.BufferAttribute(midStarColors, 3));
    const midStarMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    const midStarField = new THREE.Points(midStarGeo, midStarMat);
    scene.add(midStarField);

    // Layer 3: Deep Galactic Cosmic Dust (radius 80 - 130)
    const deepStarCount = 2200;
    const deepStarGeo = new THREE.BufferGeometry();
    const deepStarPos = new Float32Array(deepStarCount * 3);
    const deepStarColors = new Float32Array(deepStarCount * 3);
    for (let i = 0; i < deepStarCount; i++) {
      const r = 80 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      deepStarPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      deepStarPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.35; // Milky Way flattened disc
      deepStarPos[i * 3 + 2] = r * Math.cos(phi);

      deepStarColors[i * 3] = 0.7 + Math.random() * 0.3;
      deepStarColors[i * 3 + 1] = 0.75 + Math.random() * 0.25;
      deepStarColors[i * 3 + 2] = 0.95;
    }
    deepStarGeo.setAttribute('position', new THREE.BufferAttribute(deepStarPos, 3));
    deepStarGeo.setAttribute('color', new THREE.BufferAttribute(deepStarColors, 3));
    const deepStarMat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
    });
    const deepStarField = new THREE.Points(deepStarGeo, deepStarMat);
    scene.add(deepStarField);

    // 8. Interaction & Mouse Parallax
    const mouse = new THREE.Vector2(-999, -999);
    const parallaxOffset = new THREE.Vector3(0, 0, 0);
    const raycaster = new THREE.Raycaster();
    let hoveredNode = null;

    const onMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      mouse.x = x;
      mouse.y = y;

      parallaxOffset.x = x * 2.4;
      parallaxOffset.y = y * 1.5;
    };

    const onClick = (event) => {
      const rect = container.getBoundingClientRect();
      const clientX =
        event.clientX !== undefined
          ? event.clientX
          : event.changedTouches && event.changedTouches[0]
            ? event.changedTouches[0].clientX
            : 0;
      const clientY =
        event.clientY !== undefined
          ? event.clientY
          : event.changedTouches && event.changedTouches[0]
            ? event.changedTouches[0].clientY
            : 0;
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(
        planetMeshes.map((p) => p.mesh),
        false,
      );

      if (intersects.length > 0) {
        const clicked = intersects[0].object.userData.node;
        if (clicked && onSelectNodeRef.current) {
          onSelectNodeRef.current(clicked.id);
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    container.addEventListener('click', onClick);

    // Touch support for mobile dragging
    let touchStartX = 0;
    let touchStartY = 0;
    const onTouchStart = (e) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length > 0) {
        const deltaX = (e.touches[0].clientX - touchStartX) / window.innerWidth;
        const deltaY = (e.touches[0].clientY - touchStartY) / window.innerHeight;
        parallaxOffset.x = deltaX * 3.5;
        parallaxOffset.y = deltaY * 2.0;
      }
    };
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 9. Animation Loop with Cinematic Opening Zoom-Out & Dynamic Parallax Stars
    let animationFrameId;
    const clock = new THREE.Clock();
    let introStartTime = null;
    const INTRO_DURATION = 5.2; // 5.2 seconds full 360-degree orbital zoom-out
    let introTriggered = false;

    // Helper to calculate responsive camera dimensions across mobile, tablet, desktop
    const getResponsiveCameraMetrics = () => {
      const aspect = container ? container.clientWidth / Math.max(container.clientHeight, 1) : 1;
      if (aspect < 0.72) {
        // Mobile portrait (e.g. 390x844): pull back camera so all 7 orbits fit vertically
        return {
          radiusClose: 5.5,
          heightClose: 1.6,
          radiusTarget: 24.0,
          heightTarget: 7.2,
        };
      }
      if (aspect < 1.05) {
        // Tablet / Square screens
        return {
          radiusClose: 4.8,
          heightClose: 1.4,
          radiusTarget: 19.5,
          heightTarget: 5.8,
        };
      }
      // Standard Desktop widescreen
      return {
        radiusClose: 4.2,
        heightClose: 1.2,
        radiusTarget: 15.0,
        heightTarget: 4.8,
      };
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const delta = clock.getDelta();

      if (introStartTime === null) {
        introStartTime = elapsedTime;
      }

      const introElapsed = elapsedTime - introStartTime;
      const introProgress = Math.min(introElapsed / INTRO_DURATION, 1.0);
      const { radiusClose, heightClose, radiusTarget, heightTarget } = getResponsiveCameraMetrics();

      let currentCameraAngle = 0;

      if (introProgress < 1.0) {
        // Smooth cubic ease-in-out curve for cinematic orbital acceleration and deceleration
        const ease =
          introProgress < 0.5
            ? 4 * introProgress * introProgress * introProgress
            : 1 - Math.pow(-2 * introProgress + 2, 3) / 2;

        // Complete a full 360-degree orbital revolution (2 * PI) around the solar system!
        currentCameraAngle = ease * Math.PI * 2;

        // Smoothly expand radius and height based on responsive screen metrics
        const radius = radiusClose + (radiusTarget - radiusClose) * ease;
        const height = heightClose + (heightTarget - heightClose) * ease;

        // Position camera on orbital fly-around path
        camera.position.x = Math.sin(currentCameraAngle) * radius + parallaxOffset.x * ease * 0.2;
        camera.position.z = Math.cos(currentCameraAngle) * radius;
        camera.position.y = height + parallaxOffset.y * ease * 0.2;

        // Dynamic starfield streaming velocity during 360-degree revolution!
        nearStarField.rotation.y = elapsedTime * 0.05 - currentCameraAngle * 0.35;
        nearStarField.rotation.x = Math.sin(elapsedTime * 0.5) * 0.08;
        midStarField.rotation.y = elapsedTime * 0.02 - currentCameraAngle * 0.12;
        deepStarField.rotation.y = elapsedTime * 0.006 - currentCameraAngle * 0.03;

        // Twinkle effect on floating stars
        nearStarMat.size = 0.13 + Math.sin(elapsedTime * 4.5) * 0.04;
        midStarMat.size = 0.08 + Math.sin(elapsedTime * 3.2 + 1.2) * 0.02;

        // Trigger context reveal at 82% of the revolution so it blooms in as camera docks
        if (introProgress >= 0.82 && !introTriggered) {
          introTriggered = true;
          if (onIntroCompleteRef.current) {
            onIntroCompleteRef.current();
          }
        }
      } else {
        // Intro complete: smooth responsive parallax around front overview position
        if (!introTriggered) {
          introTriggered = true;
          if (onIntroCompleteRef.current) {
            onIntroCompleteRef.current();
          }
        }
        const desiredPos = new THREE.Vector3(
          parallaxOffset.x,
          heightTarget + parallaxOffset.y,
          radiusTarget,
        );
        camera.position.lerp(desiredPos, 0.05);

        // Continuous subtle drifting of starfields with mouse/touch parallax reaction
        nearStarField.rotation.y = elapsedTime * 0.025 + parallaxOffset.x * 0.02;
        nearStarField.position.x = parallaxOffset.x * 0.35;
        nearStarField.position.y = parallaxOffset.y * 0.35;

        midStarField.rotation.y = elapsedTime * 0.012 + parallaxOffset.x * 0.01;
        midStarField.position.x = parallaxOffset.x * 0.15;
        midStarField.position.y = parallaxOffset.y * 0.15;

        deepStarField.rotation.y = elapsedTime * 0.004;

        // Subtle twinkle on near and mid stars
        nearStarMat.size = 0.13 + Math.sin(elapsedTime * 3.0) * 0.03;
        midStarMat.size = 0.08 + Math.sin(elapsedTime * 2.2 + 1.0) * 0.015;
      }

      camera.lookAt(0, 0.5, 0);

      // Rotate Sun and Corona
      sunMesh.rotation.y = elapsedTime * 0.08;
      coronaMesh.rotation.y = -elapsedTime * 0.05;
      haloMesh.rotation.z = elapsedTime * 0.03;
      sunLight.intensity = 3.6 + Math.sin(elapsedTime * 3) * 0.35;

      // Rotate & Orbit Planets
      const currentSelected = selectedNodeIdRef.current;

      planetMeshes.forEach((p) => {
        // Advance orbital angle
        p.angle += delta * p.node.speed * 0.38;

        const x = Math.cos(p.angle) * p.node.orbitRadius;
        const z = Math.sin(p.angle) * p.node.orbitRadius;
        p.mesh.position.set(x, 0, z);

        // Self rotation on axis
        p.mesh.rotation.y += delta * 1.2;

        if (p.cloudMesh) {
          // Earth clouds rotate slightly faster
          p.cloudMesh.rotation.y += delta * 1.5;
        }

        // Selection highlight
        const isSelected = currentSelected === p.node.id;
        if (isSelected) {
          p.selectionGlowMesh.material.opacity = 0.85;
          p.mesh.scale.setScalar(1.28);
        } else {
          p.selectionGlowMesh.material.opacity = 0.0;
          p.mesh.scale.setScalar(1.0);
        }
      });

      // Orbit rings pulsation & emphasis
      orbitRings.forEach(({ mesh, baseOpacity, node }) => {
        const isSelected = currentSelected === node.id;
        if (isSelected) {
          mesh.material.opacity = 0.65;
        } else {
          mesh.material.opacity =
            baseOpacity + Math.sin(elapsedTime * 1.5 + node.orbitRadius) * 0.04;
        }
      });

      // Raycast hover check
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(
        planetMeshes.map((p) => p.mesh),
        false,
      );

      if (intersects.length > 0) {
        const hovered = intersects[0].object.userData.node;
        if (hovered !== hoveredNode) {
          hoveredNode = hovered;
          document.body.style.cursor = 'pointer';
        }
      } else {
        if (hoveredNode !== null) {
          hoveredNode = null;
          document.body.style.cursor = 'default';
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('click', onClick);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      document.body.style.cursor = 'default';

      // Dispose textures
      disposableTextures.forEach((tex) => tex.dispose());

      // Dispose geometries & materials
      sunGeo.dispose();
      sunMat.dispose();
      coronaGeo.dispose();
      coronaMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      nearStarGeo.dispose();
      nearStarMat.dispose();
      midStarGeo.dispose();
      midStarMat.dispose();
      deepStarGeo.dispose();
      deepStarMat.dispose();

      planetMeshes.forEach((p) => {
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        if (p.cloudMesh) {
          p.cloudMesh.geometry.dispose();
          p.cloudMesh.material.dispose();
        }
        p.selectionGlowMesh.geometry.dispose();
        p.selectionGlowMesh.material.dispose();
      });

      orbitRings.forEach(({ mesh }) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });

      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-screen">
      <div ref={containerRef} className="absolute inset-0 w-full h-full select-none" />

      {!isSupported && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center bg-[#070a12]/90 backdrop-blur-md">
          <div className="max-w-md p-6 rounded-2xl border border-red-500/30 bg-red-950/20 text-slate-200">
            <h3 className="text-lg font-bold text-red-400">WebGL Acceleration Unavailable</h3>
            <p className="mt-2 text-sm text-slate-400">
              Your browser or graphics card does not currently support WebGL rendering. You can
              still browse the ecosystem cards below.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export { SOLAR_NODES };
