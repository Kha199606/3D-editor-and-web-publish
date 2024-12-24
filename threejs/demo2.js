import * as THREE from "three";
import { GLTFLoader } from "GLTFLoader";
import { OrbitControls } from "OrbitControls";
import { RGBELoader } from "RGBELoader";
import { TWEEN } from 'tween'

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
camera.position.set(0, 2, 5);
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
loadModel('./model/Blender_OCR Port Gate_Animate.glb');

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
    target: model3D ? model3D.position.clone() : new THREE.Vector3(0, 0, 0), // Initialize with 0,0,0 as fallback
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
           <div class="view-buttons">
              <button class="update-view" data-index="${index}">Update</button>
                <button class="delete-view" data-index="${index}">Delete</button>
           </div>
        `;

        listItem.querySelector('.delete-view').addEventListener("click", (event) => {
          event.stopPropagation(); // Stop event from bubbling to list item click
            deleteCameraView(index);
        });

      listItem.querySelector('.update-view').addEventListener("click", (event) => {
        event.stopPropagation();
          updateCameraView(index);
      });

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


let currentTween = null;

// Function to load a saved camera view with animation
function loadCameraView(index) {
    const view = cameraViews[index];

    if (currentTween) {
        currentTween.stop();
      }
    
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();


    currentTween = new TWEEN.Tween({
        x: startPosition.x,
        y: startPosition.y,
        z: startPosition.z,
        tx: startTarget.x,
        ty: startTarget.y,
        tz: startTarget.z
    })
      .to({
          x: view.position.x,
          y: view.position.y,
          z: view.position.z,
          tx: view.target.x,
          ty: view.target.y,
          tz: view.target.z
      }, 500)
      .onUpdate(function(obj) {
            camera.position.set(obj.x, obj.y, obj.z);
            controls.target.set(obj.tx, obj.ty, obj.tz);
        })
      .onComplete(() => {
            currentTween = null;
        })
      .start()

}

// Function to delete a camera view
function deleteCameraView(index) {
    cameraViews.splice(index, 1);
    updateCameraViewList();
}

// Function to update a camera view
function updateCameraView(index) {
  cameraViews[index].position.copy(camera.position);
  cameraViews[index].target.copy(controls.target);
    updateCameraViewList();
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
    camera.position.set(0, 2, 5);
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
    TWEEN.update();
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
