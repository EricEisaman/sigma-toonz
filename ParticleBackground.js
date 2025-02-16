const THREE = window.THREE;
console.log(`script.js loaded ...`);

class ParticleBackground {
  constructor(options = {}) {
    // Enhanced configuration with better defaults
    this.config = {
      particleCount: options.particleCount || 3000,
      particleSize: options.particleSize || 0.5,
      speed: options.speed || 0.5,
      opacity: options.opacity || 0.6,
      color: options.color || "#ffffff",
      depth: options.depth || 500,
      backgroundColor: options.backgroundColor || "#000000",
      enableDebug: options.enableDebug,
    };

    // Initialize scene with proper background
    this.initScene();

    // Create particle system with improved visibility
    this.createParticleSystem();

    // Setup renderer with proper background handling
    this.setupRenderer();

    // Start animation
    this.animate();

    // Handle resize events
    window.addEventListener("resize", this.handleResize.bind(this));

    // Handle scroll events
    window.addEventListener("scroll", this.handleScroll.bind(this));

    // Log initialization status
    if (this.config.enableDebug) {
      console.log("ParticleBackground initialized:", {
        config: this.config,
        renderer: this.renderer.domElement,
        scene: this.scene,
        points: this.points,
      });
    }
  }

  initScene() {
    this.scene = new THREE.Scene();
    // Set background to transparent
    this.scene.background = new THREE.Color(this.config.backgroundColor);

    // Add ambient light for better particle visibility
    const ambientLight = new THREE.AmbientLight("#444444");
    this.scene.add(ambientLight);

    // Add directional light for depth
    const directionalLight = new THREE.DirectionalLight("#ffffff", 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = this.config.depth / 2;
  }

  createParticleSystem() {
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this.config.particleCount * 3);

    for (let i = 0; i < this.config.particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * this.config.depth;
      positions[i + 1] = (Math.random() - 0.5) * this.config.depth;
      positions[i + 2] = (Math.random() - 0.5) * this.config.depth;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: this.config.particleSize,
      transparent: true,
      opacity: this.config.opacity,
      color: this.config.color,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false,
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }

  // In your ParticleBackground class, modify the setupRenderer method
  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    // Create container for particles
    const container = document.createElement("div");
    container.className = "particle-container";

    // Set canvas size and add to container
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(this.config.backgroundColor, 0);

    container.appendChild(this.renderer.domElement);
    document.body.appendChild(container);

    // Add scroll handler
    window.addEventListener("scroll", this.handleScroll.bind(this));
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    // Update particle positions
    const positions = this.points.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 2] += this.config.speed;

      if (positions[i + 2] > this.config.depth / 2) {
        positions[i + 2] = -this.config.depth / 2;
      }
    }

    this.points.geometry.attributes.position.needsUpdate = true;

    // Update debug stats
    if (this.config.enableDebug && this.stats) {
      this.stats.textContent = `
FPS: ${Math.round(1000 / 16)} | 
Particles: ${this.config.particleCount} | 
Speed: ${this.config.speed.toFixed(2)}
            `.trim();
    }

    this.renderer.render(this.scene, this.camera);
  }

  // Add handleScroll method
  handleScroll() {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;

    // Calculate normalized scroll position
    const scrollProgress = Math.min(scrollY / windowHeight, 1);

    // Move particles based on scroll
    this.points.position.y = -scrollProgress * this.config.depth;

    // Update camera position
    this.camera.position.y = -scrollProgress * this.config.depth;
  }

  // Modify handleResize method
  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    // Update renderer size
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Reset particle positions
    const positions = this.points.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] = (Math.random() - 0.5) * this.config.depth;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }

  destroy() {
    window.removeEventListener("resize", this.handleResize.bind(this));
    this.renderer.dispose();
    document.body.removeChild(this.renderer.domElement);
    if (this.stats) {
      document.body.removeChild(this.stats);
    }
  }
}
