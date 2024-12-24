// Import các module cần thiết
import * as THREE from "three";
import { GLTFLoader } from "GLTFLoader";
import { OrbitControls } from "OrbitControls";
import { RGBELoader } from "RGBELoader";

// Khởi tạo scene, camera và renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true, // Nền trong suốt
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding; // Sử dụng encoding sRGB
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Tone Mapping HDR
renderer.toneMappingExposure = 1; // Điều chỉnh độ sáng
renderer.shadowMap.enabled = true; // Kích hoạt bóng đổ
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Loại bóng mịn
document.body.appendChild(renderer.domElement);

// OrbitControls để xoay camera bằng chuột
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 2, 5);
controls.update();

// Thêm ánh sáng môi trường từ HDR
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  "./model/music_hall_01_4k.hdr", // Đường dẫn tới HDR
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping; // HDR ánh xạ phản xạ
    scene.environment = texture; // Sử dụng HDR làm ánh sáng môi trường
    scene.background = null; // Đặt nền trong suốt
  },
  undefined,
  (err) => {
    console.error("Lỗi khi tải HDR:", err);
  }
);

// Thêm ánh sáng bổ sung
const directionalLight = new THREE.DirectionalLight(0xFFFBF0, 1);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true; // Kích hoạt bóng đổ từ ánh sáng
scene.add(directionalLight);

// Cấu hình bóng đổ cho ánh sáng
directionalLight.shadow.mapSize.width = 2048; // Độ phân giải bóng
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5; // Cận
directionalLight.shadow.camera.far = 50; // Xa
directionalLight.shadow.camera.left = -10; // Giới hạn không gian chiếu sáng
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;

// Ánh sáng phụ trợ (AmbientLight) để làm đều ánh sáng
const ambientLight = new THREE.AmbientLight(0xFFFBF0, 0.5); // Ánh sáng mềm
scene.add(ambientLight);

// Tải mô hình GLB
const loader = new GLTFLoader();
let mixer; // Animation mixer cho mô hình
loader.load(
  "./model/Blender_OCR Port Gate_Animate.glb", // Đường dẫn tới tệp GLB
  (gltf) => {
    const model = gltf.scene;
    scene.add(model);

    // Kích hoạt bóng đổ cho mô hình
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true; // Đổ bóng
        child.receiveShadow = true; // Nhận bóng
      }
    });

    // Nếu mô hình có animation, khởi chạy animation
    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      const action = mixer.clipAction(gltf.animations[0]);
      action.play();
    }
  },
  undefined,
  (err) => {
    console.error("Lỗi khi tải GLB:", err);
  }
);

// Thêm mặt phẳng nhận bóng (Shadow Plane)
const planeGeometry = new THREE.PlaneGeometry(500, 500);
const planeMaterial = new THREE.ShadowMaterial({
  opacity: 0.5, // Độ mờ của bóng trên mặt phẳng
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2; // Nằm ngang
plane.position.y = 0; // Đặt mặt phẳng ở đáy
plane.receiveShadow = true; // Nhận bóng
scene.add(plane);

// Cập nhật kích thước khi thay đổi cửa sổ
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Vòng lặp render
function animate() {
  requestAnimationFrame(animate);
  if (mixer) mixer.update(0.05); // Cập nhật animation
  controls.update(); // Cập nhật controls
  renderer.render(scene, camera); // Vẽ scene
}
animate();
