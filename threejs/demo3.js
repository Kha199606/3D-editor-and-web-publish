import * as THREE from "three";
import { GLTFLoader } from "GLTFLoader";
import { OrbitControls } from "OrbitControls";
import { RGBELoader } from "RGBELoader";

// Khởi tạo scene, camera và renderer
const scene = new THREE.Scene();

// --- Camera setup function ---
function createCamera(width, height) {
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  return camera;
}

let camera = createCamera(window.innerWidth, window.innerHeight);

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
camera.position.set(-3.79, 1.32, 12.08);
controls.update();

// Thêm ánh sáng môi trường từ HDR
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  "./model/music_hall_01_4k.hdr",
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = null;
  },
  undefined,
  (err) => {
    console.error("Lỗi khi tải HDR:", err);
  }
);

// Thêm ánh sáng bổ sung
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
scene.add(directionalLight);

directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Tải mô hình GLB
const loader = new GLTFLoader();
let mixer;
let model3D; // Store the loaded model
// Load the initial model
loadModel('./model/parking_lot.glb');

function loadModel(url) {
  loader.load(
    url,
    (gltf) => {
      if (model3D) {
        scene.remove(model3D);
      }
      model3D = gltf.scene; // Store the model in the variable
      scene.add(model3D);

      model3D.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model3D);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
      }
        // Reset controls target to model position
         if(model3D) {
            controls.target.copy(model3D.position);
            controls.update();
           }
    },
    undefined,
    (err) => {
      console.error("Lỗi khi tải GLB:", err);
    }
  );
}


// Thêm mặt phẳng nhận bóng
const planeGeometry = new THREE.PlaneGeometry(500, 500);
const planeMaterial = new THREE.ShadowMaterial({
  opacity: 0.5,
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = 0;
plane.receiveShadow = true;
scene.add(plane);

// ----- Camera View Saving and Loading Logic -----
const cameraViewNameInput = document.getElementById("camera-view-name");
const saveCameraViewButton = document.getElementById("save-camera-view");
const cameraViewList = document.getElementById("camera-view-list");
let cameraViews = [];
const defaultCameraView = {
  name: "default",
  position: camera.position.clone(),
  target: model3D ? model3D.position.clone() : new THREE.Vector3(3.14, 1.60, 1.37), // Initialize with 0,0,0 as fallback
};

cameraViews.push(defaultCameraView);
// Function to save a new camera view
function saveCameraView() {
  const viewName = cameraViewNameInput.value.trim();

  if (viewName) {
    const newView = {
      name: viewName,
      position: camera.position.clone(),
      target: controls.target.clone(), // Get orbit control target to save the lookAt value
    };

    cameraViews.push(newView);
    updateCameraViewList();
    cameraViewNameInput.value = "";
  } else {
    alert("Vui lòng nhập tên cho góc nhìn.");
  }
}

// Function to update the HTML list of saved camera views
function updateCameraViewList() {
  cameraViewList.innerHTML = "";
  cameraViews.forEach((view, index) => {
    const listItem = document.createElement("li");
    listItem.innerHTML = `
      <strong>${view.name}</strong><br>
      Position: ${formatVector3(view.position)}<br>
      Target: ${formatVector3(view.target)}
    `;
    listItem.addEventListener("click", () => {
      loadCameraView(index);
    });
    cameraViewList.appendChild(listItem);
  });
}

// Function to format Vector3 for display
function formatVector3(vector3) {
  return `(${vector3.x.toFixed(2)}, ${vector3.y.toFixed(2)}, ${vector3.z.toFixed(2)})`;
}

function loadCameraView(index) {
  const view = cameraViews[index];

  // Kiểm tra dữ liệu hợp lệ
  if (!view || !view.position || !view.target) {
    console.error("Dữ liệu camera view không hợp lệ.");
    return;
  }

  // Tạo các giá trị bắt đầu và kết thúc
  const startPosition = camera.position.clone();
  const startTarget = controls.target.clone();
  const endPosition = view.position;
  const endTarget = view.target;

  // Sử dụng THREE.Clock để tính toán thời gian chuyển
  const clock = new THREE.Clock();
  const duration = 1.5; // Thời gian chuyển (giây)

  function animateCamera() {
    const elapsedTime = clock.getElapsedTime();
    const t = Math.min(elapsedTime / duration, 1); // Tỉ lệ thời gian (giới hạn từ 0 -> 1)

    // Nội suy vị trí camera và mục tiêu
    camera.position.lerpVectors(startPosition, endPosition, t);
    controls.target.lerpVectors(startTarget, endTarget, t);
    controls.update();

    // Dừng animation khi hoàn thành
    if (t < 1) {
      requestAnimationFrame(animateCamera);
    }
  }
  // Bắt đầu animation
  clock.start();
  animateCamera();
}

// Event listener to save camera view when the button is clicked
saveCameraViewButton.addEventListener("click", saveCameraView);

// Initial list update
updateCameraViewList();
// ----- End of Camera View Saving and Loading Logic -----

// --- Model Loading Logic ---
const modelLoaderInput = document.getElementById("model-loader");

modelLoaderInput.addEventListener("change", handleModelLoad, false);

function handleModelLoad(event) {
  const file = event.target.files[0];
  const fileURL = URL.createObjectURL(file);
  loadModel(fileURL);
}
// --- End of Model Loading Logic ---

// Xử lý sự kiện thay đổi kích thước của thẻ div
window.addEventListener("resize", () => {
  // Lấy kích thước của container
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Cập nhật camera
  camera = createCamera(width, height);
  camera.position.set(-3.98, 1.49, 11.55);
  controls.object = camera;
  controls.update();

  // Cập nhật renderer
  renderer.setSize(width, height);
});

// Vòng lặp render
function animate() {
  requestAnimationFrame(animate);
  if (mixer) mixer.update(0.05);
  controls.update();
  renderer.render(scene, camera);
}

// Xử lý sự kiện khi cửa sổ thay đổi kích thước
window.addEventListener("resize", () => {
  // Cập nhật kích thước renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Cập nhật camera
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

animate();
