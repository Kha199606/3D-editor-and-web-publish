import ControlKit from "https://cdn.jsdelivr.net/npm/controlkit/build/controlkit.module.js";

export function setupControlKit({ camera, controls, scene, renderer, loadModel }) {
  const controlKit = new ControlKit();
  const cameraFolder = {
    position: camera.position.toArray(),
    target: controls.target.toArray(),
  };

  controlKit.addPanel()
    .addGroup({ label: "Camera" })
    .addSubGroup({ label: "Position" })
    .addSlider(cameraFolder, "position", "X", { min: -50, max: 50 }, (value) => camera.position.x = value)
    .addSlider(cameraFolder, "position", "Y", { min: -50, max: 50 }, (value) => camera.position.y = value)
    .addSlider(cameraFolder, "position", "Z", { min: -50, max: 50 }, (value) => camera.position.z = value)
    .addSubGroup({ label: "Target" })
    .addSlider(cameraFolder, "target", "X", { min: -50, max: 50 }, (value) => controls.target.x = value)
    .addSlider(cameraFolder, "target", "Y", { min: -50, max: 50 }, (value) => controls.target.y = value)
    .addSlider(cameraFolder, "target", "Z", { min: -50, max: 50 }, (value) => controls.target.z = value);

  controlKit.addGroup({ label: "Scene" })
    .addButton("Load Model", () => {
      const modelUrl = prompt("Enter model URL");
      if (modelUrl) loadModel(modelUrl);
    });
}
