import * as THREE from "three/webgl";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const PREFIX = "[SigmaBackground]";
const MODES = {
  galaxy: { colors: ["#6d5dfc", "#f5c2ff"], background: "#05040b" },
  attractors: { colors: ["#32d4ff", "#ff6b9a"], background: "#02080d" },
  halftone: { colors: ["#00d9ff", "#ffffff"], background: "#041018" },
  tinker: { colors: ["#5eead4", "#f9a8d4"], background: "#04100f" },
};

const PARTICLE_VERTEX = `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 motion = vec3(sin(uTime * .12) * .12, cos(uTime * .2) * .08, sin(uTime * .08) * .12);
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position + motion, 1.0);
  }
`;

const PARTICLE_FRAGMENT = `
  uniform vec3 colorA;
  uniform vec3 colorB;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float alpha = 1.0 - smoothstep(.34, .5, distance(vUv, vec2(.5)));
    vec3 particleColor = mix(colorA, colorB, sin(uTime * .12) * .5 + .5);
    gl_FragColor = vec4(particleColor, alpha * .9);
  }
`;

const SURFACE_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SURFACE_FRAGMENT = `
  uniform vec3 colorA;
  uniform vec3 colorB;
  uniform float uTime;
  uniform float uMode;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    float orientation = dot(normalize(vNormal), normalize(vec3(.35, 1., .6)));
    float grid = sin(gl_FragCoord.x * .12 + gl_FragCoord.y * .12) * .5 + .5;
    float halftone = step(grid, orientation * .45 + .5);
    float tinker = sin(vPosition.x * 1.8 + uTime * .45) * cos(vPosition.y * 1.4 - uTime * .3) * .5 + .5;
    vec3 halftoneColor = mix(colorA, colorB, halftone);
    vec3 tinkerColor = mix(colorB, colorA, tinker);
    gl_FragColor = vec4(mix(halftoneColor, tinkerColor, uMode), .72);
  }
`;

class ParticleBackgroundWebGL {
  constructor(options = {}) {
    this.mode = MODES[options.mode] ? options.mode : "galaxy";
    this.particleCount = options.particleCount || 9000;
    this.elapsed = 0;
    this.lastFrameTime = performance.now();
    this.destroyed = false;
    this.createScene();
    this.createObjects();
    this.createRenderer();
    this.setMode(this.mode, true);
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener("resize", this.handleResize);
    console.info(`${PREFIX} WebGL-only module loaded`, { threeRevision: THREE.REVISION });
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 100);
    this.camera.position.set(6.5, 3.5, 9);
    this.camera.lookAt(0, 0, 0);
  }

  createObjects() {
    const positions = new Float32Array(this.particleCount * 3);
    for (let index = 0; index < this.particleCount; index += 1) {
      const offset = index * 3;
      const radius = Math.pow(Math.random(), .58) * 5;
      const angle = Math.random() * Math.PI * 2;
      positions[offset] = Math.cos(angle) * radius;
      positions[offset + 1] = (Math.random() - .5) * 3;
      positions[offset + 2] = Math.sin(angle) * radius;
    }
    this.positions = positions;
    this.instanceHelper = new THREE.Object3D();
    const particleGeometry = new THREE.PlaneGeometry(.18, .18);
    this.particleMaterial = this.makeParticleMaterial();
    this.points = new THREE.InstancedMesh(particleGeometry, this.particleMaterial, this.particleCount);
    this.galaxy = new THREE.InstancedMesh(particleGeometry, this.makeParticleMaterial(), this.particleCount);
    this.writeMatrices(this.points, positions);
    this.writeMatrices(this.galaxy, positions);
    this.scene.add(this.points, this.galaxy);

    this.surfaceMaterial = new THREE.ShaderMaterial({
      uniforms: this.makeColorUniforms(),
      vertexShader: SURFACE_VERTEX,
      fragmentShader: SURFACE_FRAGMENT,
      transparent: true,
      depthWrite: false,
    });
    this.surface = new THREE.Mesh(new THREE.TorusKnotGeometry(3.2, 1.05, 160, 32), this.surfaceMaterial);
    this.surface.rotation.x = .45;
    this.scene.add(this.surface);
    this.loadWolfHead();
  }

  loadWolfHead() {
    this.wolf = new THREE.Group();
    this.wolf.visible = false;
    this.scene.add(this.wolf);
    new GLTFLoader().load(
      "./models/low-poly_wolf_head.glb",
      (gltf) => {
        const model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const scale = 5 / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(scale);
        model.position.copy(center).multiplyScalar(-scale);
        model.traverse((child) => {
          if (child.isMesh) child.material = this.surfaceMaterial;
        });
        this.wolf.add(model);
        this.wolfLoaded = true;
        this.surface.visible = this.mode === "tinker";
        this.wolf.visible = this.mode === "halftone";
        console.info(`${PREFIX} WebGL wolf halftone mesh loaded`, {
          source: "models/low-poly_wolf_head.glb",
          scale,
        });
      },
      undefined,
      (error) => console.error(`${PREFIX} WebGL wolf mesh failed`, error)
    );
  }

  makeColorUniforms() {
    const selected = MODES[this.mode];
    return {
      colorA: { value: new THREE.Color(selected.colors[0]) },
      colorB: { value: new THREE.Color(selected.colors[1]) },
      uTime: { value: 0 },
      uMode: { value: this.mode === "tinker" ? 1 : 0 },
    };
  }

  makeParticleMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        colorA: { value: new THREE.Color(MODES[this.mode].colors[0]) },
        colorB: { value: new THREE.Color(MODES[this.mode].colors[1]) },
        uTime: { value: 0 },
      },
      vertexShader: PARTICLE_VERTEX,
      fragmentShader: PARTICLE_FRAGMENT,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  writeMatrices(mesh, positions) {
    for (let index = 0; index < this.particleCount; index += 1) {
      const offset = index * 3;
      this.instanceHelper.position.set(positions[offset], positions[offset + 1], positions[offset + 2]);
      this.instanceHelper.updateMatrix();
      mesh.setMatrixAt(index, this.instanceHelper.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  createRenderer() {
    this.container = document.createElement("div");
    this.container.className = "particle-container";
    document.body.appendChild(this.container);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.container.appendChild(this.renderer.domElement);
    this.renderer.setAnimationLoop(() => this.render());
    this.handleResize();
    console.info(`${PREFIX} backend locked`, { backend: "webgl", webgpuImported: false });
  }

  setMode(mode, initial = false) {
    if (!MODES[mode]) return;
    this.mode = mode;
    const selected = MODES[mode];
    [this.particleMaterial, this.galaxy.material, this.surfaceMaterial].forEach((material) => {
      material.uniforms.colorA.value.set(selected.colors[0]);
      material.uniforms.colorB.value.set(selected.colors[1]);
    });
    this.surfaceMaterial.uniforms.uMode.value = mode === "tinker" ? 1 : 0;
    this.galaxy.visible = mode === "galaxy";
    this.points.visible = mode === "attractors";
    this.wolf.visible = mode === "halftone";
    this.surface.visible = mode === "tinker" || (mode === "halftone" && !this.wolfLoaded);
    document.documentElement.style.setProperty("--particle-background", selected.background);
    if (!initial) this.render();
  }

  updateAttractors(delta) {
    if (this.mode !== "attractors") return;
    for (let index = 0; index < this.particleCount; index += 1) {
      const offset = index * 3;
      const x = this.positions[offset];
      const y = this.positions[offset + 1];
      const z = this.positions[offset + 2];
      const radius = Math.max(1, x * x + y * y + z * z);
      this.positions[offset] += -x / radius * .0018 * delta * 60;
      this.positions[offset + 1] += -y / radius * .0018 * delta * 60;
      this.positions[offset + 2] += -z / radius * .0018 * delta * 60;
    }
    this.writeMatrices(this.points, this.positions);
  }

  render() {
    if (this.destroyed) return;
    const now = performance.now();
    const delta = Math.min((now - this.lastFrameTime) / 1000, .1);
    this.lastFrameTime = now;
    this.elapsed += delta;
    this.particleMaterial.uniforms.uTime.value = this.elapsed;
    this.galaxy.material.uniforms.uTime.value = this.elapsed;
    this.surfaceMaterial.uniforms.uTime.value = this.elapsed;
    this.updateAttractors(delta);
    this.galaxy.rotation.y += .0012;
    this.points.rotation.y += .0008;
    this.surface.rotation.y += .002;
    if (this.wolf) this.wolf.rotation.y += .002;
    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(innerWidth, innerHeight);
  }

  destroy() {
    this.destroyed = true;
    window.removeEventListener("resize", this.handleResize);
    this.renderer.setAnimationLoop(null);
    this.renderer.dispose();
    this.surface.geometry.dispose();
    this.surfaceMaterial.dispose();
    this.container.remove();
  }
}

export default ParticleBackgroundWebGL;
