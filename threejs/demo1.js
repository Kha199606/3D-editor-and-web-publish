import * as THREE from "three";
import { GLTFLoader } from "GLTFLoader";
import { OrbitControls } from "OrbitControls";
import { RGBELoader } from "RGBELoader";
import { setupControlKit } from "./controls.js"; // Import control setup

// Khởi tạo scene, camera và renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(-3.79, 1.32, 12.08);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

// Thêm HDR ánh sáng
const rgbeLoader = new RGBELoader();
rgbeLoader.load("./model/music_hall_01_4k.hdr", (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
  scene.background = null;
});

// Tải mô hình GLB
const loader = new GLTFLoader();
let model3D;
loader.load("./model/Blender_OCR Port Gate_Animate.glb", (gltf) => {
  model3D = gltf.scene;
  scene.add(model3D);
  controls.target.copy(model3D.position);
  controls.update();
});

// Khởi tạo ControlKit
setupControlKit({
  camera,
  controls,
  scene,
  renderer,
  loadModel: (url) => loader.load(url, (gltf) => {
    scene.add(gltf.scene);
  }),
});

// Xử lý resize
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Vòng lặp render
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
