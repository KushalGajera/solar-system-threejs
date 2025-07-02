import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Create Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); 

// Create Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 10, 50);
camera.lookAt(0, 0, 0);

// Create Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Pause/Resume Button
const pauseBtn = document.createElement('button');
pauseBtn.innerText = 'Pause';
pauseBtn.style.position = 'absolute';
pauseBtn.style.top = '10px';
pauseBtn.style.left = '10px';
pauseBtn.style.padding = '10px';
document.body.appendChild(pauseBtn);
let isPaused = false;
pauseBtn.addEventListener('click', () => {
  isPaused = !isPaused;
  pauseBtn.innerText = isPaused ? 'Resume' : 'Pause';
});

// Dark/Light Mode Toggle
const themeBtn = document.createElement('button');
themeBtn.innerText = 'Light Mode';
themeBtn.style.position = 'absolute';
themeBtn.style.top = '10px';
themeBtn.style.right = '10px';
themeBtn.style.padding = '10px';
document.body.appendChild(themeBtn);
let darkMode = true;
themeBtn.addEventListener('click', () => {
  darkMode = !darkMode;
  scene.background = new THREE.Color(darkMode ? 0x000000 : 0xffffff);
  themeBtn.innerText = darkMode ? 'Light Mode' : 'Dark Mode';
});

// Add Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lighting
const light = new THREE.PointLight(0xffffff, 2);
light.position.set(0, 0, 0);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// Stars Background
function addStars() {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 1000;
  const starVertices = [];
  for (let i = 0; i < starCount; i++) {
    const x = THREE.MathUtils.randFloatSpread(600);
    const y = THREE.MathUtils.randFloatSpread(600);
    const z = THREE.MathUtils.randFloatSpread(600);
    starVertices.push(x, y, z);
  }
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}
addStars();

// Sun
const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Planet Data
const planetData = [
  { name: "Mercury", color: 0x909090, size: 0.2, dist: 5, speed: 0.02 },       
  { name: "Venus", color: 0xeccc9a, size: 0.4, dist: 7, speed: 0.015 },       
  { name: "Earth", color: 0x2e8b57, size: 0.5, dist: 10, speed: 0.01 },        
  { name: "Mars", color: 0xb22222, size: 0.3, dist: 13, speed: 0.008 },        
  { name: "Jupiter", color: 0xd2b48c, size: 1.2, dist: 17, speed: 0.005 },     
  { name: "Saturn", color: 0xf5deb3, size: 1.0, dist: 21, speed: 0.003 },      
  { name: "Uranus", color: 0x66cccc, size: 0.8, dist: 25, speed: 0.002 },     
  { name: "Neptune", color: 0x2f4f4f, size: 0.8, dist: 29, speed: 0.0015 }     
];

// Create Planets and Orbit Lines
const labels = []; 
const planets = [];
planetData.forEach((p) => {
  const geometry = new THREE.SphereGeometry(p.size, 32, 32);
  const material = new THREE.MeshPhongMaterial({ color: p.color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = p.name;
  scene.add(mesh);

  // Create name label in 3D space
  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = 256;
  spriteCanvas.height = 64;
  const ctx = spriteCanvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.fillText(p.name, 10, 40);
  const texture = new THREE.CanvasTexture(spriteCanvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(2, 0.5, 1);
  mesh.add(sprite);
  labels.push({ sprite, planet: mesh });

  // Orbit dotted line
  const orbitPoints = [];
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    orbitPoints.push(new THREE.Vector3(
      Math.cos(angle) * p.dist,
      0,
      Math.sin(angle) * p.dist
    ));
  }
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitMaterial = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.3, gapSize: 0.2 });
  const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
  orbitLine.computeLineDistances();
  scene.add(orbitLine);

  // Tooltip (Label)
  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.color = 'white';
  div.style.display = 'none';
  div.style.pointerEvents = 'none';
  div.innerText = p.name;
  document.body.appendChild(div);
  mesh.userData.tooltip = div;

  planets.push({ mesh, angle: Math.random() * Math.PI * 2, speed: p.speed, dist: p.dist });
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Animate
function updateLabels() {
  labels.forEach(label => {
    const offsetY = 1.5;
    label.sprite.position.set(0, offsetY, 0);
  });
}
function animate() {
  requestAnimationFrame(animate);

  if (!isPaused) {
    planets.forEach((p) => {
      p.angle += p.speed;
      p.mesh.position.set(
        Math.cos(p.angle) * p.dist,
        0,
        Math.sin(p.angle) * p.dist
      );
    });
  }

  updateLabels();
  controls.update();
  renderer.render(scene, camera);

  // Handle tooltips
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));
  planets.forEach(p => p.mesh.userData.tooltip.style.display = 'none');
  if (intersects.length > 0) {
    const obj = intersects[0].object;
    const tooltip = obj.userData.tooltip;
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
    tooltip.style.display = 'block';
  }
}
animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
