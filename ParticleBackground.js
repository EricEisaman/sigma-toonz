import * as THREE from "three/webgpu";
import { WebGLRenderer } from "three/webgl";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  color,
  cos,
  float,
  mix,
  normalWorld,
  output,
  positionLocal,
  range,
  rotate,
  screenCoordinate,
  screenSize,
  sin,
  time,
  TWO_PI,
  uniform,
  uv,
  vec3,
  vec4,
} from "three/tsl";

const DEBUG_PREFIX = "[SigmaBackground]";
console.info(`${DEBUG_PREFIX} module loaded`, {
  threeRevision: THREE.REVISION,
  webgpu: Boolean(navigator.gpu),
});

const MODES = {
  galaxy: { colors: ["#6d5dfc", "#f5c2ff"], background: "#05040b" },
  attractors: { colors: ["#32d4ff", "#ff6b9a"], background: "#02080d" },
  halftone: { colors: ["#00d9ff", "#ffffff"], background: "#041018" },
  tinker: { colors: ["#5eead4", "#f9a8d4"], background: "#04100f" },
};

const WEBGL_PARTICLE_VERTEX = `
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec3 motion = vec3(
      sin(uTime * 0.12) * 0.12,
      cos(uTime * 0.204) * 0.08,
      sin(uTime * 0.084) * 0.12
    );
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position + motion, 1.0);
  }
`;

const WEBGL_PARTICLE_FRAGMENT = `
  uniform vec3 colorA;
  uniform vec3 colorB;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    float distanceFromCenter = distance(vUv, vec2(0.5));
    float alpha = 1.0 - smoothstep(0.34, 0.5, distanceFromCenter);
    vec3 particleColor = mix(colorA, colorB, sin(uTime * 0.12) * 0.5 + 0.5);
    gl_FragColor = vec4(particleColor, alpha * 0.9);
  }
`;

const WEBGL_SURFACE_VERTEX = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const WEBGL_SURFACE_FRAGMENT = `
  uniform vec3 colorA;
  uniform vec3 colorB;
  uniform float uTime;
  uniform float uMode;
  varying vec2 vUv;

  void main() {
    float halftone = sin(vUv.x * 220.0) * sin(vUv.y * 220.0) * 0.5 + 0.5;
    float tinker = sin(vUv.x * 16.0 + uTime * 0.45) * cos(vUv.y * 12.0 - uTime * 0.3) * 0.5 + 0.5;
    vec3 halftoneColor = mix(colorA, colorB, halftone);
    vec3 tinkerColor = mix(colorB, colorA, tinker);
    gl_FragColor = vec4(mix(halftoneColor, tinkerColor, uMode), 0.62);
  }
`;

class ParticleBackground {
  constructor(options = {}) {
    this.mode = MODES[options.mode] ? options.mode : "galaxy";
    this.particleCount = options.particleCount || 9000;
    this.forceWebGL = options.forceWebGL === true;
    this.lastFrameTime = performance.now();
    this.elapsed = 0;
    this.destroyed = false;
    console.info(`${DEBUG_PREFIX} constructing`, {
      mode: this.mode,
      particleCount: this.particleCount,
    });
    this.createScene();
    this.createParticles();
    this.setupRenderer();
    this.setMode(this.mode, true);
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener("resize", this.handleResize);
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(6.5, 3.5, 9);
    this.camera.lookAt(0, 0, 0);
  }

  createParticles() {
    const positions = new Float32Array(this.particleCount * 3);

    for (let index = 0; index < this.particleCount; index += 1) {
      const offset = index * 3;
      const radius = Math.pow(Math.random(), 0.58) * 9;
      const angle = Math.random() * Math.PI * 2;
      positions[offset] = Math.cos(angle) * radius;
      positions[offset + 1] = (Math.random() - 0.5) * 6;
      positions[offset + 2] = Math.sin(angle) * radius;
    }

    this.positions = positions;

    this.colorA = uniform(color(MODES[this.mode].colors[0]));
    this.colorB = uniform(color(MODES[this.mode].colors[1]));
    this.surfaceMode = uniform(0);
    this.material = new THREE.SpriteNodeMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const flow = time.mul(0.12);
    const galaxyMotion = vec3(
      sin(flow).mul(0.12),
      cos(flow.mul(1.7)).mul(0.08),
      sin(flow.mul(0.7)).mul(0.12)
    );
    this.material.positionNode = positionLocal.add(
      galaxyMotion
    );
    this.material.scaleNode = float(1).add(sin(flow).mul(0.35));
    this.material.colorNode = vec4(
      mix(this.colorA, this.colorB, sin(flow).mul(0.5).add(0.5)),
      0.9
    );
    this.geometry = new THREE.PlaneGeometry(0.18, 0.18);
    this.points = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      this.particleCount
    );
    this.instanceHelper = new THREE.Object3D();
    for (let index = 0; index < this.particleCount; index += 1) {
      const offset = index * 3;
      this.instanceHelper.position.set(
        positions[offset],
        positions[offset + 1],
        positions[offset + 2]
      );
      this.instanceHelper.updateMatrix();
      this.points.setMatrixAt(index, this.instanceHelper.matrix);
    }
    this.points.instanceMatrix.needsUpdate = true;
    this.scene.add(this.points);
    this.createGalaxy();
    this.createProceduralSurface();
    console.info(`${DEBUG_PREFIX} shader graph created`, {
      material: this.material.type,
      positionNode: Boolean(this.material.positionNode),
      colorNode: Boolean(this.material.colorNode),
      scaleNode: Boolean(this.material.scaleNode),
    });
  }

  createGalaxy() {
    const galaxyMaterial = new THREE.SpriteNodeMaterial({
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const size = uniform(0.08);
    const radiusRatio = range(0, 1);
    const radius = radiusRatio.pow(1.5).mul(5).toVar();
    const branchAngle = range(0, 3).floor().mul(TWO_PI.div(3));
    const angle = branchAngle.add(time.mul(radiusRatio.oneMinus()));
    const galaxyPosition = vec3(
      cos(angle),
      sin(angle.mul(2)).mul(0.18),
      sin(angle)
    ).mul(radius);
    const randomOffset = range(vec3(-1, -1.5, -1), vec3(1, 1.5, 1))
      .pow3()
      .mul(radiusRatio)
      .add(0.2);
    galaxyMaterial.positionNode = galaxyPosition.add(randomOffset);
    galaxyMaterial.scaleNode = range(0, 1).mul(size);
    galaxyMaterial.colorNode = vec4(
      mix(this.colorA, this.colorB, radiusRatio.oneMinus().pow(2).oneMinus()),
      0.85
    );
    this.galaxyMaterial = galaxyMaterial;
    this.galaxy = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1, 1),
      galaxyMaterial,
      this.particleCount
    );
    this.scene.add(this.galaxy);
  }

  createProceduralSurface() {
    const gridUv = rotate(
      screenCoordinate.xy.div(screenSize.yy).mul(70),
      Math.PI * 0.25
    ).mod(1);
    const orientationStrength = normalWorld
      .dot(vec3(0.35, 1, 0.6).normalize())
      .remapClamp(-0.2, 0.8, 0, 1);
    const halftoneMask = orientationStrength
      .mul(0.9)
      .mul(0.5)
      .step(gridUv.sub(0.5).length());
    const tinkerPattern = sin(
      positionLocal.x.mul(1.8).add(time.mul(0.45))
    )
      .mul(cos(positionLocal.y.mul(1.4).sub(time.mul(0.3))))
      .mul(0.5)
      .add(0.5);
    this.surfaceMaterial = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
    });
    this.surfaceMaterial.outputNode = vec4(
      mix(
        mix(this.colorA, this.colorB, halftoneMask),
        mix(this.colorB, this.colorA, tinkerPattern),
        this.surfaceMode
      ),
      output.a
    );
    this.surface = new THREE.Mesh(
      new THREE.TorusKnotGeometry(3.2, 1.05, 160, 32),
      this.surfaceMaterial
    );
    this.surface.position.z = 0;
    this.surface.visible = false;
    this.surface.rotation.x = 0.45;
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
        console.info(`${DEBUG_PREFIX} wolf halftone mesh loaded`, {
          source: "models/low-poly_wolf_head.glb",
          scale,
        });
      },
      undefined,
      (error) => console.error(`${DEBUG_PREFIX} wolf mesh failed`, error)
    );
  }

  setupRenderer() {
    this.container = document.createElement("div");
    this.container.className = "particle-container";
    document.body.appendChild(this.container);

    const canUseWebGPU = !this.forceWebGL && Boolean(navigator.gpu);
    console.info(`${DEBUG_PREFIX} renderer preference`, {
      forceWebGL: this.forceWebGL,
      available: Boolean(navigator.gpu),
    });

    if (canUseWebGPU) {
      console.info(`${DEBUG_PREFIX} selecting WebGPU renderer`);
      this.renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true });
      this.container.appendChild(this.renderer.domElement);
      this.handleResize();
      this.renderer.setAnimationLoop(() => this.render());
      this.renderer.init().then(() => {
        console.info(`${DEBUG_PREFIX} WebGPU initialized`, {
          backend: "webgpu",
          canvas: `${this.renderer.domElement.width}x${this.renderer.domElement.height}`,
          attached: this.renderer.domElement.parentElement === this.container,
        });
      }).catch((error) => {
        console.error(`${DEBUG_PREFIX} WebGPU initialization failed`, error);
        this.renderer.dispose();
        this.renderer = null;
        this.useWebGLFallback();
      });
      return;
    }

    this.useWebGLFallback();
  }

  useWebGLFallback() {
    if (this.renderer) return;
    console.warn(`${DEBUG_PREFIX} selecting WebGL fallback`);
    this.material.dispose();
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        colorA: { value: new THREE.Color(MODES[this.mode].colors[0]) },
        colorB: { value: new THREE.Color(MODES[this.mode].colors[1]) },
        uTime: { value: 0 },
      },
      vertexShader: WEBGL_PARTICLE_VERTEX,
      fragmentShader: WEBGL_PARTICLE_FRAGMENT,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.points.material = this.material;
    this.galaxyMaterial.dispose();
    this.galaxyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        colorA: { value: new THREE.Color(MODES[this.mode].colors[0]) },
        colorB: { value: new THREE.Color(MODES[this.mode].colors[1]) },
        uTime: { value: 0 },
      },
      vertexShader: WEBGL_PARTICLE_VERTEX,
      fragmentShader: WEBGL_PARTICLE_FRAGMENT,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.galaxy.material = this.galaxyMaterial;
    for (let index = 0; index < this.particleCount; index += 1) {
      const offset = index * 3;
      this.instanceHelper.position.set(
        this.positions[offset],
        this.positions[offset + 1],
        this.positions[offset + 2]
      );
      this.instanceHelper.updateMatrix();
      this.galaxy.setMatrixAt(index, this.instanceHelper.matrix);
    }
    this.galaxy.instanceMatrix.needsUpdate = true;
    this.surfaceMaterial.dispose();
    this.surfaceMaterial = new THREE.ShaderMaterial({
      uniforms: {
        colorA: { value: new THREE.Color(MODES[this.mode].colors[0]) },
        colorB: { value: new THREE.Color(MODES[this.mode].colors[1]) },
        uTime: { value: 0 },
        uMode: { value: this.mode === "tinker" ? 1 : 0 },
      },
      vertexShader: WEBGL_SURFACE_VERTEX,
      fragmentShader: WEBGL_SURFACE_FRAGMENT,
      transparent: true,
      depthWrite: false,
    });
    this.surface.material = this.surfaceMaterial;
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.container.appendChild(this.renderer.domElement);
    this.renderer.setAnimationLoop(() => this.render());
    this.handleResize();
    console.info(`${DEBUG_PREFIX} WebGL initialized`, {
      backend: "webgl",
      canvas: `${this.renderer.domElement.width}x${this.renderer.domElement.height}`,
      attached: this.renderer.domElement.parentElement === this.container,
    });
  }

  setMode(mode, initial = false) {
    if (!MODES[mode]) return;
    this.mode = mode;
    const selected = MODES[mode];
    this.surfaceMode.value = mode === "tinker" ? 1 : 0;
    this.colorA.value.set(selected.colors[0]);
    this.colorB.value.set(selected.colors[1]);
    if (this.material.uniforms) {
      this.material.uniforms.colorA.value.set(selected.colors[0]);
      this.material.uniforms.colorB.value.set(selected.colors[1]);
    }
    if (this.galaxyMaterial.uniforms) {
      this.galaxyMaterial.uniforms.colorA.value.set(selected.colors[0]);
      this.galaxyMaterial.uniforms.colorB.value.set(selected.colors[1]);
    }
    if (this.surfaceMaterial.uniforms) {
      this.surfaceMaterial.uniforms.colorA.value.set(selected.colors[0]);
      this.surfaceMaterial.uniforms.colorB.value.set(selected.colors[1]);
      this.surfaceMaterial.uniforms.uMode.value = mode === "tinker" ? 1 : 0;
    }
    this.galaxy.visible = mode === "galaxy";
    this.points.visible = mode === "attractors";
    if (this.wolf) this.wolf.visible = mode === "halftone";
    this.surface.visible = mode === "tinker" || (mode === "halftone" && !this.wolfLoaded);
    document.documentElement.style.setProperty("--particle-background", selected.background);
    if (!initial && this.renderer) this.render();
  }

  updateAttractors(delta) {
    if (this.mode !== "attractors") return;
    const positions = this.positions;
    const strength = 0.0018;
    for (let index = 0; index < this.particleCount; index += 1) {
      const offset = index * 3;
      const x = positions[offset];
      const y = positions[offset + 1];
      const z = positions[offset + 2];
      const radius = Math.max(1, x * x + y * y + z * z);
      positions[offset] += (-x / radius) * strength * delta * 60;
      positions[offset + 1] += (-y / radius) * strength * delta * 60;
      positions[offset + 2] += (-z / radius) * strength * delta * 60;
      if (radius < 0.25) {
        positions[offset] = (Math.random() - 0.5) * 14;
        positions[offset + 1] = (Math.random() - 0.5) * 7;
        positions[offset + 2] = (Math.random() - 0.5) * 14;
      }
    }
    for (let index = 0; index < this.particleCount; index += 1) {
      const offset = index * 3;
      this.instanceHelper.position.set(
        positions[offset],
        positions[offset + 1],
        positions[offset + 2]
      );
      this.instanceHelper.updateMatrix();
      this.points.setMatrixAt(index, this.instanceHelper.matrix);
    }
    this.points.instanceMatrix.needsUpdate = true;
  }

  render() {
    if (this.destroyed || !this.renderer) return;
    if (!this.hasRendered) {
      this.hasRendered = true;
      console.info(`${DEBUG_PREFIX} first render`, {
        renderer: this.renderer.constructor.name,
        points: this.particleCount,
        attached: this.renderer.domElement.parentElement === this.container,
      });
    }
    const now = performance.now();
    const delta = Math.min((now - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = now;
    this.elapsed += delta;
    if (this.material.uniforms?.uTime) this.material.uniforms.uTime.value = this.elapsed;
    if (this.galaxyMaterial.uniforms?.uTime) this.galaxyMaterial.uniforms.uTime.value = this.elapsed;
    if (this.surfaceMaterial.uniforms?.uTime) this.surfaceMaterial.uniforms.uTime.value = this.elapsed;
    this.updateAttractors(delta);
    this.points.rotation.y += 0.0008;
    this.galaxy.rotation.y += 0.0012;
    this.surface.rotation.y += 0.002;
    if (this.wolf) this.wolf.rotation.y += 0.002;
    if (this.mode === "galaxy") {
      this.camera.position.x = Math.sin(this.elapsed * 0.08) * 6.5;
      this.camera.position.y = 3.5 + Math.cos(this.elapsed * 0.06) * 1.5;
      this.camera.position.z = 9;
      this.camera.lookAt(0, 0, 0);
    }
    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    if (!this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  destroy() {
    this.destroyed = true;
    window.removeEventListener("resize", this.handleResize);
    this.renderer?.setAnimationLoop(null);
    this.renderer?.dispose();
    this.geometry.dispose();
    this.material.dispose();
    this.galaxy.geometry.dispose();
    this.galaxyMaterial.dispose();
    this.surface.geometry.dispose();
    this.surfaceMaterial.dispose();
    this.container?.remove();
  }
}

export { MODES };
export default ParticleBackground;
