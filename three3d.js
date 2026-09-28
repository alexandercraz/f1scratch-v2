/* ==================== 3D THREE.JS ==================== */
let threeScene, threeCamera, threeRenderer, threeCar;
let threeWheels = [];
let threeLoaded = false;

function init3D() {
  const canvas3d = document.getElementById('threeCanvas');
  if (!canvas3d) return;

  threeScene = new THREE.Scene();
  threeScene.background = new THREE.Color(0x87ceeb);

  threeCamera = new THREE.PerspectiveCamera(60, canvas3d.clientWidth / canvas3d.clientHeight, 0.1, 1000);
  threeCamera.position.set(0, 2, 4);
  threeCamera.lookAt(0, 0, 0);

  threeRenderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true });
  threeRenderer.setSize(canvas3d.clientWidth, canvas3d.clientHeight);
  threeRenderer.shadowMap.enabled = true;

  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  threeScene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(5, 10, 5);
  sun.castShadow = true;
  threeScene.add(sun);

  const groundGeo = new THREE.PlaneGeometry(100, 100);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x7fb069 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  threeScene.add(ground);

  fetch('car.glb')
    .then(res => res.arrayBuffer())
    .then(buffer => {
      const loader = new THREE.GLTFLoader();
      loader.parse(buffer, '', (gltf) => {
        threeCar = gltf.scene;
        threeCar.scale.set(30, 30, 30);
        threeCar.position.set(0, 0, 0);

        threeCar.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
          const n = (child.name || '').toLowerCase();
          if (n.includes('wheel') || n.includes('tire') || n.includes('tyre')) {
            threeWheels.push(child);
          }
        });

        threeScene.add(threeCar);
        threeLoaded = true;
        document.getElementById('info').textContent = '✅ 3D модель загружена';
        animate3D();
      }, (err) => {
        console.error('Ошибка парсинга:', err);
        document.getElementById('info').textContent = '❌ Ошибка парсинга модели';
      });
    })
    .catch(err => {
      console.error('Ошибка загрузки:', err);
      document.getElementById('info').textContent = '❌ Не удалось загрузить car.glb';
    });
}

function animate3D() {
  requestAnimationFrame(animate3D);

  if (threeCar) {
    threeCar.position.x = 0;
    threeCar.position.z = 0;
    threeCar.rotation.y = -car.angle * Math.PI / 180;
  }

  threeWheels.forEach(w => {
    w.rotation.x += 0.15;
  });

  threeRenderer.render(threeScene, threeCamera);
}

function show3D() {
  const canvas3d = document.getElementById('threeCanvas');
  const canvas2d = document.getElementById('cv');
  if (canvas3d && canvas2d) {
    canvas3d.style.display = 'block';
    canvas2d.style.display = 'none';
  }
  if (!threeLoaded) init3D();
}

function hide3D() {
  const canvas3d = document.getElementById('threeCanvas');
  const canvas2d = document.getElementById('cv');
  if (canvas3d && canvas2d) {
    canvas3d.style.display = 'none';
    canvas2d.style.display = 'block';
  }
}