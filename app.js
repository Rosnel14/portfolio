import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

/*
  HOW TO ADD A PROJECT
  1. Put your model file in assets/models/. Supported: .step/.stp, .stl, .obj, .glb/.gltf.
  2. Copy one object below and edit title, summary, tags, specs, and model.
  3. Push to GitHub Pages.

  STEP NOTE
  STEP support uses occt-import-js. For the most reliable deployment, download these files into /vendor/:
  - occt-import-js.js
  - occt-import-js.wasm
  Then set OCCT_SCRIPT_URL = "vendor/occt-import-js.js" below.
*/

//states for project media rotation
let activeProject = null; 
let activeMediaIndex = 0; 

function showProjectMedia(project, index = 0) {
  activeProject = project;
  activeMediaIndex = index;

  const media = project.media?.[activeMediaIndex];

  const projectImageView = document.getElementById("projectImageView");
  const viewerNote = document.getElementById("viewerNote");
  const explodeBtn = document.getElementById("explodeBtn");
  const resetBtn = document.getElementById("resetBtn");
  const prevMediaBtn = document.getElementById("prevMediaBtn");
  const nextMediaBtn = document.getElementById("nextMediaBtn");
  const projectFilesBtn = document.getElementById("projectFilesBtn");

  // Change this selector to match your actual 3D viewer container ID/class.
  const viewerCanvas = document.getElementById("viewerCanvas");
  const viewerContainer = document.getElementById("viewerContainer");

  if (!media) return;

  if (viewerNote) {
    viewerNote.textContent = `${activeMediaIndex + 1} / ${project.media.length} — ${media.caption || ""}`;
  }

  if (prevMediaBtn) {
    prevMediaBtn.disabled = activeMediaIndex === 0;
  }

  if (nextMediaBtn) {
    nextMediaBtn.disabled = activeMediaIndex === project.media.length - 1;
  }

  if (projectFilesBtn) {
    if (project.filesUrl) {
      projectFilesBtn.href = project.filesUrl;
      projectFilesBtn.hidden = false;
    } else {
      projectFilesBtn.hidden = true;
    }
  }

  if (media.type === "model") {
    if (projectImageView) {
      projectImageView.hidden = true;
      projectImageView.removeAttribute("src");
    }

    if (viewerContainer) {
      viewerContainer.hidden = false;
    } else if (viewerCanvas) {
      viewerCanvas.hidden = false;
    }

    if (explodeBtn) explodeBtn.hidden = false;
    if (resetBtn) resetBtn.hidden = false;

    // Use your existing model-loading function here.
    // Rename this line to match whatever your current function is called.
    loadModel(media.src);
  }

  if (media.type === "image") {
    if (viewerContainer) {
      viewerContainer.hidden = true;
    } else if (viewerCanvas) {
      viewerCanvas.hidden = true;
    }

    if (projectImageView) {
      projectImageView.src = media.src;
      projectImageView.alt = media.caption || `${project.title} image`;
      projectImageView.hidden = false;
    }

    if (explodeBtn) explodeBtn.hidden = true;
    if (resetBtn) resetBtn.hidden = true;
  }
}

const OCCT_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/occt-import-js@0.0.23/dist/occt-import-js.js";

const projects = [
  {
    title: "FSAE EV26 Battery Management System",
    role: "Circuit/PCB Design",
    summary: "Full circuit design for FSAE battery management system. Monitors voltages and temperature per-cell of a 600V, high-performance battery pack. ",
    tags: ["Altium", "FSAE", "Circuit Design"],
    specs: ["+/- 5mV Accuracy", "Robust Electrical/Thermal Protection", "Passive 300mA Balancing"],
    filesUrl: "https://www.dropbox.com/scl/fo/0dc6li80u3x4goez6ct8h/APvaKczAxmkim_tdl11qZzo?rlkey=sn6b15tolx7ej82g453ghn5bq&st=ausc9t8l&dl=1",
    model: "assets/models/BMS_2026_BOTTOM_Layout.step.glb",
    modelType: "glb",
    fallbackColor: 0xf8c557
  },
  { 
    title: "FSAE EV26 Shutdown Circuit",
    role: "Circuit/PCB Design",
    summary: "Full circuit design, simulation, and HIL testing of FSAE shutdown-circuit. Monitors status of insulation monitoring device, BMS, and brakes-systemplausability, and in the event of a fault, disconnects high-voltage battery power to the vehicle.",
   tags: ["Altium", "FSAE", "Circuit Design"],
    specs: ['Adjustable sensor bounds', '<2ms fault response time', 'AEC qualified performance'],
    model:"assets/models/SDC_EV26.step.glb",
    modelType: "glb",
    fallbackColor: 0xf8c557,
    filesUrl: "https://www.dropbox.com/scl/fo/c94r3rwnm3b018qro6p1q/AOaZ3fD6zzSAB75mwel-grA?rlkey=pnudgpir31cxjfiscrclfzz8e&st=h1f2zwsi&dl=1"
  }
];

const grid = document.querySelector("#projectGrid");
const viewerEl = document.querySelector("#cadViewer");
const viewerTitle = document.querySelector("#viewerTitle");
const viewerSummary = document.querySelector("#viewerSummary");
const specList = document.querySelector("#specList");
const viewerNote = document.querySelector("#viewerNote");
const explodeBtn = document.querySelector("#explodeBtn");
const resetBtn = document.querySelector("#resetBtn");
const projectFilesBtn = document.getElementById("projectFilesBtn");

document.getElementById("prevMediaBtn")?.addEventListener("click", () => {
  if (!activeProject) return;

  const nextIndex = Math.max(0, activeMediaIndex - 1);
  showProjectMedia(activeProject, nextIndex);
});

document.getElementById("nextMediaBtn")?.addEventListener("click", () => {
  if (!activeProject) return;

  const nextIndex = Math.min(activeProject.media.length - 1, activeMediaIndex + 1);
  showProjectMedia(activeProject, nextIndex);
});

let scene, camera, renderer, controls, activeModel;
let exploded = false;
let animationFrame;
let occtPromise;

initProjects();
initViewer();
loadProject(projects[0]);

function initProjects() {
  grid.innerHTML = projects.map((project, index) => `
    <article class="project-card" tabindex="0" data-index="${index}">
      <p class="eyebrow">${project.role}</p>
      <h3>${project.title}</h3>
      <p>${project.summary}</p>
      <ul class="tag-list">
        ${project.tags.map(tag => `<li>${tag}</li>`).join("")}
      </ul>
      <span class="card-link">Load model →</span>
    </article>
  `).join("");

  grid.querySelectorAll(".project-card").forEach(card => {
    const activate = () => {
      const project = projects[Number(card.dataset.index)];
      loadProject(project);
      document.querySelector("#viewer").scrollIntoView({ behavior: "smooth", block: "start" });
    };
    card.addEventListener("click", activate);
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") activate();
    });
  });
}

function initViewer() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x172520);

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
  camera.position.set(7, 5, 9);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(viewerEl.clientWidth, viewerEl.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  viewerEl.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.45;

  const ambient = new THREE.HemisphereLight(0xfff2d4, 0x1b2a26, 2.3);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 2.8);
  key.position.set(7, 10, 5);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xf8c557, 1.4);
  rim.position.set(-8, 3, -5);
  scene.add(rim);

  const gridHelper = new THREE.GridHelper(16, 16, 0xf8c557, 0x6a806c);
  gridHelper.position.y = -1.35;
  gridHelper.material.opacity = 0.25;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(7.5, 96),
    new THREE.MeshStandardMaterial({ color: 0x244c40, roughness: 0.92, metalness: 0.05 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.38;
  scene.add(floor);

  window.addEventListener("resize", resizeViewer);
  explodeBtn.addEventListener("click", toggleExplode);
  resetBtn.addEventListener("click", resetCamera);
  animate();
}

async function loadProject(project) {
  viewerTitle.textContent = project.title;
  viewerSummary.textContent = project.summary;
  specList.innerHTML = project.specs.map(spec => `<li>${spec}</li>`).join("");
  viewerNote.textContent = "Loading model…";
  exploded = false;
  explodeBtn.textContent = "Explode view";
  clearActiveModel();
  if (project.filesUrl) {
     projectFilesBtn.href = project.filesUrl;
     projectFilesBtn.hidden = false;
  } else {
     projectFilesBtn.hidden = true;
  }

  try {
    activeModel = await loadModel(project,0);
    scene.add(activeModel);
    prepareExplodeData(activeModel);
    frameObject(activeModel);
    viewerNote.textContent = ` Drag the model to rotate it, scroll to zoom, and use exploded view to separate parts.`;
  } catch (error) {
    console.warn(error);
    activeModel = makeFallbackModel(project.fallbackColor);
    scene.add(activeModel);
    prepareExplodeData(activeModel);
    frameObject(activeModel);
    viewerNote.textContent = `Could not load ${project.model}. Showing a placeholder. Add your real model to assets/models/ or update the project path in app.js.`;
  }
}

async function loadModel(project) {
  const extension = (project.modelType || project.model.split(".").pop()).toLowerCase();
  if (["glb", "gltf"].includes(extension)) return loadGLTF(project.model);
  if (extension === "stl") return loadSTL(project.model, project.fallbackColor);
  if (extension === "obj") return loadOBJ(project.model);
  if (["step", "stp"].includes(extension)) return loadSTEP(project.model);
  throw new Error(`Unsupported model type: ${extension}`);
}

function loadGLTF(url) {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(url, gltf => resolve(gltf.scene), undefined, reject);
  });
}

function loadSTL(url, color = 0xf8c557) {
  return new Promise((resolve, reject) => {
    new STLLoader().load(url, geometry => {
      geometry.computeVertexNormals();
      const material = new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.18 });
      resolve(new THREE.Mesh(geometry, material));
    }, undefined, reject);
  });
}

function loadOBJ(url) {
  return new Promise((resolve, reject) => {
    new OBJLoader().load(url, object => {
      object.traverse(child => {
        if (child.isMesh) child.material = new THREE.MeshStandardMaterial({ color: 0xf8c557, roughness: 0.72, metalness: 0.12 });
      });
      resolve(object);
    }, undefined, reject);
  });
}

async function loadSTEP(url) {
  const occt = await getOCCT();
  const response = await fetch(url);
  if (!response.ok) throw new Error(`STEP file not found: ${url}`);
  const buffer = new Uint8Array(await response.arrayBuffer());
  const result = occt.ReadStepFile(buffer, {
    linearUnit: "millimeter",
    linearDeflectionType: "bounding_box_ratio",
    linearDeflection: 0.0008,
    angularDeflection: 0.5
  });

  if (!result.success) throw new Error("occt-import-js could not read the STEP file.");

  const group = new THREE.Group();
  result.meshes.forEach((mesh, index) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(mesh.attributes.position.array.flat(), 3));
    if (mesh.attributes.normal) {
      geometry.setAttribute("normal", new THREE.Float32BufferAttribute(mesh.attributes.normal.array.flat(), 3));
    } else {
      geometry.computeVertexNormals();
    }
    geometry.setIndex(mesh.index.array.flat());
    geometry.computeBoundingSphere();

    const color = mesh.color ? new THREE.Color(mesh.color[0], mesh.color[1], mesh.color[2]) : new THREE.Color().setHSL(index / Math.max(result.meshes.length, 1), 0.42, 0.58);
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.68, metalness: 0.14 });
    const part = new THREE.Mesh(geometry, material);
    part.name = mesh.name || `STEP part ${index + 1}`;
    group.add(part);
  });
  return group;
}

function getOCCT() {
  if (occtPromise) return occtPromise;
  occtPromise = new Promise((resolve, reject) => {
    if (window.occtimportjs) {
      window.occtimportjs().then(resolve).catch(reject);
      return;
    }
    const script = document.createElement("script");
    script.src = OCCT_SCRIPT_URL;
    script.async = true;
    script.onload = () => window.occtimportjs().then(resolve).catch(reject);
    script.onerror = () => reject(new Error("Could not load occt-import-js. Use local vendor files for GitHub Pages reliability."));
    document.head.appendChild(script);
  });
  return occtPromise;
}

function clearActiveModel() {
  if (!activeModel) return;
  scene.remove(activeModel);
  activeModel.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach(mat => mat.dispose());
      else child.material.dispose();
    }
  });
  activeModel = null;
}

function prepareExplodeData(root) {
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length();
  const distance = Math.max(size * 0.18, 0.45);

  root.traverse(child => {
    if (!child.isMesh) return;
    child.userData.home = child.position.clone();
    const childCenter = new THREE.Box3().setFromObject(child).getCenter(new THREE.Vector3());
    const direction = childCenter.sub(center);
    if (direction.lengthSq() < 0.0001) direction.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    direction.normalize();
    child.userData.exploded = child.position.clone().add(direction.multiplyScalar(distance));
  });
}

function toggleExplode() {
  if (!activeModel) return;
  exploded = !exploded;
  explodeBtn.textContent = exploded ? "Collapse view" : "Explode view";
  activeModel.traverse(child => {
    if (child.isMesh && child.userData.home && child.userData.exploded) {
      child.userData.target = exploded ? child.userData.exploded : child.userData.home;
    }
  });
}

function resetCamera() {
  if (activeModel) frameObject(activeModel);
}

function frameObject(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 1);
  const distance = maxDim * 2.15;

  controls.target.copy(center);
  camera.position.set(center.x + distance, center.y + distance * 0.62, center.z + distance);
  camera.near = Math.max(distance / 100, 0.01);
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  controls.update();
}

function makeFallbackModel(color = 0xf8c557) {
  const group = new THREE.Group();
  const materials = [
    new THREE.MeshStandardMaterial({ color, roughness: 0.74, metalness: 0.16 }),
    new THREE.MeshStandardMaterial({ color: 0x417563, roughness: 0.86, metalness: 0.06 }),
    new THREE.MeshStandardMaterial({ color: 0xb75445, roughness: 0.78, metalness: 0.12 })
  ];

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.55, 1.65), materials[0]);
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.16, 1.95), materials[1]);
  board.position.y = -0.45;
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.28, 32), materials[2]);
  knob.rotation.x = Math.PI / 2;
  knob.position.set(0.75, 0.02, 0.92);

  for (let i = 0; i < 4; i++) {
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 18), materials[2]);
    screw.position.set(i < 2 ? -1.12 : 1.12, 0.34, i % 2 ? -0.62 : 0.62);
    group.add(screw);
  }

  group.add(body, board, knob);
  return group;
}

function resizeViewer() {
  const width = viewerEl.clientWidth;
  const height = viewerEl.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  animationFrame = requestAnimationFrame(animate);
  if (activeModel) {
    activeModel.traverse(child => {
      if (child.isMesh && child.userData.target) {
        child.position.lerp(child.userData.target, 0.09);
      }
    });
  }
  controls.update();
  renderer.render(scene, camera);
}
